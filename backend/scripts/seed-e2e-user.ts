/** Prints a JWT for an E2E test user (creates user in DB). */
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const email = process.env.E2E_USER_EMAIL || 'e2e-user@stockkeeper.test';
  const password = process.env.E2E_USER_PASSWORD || 'E2eTest123!';

  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 8);
    user = await User.create({
      email,
      username: 'e2e_user',
      password: passwordHash,
    });
  }

  const userId = String(user._id);
  await Item.deleteMany({ userId });
  await StockMovement.deleteMany({ userId });

  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: '2h' }
  );

  process.stdout.write(token);
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
