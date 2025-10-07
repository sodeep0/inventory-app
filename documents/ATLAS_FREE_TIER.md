# MongoDB Atlas Free Tier (M0) Compatibility

## ✅ Fully Compatible

This application now works seamlessly with **MongoDB Atlas Free Tier (M0)** without requiring any paid upgrades.

---

## How It Works

### Atomic Operations
Instead of multi-document transactions (which require M10+ tier), we use:

**1. Atomic Updates with `$inc` operator:**
```javascript
Item.findOneAndUpdate(
  { 
    sku: item.sku, 
    userId: req.user._id,
    quantity: { $gte: item.quantity } // Atomic stock check
  },
  { $inc: { quantity: -item.quantity } }, // Atomic decrement
  { new: true }
)
```

**Benefits:**
- **Prevents overselling**: The `$gte` check ensures sufficient stock before deducting
- **Race condition safe**: Multiple concurrent sales won't create negative inventory
- **Single-document atomic**: Works on free tier M0

---

### Manual Rollback Mechanism

For multi-item operations (e.g., selling multiple items at once), we implement a best-effort rollback:

**How it works:**
1. Process items one by one
2. Track successfully processed items
3. If any item fails, attempt to rollback previously processed items
4. Return error to client

**Example (from sales.js):**
```javascript
const processedItems = [];

for (const item of items) {
  const existingItem = await Item.findOneAndUpdate(...);
  
  if (!existingItem) {
    // Rollback previously processed items
    for (const processed of processedItems) {
      await Item.findOneAndUpdate(
        { _id: processed.itemId },
        { $inc: { quantity: processed.quantity } }
      );
      await StockMovement.findByIdAndDelete(processed.movementId);
    }
    throw new Error('Item not found or insufficient stock');
  }
  
  processedItems.push({ itemId, quantity, movementId });
}
```

---

## Limitations & Trade-offs

### ✅ What's Protected:
- **Overselling prevented**: Atomic operations ensure you can't sell more than available
- **Concurrent sales safe**: Multiple users can't oversell the same item
- **Single-item operations**: Fully consistent (create, update, delete single items)

### ⚠️ Edge Cases:
In rare scenarios, partial updates may occur:

**Scenario 1: Multi-item sale failure**
- User tries to sell: Item A (available) + Item B (not available)
- Item A gets deducted, Item B fails
- Manual rollback runs to restore Item A
- **Risk**: If rollback fails (network/database issue), Item A remains deducted

**Scenario 2: System failure during operation**
- Server crashes mid-operation
- Already-processed items updated, remaining items not
- Manual rollback doesn't run

**Impact**: Low probability, but possible data inconsistency in multi-item operations

---

## Best Practices for Free Tier

### 1. Minimize Multi-Item Operations
For highest consistency, encourage single-item transactions when possible.

### 2. Monitor and Audit
- Regularly review stock movements
- Check for discrepancies between items and movements
- Use the movements history to identify issues

### 3. Error Logging
All rollback errors are logged:
```javascript
.catch(err => console.error('Rollback error:', err))
```

Monitor your logs for rollback failures.

### 4. Consider Upgrade Path
For mission-critical production use, consider MongoDB Atlas M10+ tier ($0.08/hour) which provides:
- Full multi-document ACID transactions
- Guaranteed all-or-nothing updates
- Automatic rollback on any failure
- Higher performance and storage

---

## Migration Path to Full Transactions

If you later upgrade to Atlas M10+ tier, you can enable full transactions by:

1. **Wrap operations in sessions:**
```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Your operations with { session } option
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

2. **Remove manual rollback code** (handled automatically by MongoDB)

3. **Test thoroughly** in staging environment

---

## Frequently Asked Questions

### Q: Will my data be safe on free tier?
**A:** Yes, for single-item operations and most multi-item operations. The atomic operations prevent overselling and race conditions.

### Q: What's the actual risk?
**A:** Very low. Partial updates only occur if:
- Multi-item operation fails mid-process AND
- Manual rollback fails (network/database issue) AND
- System doesn't recover

### Q: Should I use this in production?
**A:** 
- **Small business/side projects**: Yes, totally fine
- **High-volume e-commerce**: Consider M10+ for guaranteed consistency
- **Mission-critical inventory**: Strongly recommend M10+ tier

### Q: Can I test this behavior?
**A:** Yes! Try:
1. Create items A and B
2. Set Item B quantity to 0
3. Try to sell both A and B together
4. Item A should rollback, both should remain unchanged

### Q: What if I'm already on M10+?
**A:** The code works on all tiers. M10+ will use the same atomic operations, but you could optionally add full transactions for even stronger guarantees.

---

## Performance Comparison

| Feature | Free Tier (M0) | Paid Tier (M10+) |
|---------|---------------|------------------|
| Atomic single-doc ops | ✅ Full support | ✅ Full support |
| Race condition prevention | ✅ Protected | ✅ Protected |
| Multi-doc consistency | ⚠️ Best-effort | ✅ Guaranteed |
| Rollback mechanism | Manual | Automatic |
| Overselling prevention | ✅ Protected | ✅ Protected |
| Monthly cost | $0 | ~$57/month |

---

## Conclusion

This implementation provides excellent data safety on MongoDB Atlas free tier:
- ✅ Prevents overselling
- ✅ Handles concurrent requests safely
- ✅ Manual rollback for multi-item operations
- ✅ Suitable for most small to medium applications

For applications with high transaction volumes or requiring absolute data consistency guarantees, consider upgrading to M10+ tier.

---

**Last Updated:** October 5, 2025
**Compatibility:** MongoDB Atlas M0, M2, M5, M10+ (all tiers)

