    // safer tbody lookup: uses the <tbody> if present, otherwise falls back
const inventoryListTbody =
  document.querySelector('#inventoryList tbody') ||
  (document.getElementById('inventoryList') && document.getElementById('inventoryList').children[0]);

function clearInventoryListRender() {
  inventoryListTbody.innerHTML = '';
}

async function tableRowTemplate(item, inventory) {
  const tr = document.createElement('tr');
  
  const checkboxTd = document.createElement('td');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.toggleAttribute('data-product-id', item.product_id);
  checkboxTd.className = 'inventoryCheckbox';
  checkboxTd.appendChild(checkbox);
  tr.appendChild(checkboxTd);
  
  const nameTd = document.createElement('td');
  nameTd.textContent = item.product_name ?? '(no name)';
  tr.appendChild(nameTd);
  
  const stockTd = document.createElement('td');
  const stock = inventory && inventory.current_stock != null ? inventory.current_stock : 0;
  stockTd.textContent = stock;
  tr.appendChild(stockTd);
  
  const priceTd = document.createElement('td');
  // 🔥 FIX: Price is in inventory table, not products table
  const rawPrice = inventory && inventory.price != null ? Number(inventory.price) : null;
  priceTd.textContent = rawPrice != null
    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(rawPrice)
    : '—';
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
    // 🔥 FIX: Use item.product_id instead of item.id
    const inv = inventoryMap.get(String(item.product_id));
    console.log('Looking up product_id:', item.product_id, 'Found:', inv);
    
    const tr = await tableRowTemplate(item, inv);
    inventoryListTbody.appendChild(tr);
  }
}
// Add event listener to handle checkbox state changes
inventoryListTbody.addEventListener('change', (event) => {
  if (event.target.type === 'checkbox' && event.target.hasAttribute('data-product-id')) {
    const checkbox = event.target;
    const row = checkbox.closest('tr');
    const productId = checkbox.getAttribute('data-product-id');

    if (checkbox.checked) {
      // Set background color and add to selectedRows
      row.style.backgroundColor = 'lightblue';
      if (!selectedRows.includes(productId)) {
        selectedRows.push(productId);
      }
    } else {
      // Reset background color and remove from selectedRows
      row.style.backgroundColor = '';
      const index = selectedRows.indexOf(productId);
      if (index !== -1) {
        selectedRows.splice(index, 1);
      }
    }
  }
});

// Initialize selectedRows as an empty array
const selectedRows = [];
