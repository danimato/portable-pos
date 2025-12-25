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

      var count = inventoryListTbody.rows.length - 1; // Subtract 1 to exclude the header row
      if (selectedRows.length === 0) {
        document.getElementById('inventoryActionBar').style.display = 'none';
        document.getElementById('selectedCount').textContent = '0 selected';
      }
      else if (selectedRows.length == 1) {
        document.getElementById('selectedCount').textContent = `1 selected`;
        document.getElementById('inventoryActionBar').style.display = 'flex';
        document.getElementById('resetBtn').style.display = 'flex';
        document.getElementById('selectAllBtn').style.display = 'flex';
        document.getElementById('deleteSelectedBtn').style.display = 'flex';
        document.getElementById('showBarcodeOfSelectedBtn').style.display = 'flex';
        document.getElementById('editBtn').style.display = 'flex';
        console.log('Total rows (excluding header):', count);  
      }
      else if (selectedRows.length === count) {
        console.log('All items selected');
        document.getElementById('inventoryActionBar').style.display = 'flex';
        document.getElementById('selectedCount').textContent = `All ${selectedRows.length} selected`;
        document.getElementById('resetBtn').style.display = 'flex';
        document.getElementById('selectAllBtn').style.display = 'none';
        document.getElementById('deleteSelectedBtn').style.display = 'flex';
        document.getElementById('showBarcodeOfSelectedBtn').style.display = 'flex';
        document.getElementById('editBtn').style.display = 'none';
      }
      else if (selectedRows.length > 0) {
        document.getElementById('inventoryActionBar').style.display = 'flex';
        document.getElementById('selectedCount').textContent = `${selectedRows.length} selected`;
        document.getElementById('resetBtn').style.display = 'flex';
        document.getElementById('selectAllBtn').style.display = 'flex';
        document.getElementById('deleteSelectedBtn').style.display = 'flex';
        document.getElementById('showBarcodeOfSelectedBtn').style.display = 'flex';
        document.getElementById('editBtn').style.display = 'none';
      }




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
  var existingProduct = await db.getByIndex('products', 'sku', data.sku);
  existingProduct = existingProduct[0];
  
  if (existingProduct) {
    console.log("editing only")
    await db.update("products", {
      product_id: existingProduct.product_id, 
      product_name: data.productName, 
      description: data.description, 
      category: data.productType, 
      sku: data.sku
    });
    await db.update("inventory", {
      product_id: existingProduct.product_id, 
      price: data.price, 
      current_stock: data.stock
    });
  } else {
    console.log("new product detected")
    const productId = await db.addProduct(data.productName, data.description, data.productType, data.sku);
    await db.addInventory(productId, data.price, data.stock);
  }
  
  refreshInventoryList();
  // DELETED: Lines that were duplicating the add operation
}

// contextual action bar at the bottom
// TODO: states
// when no selection: hide bar
// when one selection: show bar with count, select all, show barcode and edit buttons
// when multiple selection: show bar with count, select all, delete button and show barcode(s) button


function selectAllItems() {
  const checkboxes = inventoryListTbody.querySelectorAll('input[type="checkbox"]');
  selectedRows = [];
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    const productId = checkbox.getAttribute('data-product-id');
    if (!selectedRows.includes(productId)) selectedRows.push(productId);
    const row = checkbox.closest('tr');
    row.style.backgroundColor = 'lightblue';
  });
  document.getElementById('inventoryActionBar').style.display = 'flex';
  document.getElementById('selectedCount').textContent = `${selectedRows.length} selected`;
  document.getElementById('selectAllBtn').style.display = 'none';
  document.getElementById('editBtn').style.display = 'none';
}

function resetSelected() {
  const checkboxes = inventoryListTbody.querySelectorAll('input[type="checkbox"]');

  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
    const productId = checkbox.getAttribute('data-product-id');
    selectedRows = [];
    const row = checkbox.closest('tr');
    row.style.backgroundColor = '';
  });
  document.getElementById('inventoryActionBar').style.display = 'none';
  document.getElementById('selectedCount').textContent = `0 selected`;
}
// Handle click outside the inventory list to reset selection
document.addEventListener('click', (event) => {
  const inventoryListContainer = document.getElementById('inventoryList');
  var ignoreList = [
    inventoryListContainer,
    document.getElementById('inventoryActionBar'),
    document.getElementById('deleter')
  ];
  if (!ignoreList.some(el => el.contains(event.target))) {
    resetSelected();
  }
});

function editSelected() {
  if (selectedRows.length !== 1) {
    alert('Please select exactly one item to edit.');
    return;
  }
  const productId = selectedRows[0];
  showInventoryForm(productId); // Show the inventory form
  updateEntries(productId); // Load the product details into the form
}

document.getElementById('overlay').addEventListener('click', hideDeletePrompt);


// needs reimplementation when localizing to other languages
function deleteSelectedItems() {
  if (selectedRows.length === 0) {
    alert('No items selected for deletion.');
    return;
  }
  if (deleteDontAskAgain) {
    deleteSelectedInventoryItems();
    return;
  }
  document.getElementById('deleter').classList.add('active');
  document.getElementById('overlay').classList.add('active');
  const countItemsElements = document.querySelectorAll('.countItems');
  countItemsElements.forEach(el => {
    el.textContent = selectedRows.length;
  });
  const countItemsPluralElements = document.querySelectorAll('.countItemsPlural');
  countItemsPluralElements.forEach(el => {
    el.textContent = selectedRows.length > 1 ? 's' : '';
  });
}

function deleteSelectedInventoryItems() {
  selectedRows.forEach(async (productId) => {
    await db.delete('products', Number(productId));
    await db.delete('inventory', Number(productId));
  });
  resetSelected();
  refreshInventoryList();
  hideDeletePrompt();
}

function hideDeletePrompt() {
  document.getElementById('deleter').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}