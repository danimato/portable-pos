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
  checkbox.setAttribute('data-product-id', item.product_id);
  checkboxTd.className = 'inventoryCheckbox';
  checkboxTd.appendChild(checkbox);
  tr.appendChild(checkboxTd);
  
  const nameTd = document.createElement('td');
  const productNameSpan = document.createElement('span');
  productNameSpan.textContent = item.product_name ?? '(no name)';
  productNameSpan.className = 'product-name';

  const skuSpan = document.createElement('span');
  skuSpan.textContent = ` ${"SKU: " + item.sku ?? 'no SKU'}`;
  skuSpan.className = 'product-sku';

  nameTd.appendChild(productNameSpan);
  nameTd.appendChild(skuSpan);
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
    const tr = await tableRowTemplate(item, inv);
    inventoryListTbody.appendChild(tr);
  }




  // Test 1: render fake items

  if (FillUpInventory) {
    const fakeItems = Array.from({ length: 30 }, (_, i) => ({
      product: {
        product_name: 'Laptop na Mura',
        description: 'minumura ka na',
        category: 'tech',
        sku: '4234723894',
        product_id: i + 3,
      },
      inventory: {
        product_id: i + 3,
        price: '10',
        current_stock: '1',
      },
    }));

    for (const { product, inventory } of fakeItems) {
      const tr = await tableRowTemplate(product, inventory);
      inventoryListTbody.appendChild(tr);
    }
  }
}
// Initialize selectedRows as an empty array

if (inventoryListTbody) {
  var selectedRows = [];

  const handleCheckboxChange = (event) => {
    const checkbox = event.target;
    if (checkbox.type === 'checkbox' && checkbox.hasAttribute('data-product-id')) {
      const row = checkbox.closest('tr');
      const productId = checkbox.getAttribute('data-product-id');

      if (checkbox.checked) {
        if (!selectedRows.includes(productId)) selectedRows.push(productId);
      } else {
        const index = selectedRows.indexOf(productId);
        if (index !== -1) selectedRows.splice(index, 1);
      }

      row.style.backgroundColor = checkbox.checked ? 'lightblue' : '';
    }
  };

  const handleRowClick = (event) => {
    const row = event.target.closest('tr');
    if (!row) return;

    const checkbox = row.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    // prevent double toggle if clicking the checkbox itself
    if (event.target === checkbox) return;

    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  };

  inventoryListTbody.addEventListener('change', handleCheckboxChange);
  inventoryListTbody.addEventListener('click', handleRowClick);
}

async function handleNewInventoryItem(data) {
  const productId = await db.addProduct(data.productName, data.description, data.productType, data.sku);
  await db.addInventory(productId, data.price, data.stock);
  refreshInventoryList();
}

// contextual action bar at the bottom
// TODO: states
// when no selection: hide bar
// when one selection: show bar with count, select all, show barcode and edit buttons
// when multiple selection: show bar with count, select all, delete button and show barcode(s) button
