// safer tbody lookup: uses the <tbody> if present, otherwise falls back
const inventoryListTbody =
  document.querySelector('#inventoryList tbody') ||
  (document.getElementById('inventoryList') && document.getElementById('inventoryList').children[0]);

function tableRowTemplate(item, inventory) {
  const tr = document.createElement('tr');

  const checkboxTd = document.createElement('td');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'inventoryCheckbox';
  checkboxTd.appendChild(checkbox);
  tr.appendChild(checkboxTd);

  const nameTd = document.createElement('td');
  nameTd.textContent = item.product_name ?? '(no name)';
  console.log('Item name:', item.product_name);
  tr.appendChild(nameTd);

  const stockTd = document.createElement('td');
  const stock = inventory && inventory.current_stock != null ? inventory.current_stock : 0;
  stockTd.textContent = stock;
  console.log('Item stock:', stock);
  tr.appendChild(stockTd);

  const priceTd = document.createElement('td');
  // safe access + formatting fallbacks
  const rawPrice = inventory && inventory.price != null ? Number(inventory.price) : null;
  priceTd.textContent = rawPrice != null
    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(rawPrice)
    : '—';
  console.log('Item price:', rawPrice);
  tr.appendChild(priceTd);

  return tr;
}

async function refreshInventoryList() {
  inventoryListTbody.innerHTML = `
    <tr>
      <th class="inventoryCheckbox"><!--Select--></th>
      <th>Item Name</th>
      <th>Stock</th>
      <th>Cost</th>
    </tr>`;

  const items = await db.getAll('products');
  const inventory = await db.getAll('inventory');

  // normalize keys to strings to avoid type-mismatch issues
  const inventoryMap = new Map();
  for (const inv of inventory) {
    inventoryMap.set(String(inv.product_id), inv);
  }

  for (const item of items) {
    // make sure we lookup with the same key type
    const inv = inventoryMap.get(String(item.id));
    console.table({ itemId: item.id, product_id_match: inv ? inv.product_id : null, inv });
    const tr = tableRowTemplate(item, inv);
    inventoryListTbody.appendChild(tr);
  }
}
