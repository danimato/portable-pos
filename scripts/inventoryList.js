// safer tbody lookup: uses the <tbody> if present, otherwise falls back
const inventoryListTbody =
  document.querySelector('#inventoryList tbody') ||
  (document.getElementById('inventoryList') && document.getElementById('inventoryList').children[0]);

function clearInventoryListRender() {
  inventoryListTbody.innerHTML = '';
}

async function tableRowTemplate(item, inventory) {
  const tr = document.createElement('tr');

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
  actualStock = await getActualStock(item.product_id);

  const stockTd = document.createElement('td');
  const stock = inventory && inventory.current_stock != null && actualStock ? actualStock : 0;
  stockTd.textContent = stock;
  tr.appendChild(stockTd);

  const priceTd = document.createElement('td');
  const rawPrice = inventory && inventory.price != null ? Number(inventory.price) : null;
  priceTd.textContent = rawPrice != null ? cF(rawPrice) : '—';
  tr.appendChild(priceTd);

  const checkboxTd = document.createElement('td');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.setAttribute('data-product-id', item.product_id);
  checkboxTd.className = 'inventoryCheckbox';
  checkboxTd.appendChild(checkbox);
  tr.appendChild(checkboxTd);

  return tr;
}

async function refreshInventoryList() {
  inventoryListTbody.innerHTML = `
    <tr>
      <th>Item Name</th>
      <th>Stock</th>
      <th>Cost</th>
      <th class="inventoryCheckbox"><!--Select--></th>
    </tr>`;

  var items = await db.getAll('products');
  items = items.filter(p => !p.is_deleted);

  var inventory = await db.getAll('inventory');
  inventory = inventory.filter(p => !p.is_deleted);

  const inventoryMap = new Map();
  for (const inv of inventory) {
    inventoryMap.set(String(inv.product_id), inv);
  }

  for (const item of items) {
    const inv = inventoryMap.get(String(item.product_id));
    const tr = await tableRowTemplate(item, inv);
    inventoryListTbody.appendChild(tr);
  }

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

if (inventoryListTbody) {
  var selectedRows = [];
  var isEditModeEnabled = false;

  const handleCheckboxChange = (event) => {
    if (!isEditModeEnabled) return;
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

      var count = inventoryListTbody.rows.length - 1;
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
      }
      else if (selectedRows.length === count) {
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
    if (!isEditModeEnabled) return;
    const row = event.target.closest('tr');
    if (!row) return;

    const checkbox = row.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    if (event.target === checkbox) return;

    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  };

  inventoryListTbody.addEventListener('change', handleCheckboxChange);
  inventoryListTbody.addEventListener('click', handleRowClick);
}

async function handleNewInventoryItem(data) {
  console.log(selectedRows);
  var existingProduct = selectedRows.length === 1
    ? await db.get('products', Number(selectedRows[0]))
    : null;
  console.log("existingProduct:", existingProduct);

  if (existingProduct) {
    console.log("editing existing product")

    // Get ACTUAL current stock (accounting for sales)
    const actualStock = await getActualStock(existingProduct.product_id);
    
    // Calculate total sold since last restock
    const currentData = await getLastUpdate(existingProduct.product_id);
    const orderItemData = await db.getByIndex("order_items", "product_id", String(existingProduct.product_id));
    const threshold = new Date(currentData.last_restock);
    const ordersAfterRestock = orderItemData.filter((order_item) => {
        const orderTimestamp = getTimestampFromFlakeId(order_item.order_id, flake.timeOffset);
        return orderTimestamp >= threshold;
    });
    const totalSold = ordersAfterRestock.reduce((sum, item) => sum + item.quantity, 0);
    
    // User enters ACTUAL stock (after sales), so calculate DATABASE stock (before sales)
    const newDatabaseStock = Number(data.stock) + totalSold;
    
    // Update product
    await db.update("products", {
      product_id: existingProduct.product_id,
      product_name: data.productName,
      description: data.description,
      category: '',
      sku: data.sku
    });
    
    // Update inventory with DATABASE stock (includes sold items)
    await db.update("inventory", {
      product_id: existingProduct.product_id,
      price: data.price,
      current_stock: newDatabaseStock  // ✅ CORRECT - Database stock = actual + sold
    });

    // Log the stock change based on ACTUAL stock
    const stockChange = Number(data.stock) - actualStock;
    if (stockChange !== 0) {
      await db.logInventoryChange(
        existingProduct.product_id,
        'adjustment',
        stockChange,
        actualStock,
        Number(data.stock),
        `Stock adjusted`,
        data.date
      );
    }

    hideInventoryForm();
    clearEntries();
    resetSelected();
    showToast('Product Edited', 'Product edited successfully.', 5000);

  } else {
    console.log("new product detected")
    const productId = await db.addProduct(data.productName, data.description, '', data.sku);
    await db.addInventory(productId, data.price, data.stock);

    // Log initial stock with custom date
    await db.logInventoryChange(
      productId,
      'initial_stock',
      data.stock,
      0,
      data.stock,
      `Initial stock added`,
      data.date
    );

    showToast('Product Added', 'New product added successfully.', 5000);
  }

  await updateHistoryTable();
  refreshInventoryList();
}

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
    selectedRows = [];
    const row = checkbox.closest('tr');
    row.style.backgroundColor = '';
  });
  document.getElementById('inventoryActionBar').style.display = 'none';
  document.getElementById('selectedCount').textContent = `0 selected`;
}

