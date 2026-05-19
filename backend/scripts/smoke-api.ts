/**
 * API smoke tests for Stock Keeper.
 * Run: npm run test:api (from backend/)
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Item from '../models/item';
import User from '../models/user';
import StockMovement from '../models/stockMovement';

dotenv.config();

const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const API = `${API_BASE}/api`;

const TEST_EMAIL = `smoke-${Date.now()}@stockkeeper.test`;
const TEST_PASSWORD = 'SmokeTest123!';
const TEST_USERNAME = `smoke_${Date.now()}`;

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

async function request(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const { token: _t, ...fetchOpts } = options;
  return fetch(`${API}${path}`, { ...fetchOpts, headers });
}

async function main(): Promise<void> {
  console.log('\n🧪 Stock Keeper API smoke tests\n');
  console.log(`API: ${API}\n`);

  // Health (no DB required for /health on root - actually health is at /health not /api)
  try {
    const health = await fetch(`${API_BASE}/health`);
    assert(health.ok, `GET /health → ${health.status}`);
  } catch (e) {
    assert(false, `GET /health (is server running?) → ${e}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB\n');

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 8);
  const user = await User.create({
    email: TEST_EMAIL,
    username: TEST_USERNAME,
    password: passwordHash,
  });

  const userId = String(user._id);
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  // Second user for per-user SKU test
  const user2 = await User.create({
    email: `smoke2-${Date.now()}@stockkeeper.test`,
    username: `smoke2_${Date.now()}`,
    password: passwordHash,
  });
  const user2Id = String(user2._id);
  const token2 = jwt.sign(
    { userId: user2Id },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  try {
    // SK-001: Same auto-generated SKU pattern allowed for different users
    const createRes = await request('/items', {
      method: 'POST',
      token,
      body: JSON.stringify({
        name: 'Smoke Widget Alpha',
        quantity: 3,
        lowStockThreshold: 10,
      }),
    });
    assert(createRes.status === 201, `POST /items create → ${createRes.status}`);
    const itemId = (await createRes.json()) as string;
    const createdItem = await Item.findById(itemId);
    assert(!!createdItem, 'created item exists in DB');

    const item2Res = await request('/items', {
      method: 'POST',
      token: token2,
      body: JSON.stringify({
        name: 'Smoke Widget Alpha',
        quantity: 1,
        lowStockThreshold: 0,
      }),
    });
    assert(item2Res.status === 201, `POST /items second user same name → ${item2Res.status}`);
    const item2 = await Item.findById(await item2Res.json());
    assert(
      createdItem!.sku === item2!.sku,
      'both users can have the same SKU slug'
    );

    // SK-002: lowStock filter
    const lowRes = await request('/items?lowStock=true&limit=50', { token });
    assert(lowRes.ok, `GET /items?lowStock=true → ${lowRes.status}`);
    const lowData = (await lowRes.json()) as { items: { quantity: number; lowStockThreshold: number }[] };
    assert(
      Array.isArray(lowData.items) && lowData.items.every(
        (i: { quantity: number; lowStockThreshold: number }) => i.quantity <= i.lowStockThreshold
      ),
      'lowStock filter returns only low-stock items'
    );

    // SK-003: movements filters (record a sale first)
    const saleRes = await request('/sales', {
      method: 'POST',
      token,
      body: JSON.stringify({
        items: [{ sku: createdItem!.sku, quantity: 1 }],
      }),
    });
    assert(saleRes.status === 201, `POST /sales → ${saleRes.status}`);

    const movRes = await request('/movements?type=sale&limit=10&sort=-createdAt', { token });
    assert(movRes.ok, `GET /movements?type=sale → ${movRes.status}`);
    const movData = (await movRes.json()) as { movements?: { type: string }[] };
    const onlySales =
      Array.isArray(movData.movements) &&
      movData.movements.length > 0 &&
      movData.movements.every((m) => m.type === 'sale');
    assert(onlySales, 'movements type filter returns only sales');

    const searchRes = await request('/movements?search=Smoke&limit=10', { token });
    assert(searchRes.ok, `GET /movements?search= → ${searchRes.status}`);

    // SK-009: stats lowStockList
    const statsRes = await request('/stats', { token });
    assert(statsRes.ok, `GET /stats → ${statsRes.status}`);
    const stats = (await statsRes.json()) as { lowStockList?: unknown[] };
    assert(Array.isArray(stats.lowStockList), 'stats includes lowStockList array');

    // SK-005: secure export (header auth, no query token)
    const exportRes = await fetch(`${API_BASE}/api/export/items`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(exportRes.ok, `GET /export/items with Bearer → ${exportRes.status}`);
    const ct = exportRes.headers.get('content-type') || '';
    assert(ct.includes('text/csv'), 'export returns CSV content-type');

    const noAuthExport = await fetch(`${API_BASE}/api/export/items`);
    assert(noAuthExport.status === 401, `GET /export/items without auth → 401`);

    const tokenInUrl = await fetch(`${API_BASE}/api/export/items?token=${token}`);
    assert(
      tokenInUrl.status === 401,
      `GET /export/items?token= query rejected → ${tokenInUrl.status}`
    );

    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Results: ${passed} passed, ${failed} failed\n`);

    if (failed > 0) process.exit(1);
  } finally {
    await Item.deleteMany({ userId: { $in: [userId, user2Id] } });
    await StockMovement.deleteMany({ userId: { $in: [userId, user2Id] } });
    await User.deleteMany({ _id: { $in: [user._id, user2._id] } });
    await mongoose.connection.close();
  }
}

main().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
