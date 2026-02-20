// Basic state management
let inventoryHistory = [];
let isEditingExistingProduct = false;
let currentEditingProductId = null;

// Show the inventory form
async function showInventoryForm(productId = '') {
    document.getElementById('inventoryForm').scrollTop = 0;
    document.getElementById('overlay').classList.add('active');
    document.getElementById('inventoryForm').classList.add('active');
    setTodayDate();

    if (productId) {
        // Editing existing product
        isEditingExistingProduct = true;
        currentEditingProductId = productId; 
        
        // Make stock input readonly
        document.getElementById('stock').readOnly = true;
        
        // Show edit stock button
        document.getElementById('editStockBtn').style.display = 'flex';
        document.getElementById('editStockBtn').innerHTML = '<span class="material-symbols-outlined">edit</span>';
        
        // Hide adjustment field initially
        document.getElementById('stockAdjustmentField').style.display = 'none';
        document.getElementById('stockAdjustment').value = '';
        
        // Load inventory history
        await loadInventoryHistory(productId);
    } else {
        // New product
        isEditingExistingProduct = false;
        currentEditingProductId = null; 
        
        // Make stock input editable
        document.getElementById('stock').readOnly = false;
        
        // Hide edit stock button
        document.getElementById('editStockBtn').style.display = 'none';
        
        // Hide adjustment field
        document.getElementById('stockAdjustmentField').style.display = 'none';
        document.getElementById('stockAdjustment').value = '';
        
        // Clear history
        inventoryHistory = [];
        updateHistoryTable();
    }
}

// Hide the inventory form
function hideInventoryForm() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('inventoryForm').classList.remove('active');

     // Reset edit stock button icon
    document.getElementById('editStockBtn').innerHTML = '<span class="material-symbols-outlined">edit</span>';
    document.getElementById('stockAdjustmentField').style.display = 'none';
}

// Close form when clicking overlay
document.getElementById('overlay').addEventListener('click', hideInventoryForm);

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

function updateEntries(productId) {
    productId = Number(productId)
    console.log("Now finding", productId);
    db.get("products", productId).then(product => {
        if (product) {
            document.getElementById('sku').value = product.sku;
            document.getElementById('productName').value = product.product_name;
            document.getElementById('description').value = product.description;

            db.get("inventory", productId).then(inventory => {
                if (inventory) {
                    getActualStock(productId).then(actualStock => {
                        document.getElementById('price').value = inventory.price;
                        document.getElementById('stock').value = actualStock;
                    });
                }
            });
        }
    }).catch(error => {
        console.error('Error fetching product or inventory data:', error);
        showToast('Product Loading Error', 'Failed to load product details.', 5000);
    });
}

// Clear all form entries
function clearEntries() {
    document.getElementById('sku').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('description').value = '';
    document.getElementById('price').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('stockAdjustment').value = '';
    setTodayDate();
    
    // Reset edit mode
    isEditingExistingProduct = false;
    currentEditingProductId = null;  // ← ADD THIS LINE
    document.getElementById('stock').readOnly = false;
    document.getElementById('editStockBtn').style.display = 'none';
    document.getElementById('editStockBtn').innerHTML = '<span class="material-symbols-outlined">edit</span>';
    document.getElementById('stockAdjustmentField').style.display = 'none';
    
    inventoryHistory = [];
    updateHistoryTable();
}

// Confirm and get form data
async function confirmForm() {
    const data = getFormData();

    if (!data.sku || !data.productName) {
        showToast('Empty Fields Error', 'Please fill in the SKU and Product Name fields.', 5000);
        return;
    }

    if (data.price < 0) {
        showToast('Price Input Error', 'Price cannot be negative.', 5000);
        return;
    }

    if (data.stock < 0) {
        showToast('Stock Input Error', 'Stock cannot be negative.', 5000);
        return;
    }

    console.log('Form Data:', data);
    await handleNewInventoryItem(data);

    clearEntries();
}

// Get all form data
function getFormData(callback) {
    const data = {
        sku: document.getElementById('sku').value,
        productName: document.getElementById('productName').value,
        description: document.getElementById('description').value,
        price: document.getElementById('price').value,
        stock: document.getElementById('stock').value,
        date: document.getElementById('date').value
    };

    // Add stock adjustment if editing existing product
    const stockAdjustmentValue = document.getElementById('stockAdjustment').value;
    if (isEditingExistingProduct && stockAdjustmentValue !== '') {
        data.stockAdjustment = Number(stockAdjustmentValue);
    } else {
        data.stockAdjustment = null;
    }

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
            <td>${item.qty}</td>
        </tr>
    `).join('');
}

// Load inventory history from database
async function loadInventoryHistory(productId) {
    try {
        const history = await db.getInventoryHistory(Number(productId));
        
        if (history && history.length > 0) {
            const filteredHistory = history.filter(entry => 
                entry.change_type === 'adjustment' || 
                entry.change_type === 'initial_stock'
            );
            
            if (filteredHistory.length === 0) {
                inventoryHistory = [];
                updateHistoryTable();
                return;
            }
            
            filteredHistory.sort((a, b) => {
                const dateCompare = new Date(b.change_date) - new Date(a.change_date);
                if (dateCompare !== 0) {
                    return dateCompare;
                }
                return b.history_id - a.history_id;
            });
            
            inventoryHistory = filteredHistory.map(entry => {
                const date = new Date(entry.change_date).toLocaleDateString();
                const change = Number(entry.quantity_change);
                
                let stockInfo;
                if (change > 0) {
                    stockInfo = `+${change}`;
                } else if (change < 0) {
                    stockInfo = `${change}`;
                } else {
                    stockInfo = `0`;
                }
                
                return {
                    date: date,
                    qty: stockInfo
                };
            });
        } else {
            inventoryHistory = [];
        }
        
        updateHistoryTable();
    } catch (error) {
        console.error('Error loading inventory history:', error);
        inventoryHistory = [];
        updateHistoryTable();
    }
}

// Edit Stock button functionality
const editStockBtn = document.getElementById('editStockBtn');
const stockAdjustmentField = document.getElementById('stockAdjustmentField');
const stockAdjustmentInput = document.getElementById('stockAdjustment');

editStockBtn.addEventListener('click', function() {
    if (stockAdjustmentField.style.display === 'none') {
        stockAdjustmentField.style.display = 'block';
        stockAdjustmentInput.value = '';
        stockAdjustmentInput.focus();
        editStockBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
    } else {
        stockAdjustmentField.style.display = 'none';
        stockAdjustmentInput.value = '';
        editStockBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
    }
});

// Validation
var priceInput = document.getElementById("price");
var stockInput = document.getElementById("stock");

priceInput.addEventListener("blur", (e) => {
    if (priceInput.value >= 0) return;
    showToast('Price Input Error', 'Price cannot be negative.', 5000);
    e.preventDefault();
    e.target.focus();
});

stockInput.addEventListener("blur", (e) => {
    if (stockInput.value >= 0) return;
    showToast('Stock Input Error', 'Stock cannot be negative.', 5000);
    e.preventDefault();
    e.target.focus();
});

var randomizer = document.getElementById("randomizer");
randomizer.addEventListener("click", () => {
    var randomNumber = rngForSKU();
    document.getElementById('sku').value = randomNumber;
});