let isSelecting = false;
document.addEventListener('mousedown', () => { isSelecting = false; });
document.addEventListener('mousemove', () => { isSelecting = true; });

document.addEventListener('click', (event) => {
  if (isSelecting) {
    isSelecting = false;
    return;
  }

  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) return;

  const inventoryListContainer = document.getElementById('inventoryList');
  var ignoreList = [
    inventoryListContainer,
    document.getElementById('inventoryActionBar'),
    document.getElementById('deleter'),
    document.getElementById('inventoryForm')
  ];

  if (!ignoreList.some(el => el.contains(event.target))) {
    resetSelected();
  }
});

function editSelected() {
  if (selectedRows.length !== 1) {
    showToast('Edit Error', 'Please select exactly one item to edit.', 5000);
    return;
  }
  const productId = selectedRows[0];
  showInventoryForm(productId);
  updateEntries(productId);
}

document.getElementById('overlay').addEventListener('click', hideDeletePrompt);

function deleteSelectedItems() {
  if (selectedRows.length === 0) {
    showToast('No Items Selected', 'Please select items to delete.', 5000);
    return;
  }
  if (deleteDontAskAgain) {
    deleteSelectedInventoryItems();
    return;
  }
  document.getElementById('deleter').classList.add('active');
  document.getElementById('overlay').classList.add('active');
  const countItemsElements = document.querySelectorAll('.countItems');
  countItemsElements.forEach(el => { el.textContent = selectedRows.length; });
  const countItemsPluralElements = document.querySelectorAll('.countItemsPlural');
  countItemsPluralElements.forEach(el => { el.textContent = selectedRows.length > 1 ? 's' : ''; });
}

async function deleteSelectedInventoryItems() {
  for (const productId of selectedRows) {
    await db.softDelete('products', Number(productId));
    await db.softDelete('inventory', Number(productId));
  }
  resetSelected();
  refreshInventoryList();
  hideDeletePrompt();
}

function hideDeletePrompt() {
  document.getElementById('deleter').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

function toggleOverflowMenu() {
  const menu = document.getElementById('overflowMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function saveBarcodesAsPng() {
  showBarcodeOfSelected('png');
  toggleOverflowMenu();
}

function printBarcodesToPdf() {
  showBarcodeOfSelected();
  toggleOverflowMenu();
}

document.addEventListener('click', function (event) {
  const menu = document.getElementById('overflowMenu');
  const inventoryActionBar = document.getElementById('inventoryActionBar');
  const img = document.getElementById('overflowMenuImg');
  const pdf = document.getElementById('overflowMenuPdf');
  if (menu && !menu.contains(event.target) && !img.contains(event.target) && !pdf.contains(event.target) && !inventoryActionBar.contains(event.target)) {
    menu.style.display = 'none';
  }
});

async function getLastUpdate(product_id) {
  const product_data = await db.get('products', product_id);
  const inventory_data = await db.get('inventory', product_id);
  const product_history = await db.getInventoryHistory(product_id);

  // Get the most recent RESTOCK/ADJUSTMENT (ignore sales)
  const restockHistory = product_history.filter(entry => 
    entry.change_type === 'adjustment' || 
    entry.change_type === 'initial_stock'
  );
  
  const last_change = restockHistory.length > 0
    ? restockHistory.sort((a, b) => new Date(b.change_date) - new Date(a.change_date))[0]
    : null;

  return {
    last_restock: last_change ? last_change.change_date : null,
    current_stock: inventory_data ? inventory_data.current_stock : 0,
    timestamp: last_change ? new Date(last_change.change_date).toLocaleString() : 'No history',
    change_type: last_change ? last_change.change_type : null,
    quantity_change: last_change ? last_change.quantity_change : 0,
    product_name: product_data ? product_data.product_name : 'Unknown'
  };
}

async function getActualStock(product_id) {
  const currentData = await getLastUpdate(product_id);
  const orderItemData = await db.getByIndex("order_items", "product_id", String(product_id));

  const threshold = new Date(currentData.last_restock);
  const ordersAfterRestock = orderItemData.filter((order_item) => {
    const orderTimestamp = getTimestampFromFlakeId(order_item.order_id, flake.timeOffset);
    return orderTimestamp >= threshold;
  });
  const totalSold = ordersAfterRestock.reduce((sum, item) => sum + item.quantity, 0);
  const actualStock = currentData.current_stock - totalSold;
  return actualStock;
}

async function getStockDecision(current_stock, remaining_stock, threshold_type, threshold) {
  if (remaining_stock === 0) {
    return "RESTOCK";
  } else if ((threshold_type == "%" && (remaining_stock / current_stock) <= threshold) ||
    (threshold_type == "+" && current_stock <= threshold)) {
    return "WARNING";
  } else {
    return "OK";
  }
}

document.querySelector('.inventoryEdit').addEventListener('click', function() {
  isEditModeEnabled = !isEditModeEnabled;
  const tableContainer = document.querySelector('.tableContainer');
  
  if (isEditModeEnabled) {
    this.style.backgroundColor = 'lightblue';
    this.textContent = 'Done Editing';
    tableContainer.classList.add('edit-mode-active');
  } else {
    this.style.backgroundColor = '';
    this.textContent = 'Edit';
    tableContainer.classList.remove('edit-mode-active');
    resetSelected();
  }
});