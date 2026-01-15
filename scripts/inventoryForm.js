// Basic state management
let inventoryHistory = [];

// Show the inventory form
function showInventoryForm(productId = '') {
    document.getElementById('inventoryForm').scrollTop = 0;
    document.getElementById('overlay').classList.add('active');
    document.getElementById('inventoryForm').classList.add('active');
    setTodayDate();

    if (productId) {
        document.getElementById('sku').value = productId;
    }
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

function updateEntries(productId) {
    productId = Number(productId)
    console.log("Now finding", productId);
    db.get("products", productId).then(product => {
        if (product) {
            document.getElementById('sku').value = product.sku;
            document.getElementById('productName').value = product.product_name;
            document.getElementById('productType').value = product.category;
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
    setTodayDate();
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
        return; // Added missing return
    }

    console.log('Form Data:', data);
    await handleNewInventoryItem(data); // Just add await here

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
        date: document.getElementById('date').value
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
})