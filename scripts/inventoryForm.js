// Basic state management
let isNewItem = true;
let inventoryHistory = [];

// Show the inventory form
function showInventoryForm() {
    document.getElementById('inventoryForm').scrollTop = 0;
    document.getElementById('overlay').classList.add('active');
    document.getElementById('inventoryForm').classList.add('active');
    setTodayDate();
    updateStockFields();
}

// Hide the inventory form
function hideInventoryForm() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('inventoryForm').classList.remove('active');
}

// Close form when clicking overlay
document.getElementById('overlay').addEventListener('click', hideInventoryForm);

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Update stock fields based on item status
function updateStockFields() {
    const stockField = document.getElementById('stockField');
    const newStockField = document.getElementById('newStockField');
    
    if (isNewItem) {
        stockField.style.display = 'block';
        newStockField.style.display = 'none';
    } else {
        stockField.style.display = 'none';
        newStockField.style.display = 'block';
    }
}

// Toggle between new item and existing item (for demo purposes)
document.getElementById('sku').addEventListener('blur', function() {
    // Simulate checking if SKU exists
    // In real app, this would check against database
    isNewItem = this.value === '' || !inventoryHistory.some(h => h.sku === this.value);
    updateStockFields();
});

// Clear all form entries
function clearEntries() {
    document.getElementById('sku').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('description').value = '';
    document.getElementById('price').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('newStock').value = '';
    setTodayDate();
}

// Confirm and get form data
function confirmForm() {
    const data = getFormData();
    
    if (!data.sku || !data.productName) {
        alert('Please fill in SKU and Product Name');
        return;
    }

    // Add to history
    inventoryHistory.push({
        sku: data.sku,
        date: data.date,
        product: data.productName,
        qty: data.stock || data.newStock
    });

    // Update history table
    updateHistoryTable();

    console.log('Form Data:', data);
    handleNewInventoryItem(data);
    alert('Item added successfully!');
    
    clearEntries();
}

// Get all form data via callback
function getFormData(callback) {
    const data = {
        sku: document.getElementById('sku').value,
        productName: document.getElementById('productName').value,
        productType: document.getElementById('productType').value,
        description: document.getElementById('description').value,
        price: document.getElementById('price').value,
        stock: document.getElementById('stock').value,
        newStock: document.getElementById('newStock').value,
        date: document.getElementById('date').value,
        isNewItem: isNewItem
    };

    if (callback && typeof callback === 'function') {
        callback(data);
    }

    return data;
}

// Update history table
function updateHistoryTable() {
    const tbody = document.getElementById('historyTable');
    
    if (inventoryHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #999;">No history available</td></tr>';
        return;
    }

    tbody.innerHTML = inventoryHistory.map(item => `
        <tr>
            <td>${item.date}</td>
            <td>${item.product} (${item.qty})</td>
        </tr>
    `).join('');
}