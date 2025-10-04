const Item = require('../models/item');

const generateSkuFromName = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
};

const generateUniqueSku = async (name) => {
  let sku = generateSkuFromName(name);
  let isUnique = false;
  let suffix = 1;

  while (!isUnique) {
    const existingItem = await Item.findOne({ sku });
    if (!existingItem) {
      isUnique = true;
    } else {
      sku = `${generateSkuFromName(name)}-${suffix}`;
      suffix++;
    }
  }

  return sku;
};

module.exports = { generateUniqueSku };
