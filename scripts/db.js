
const DB_NAME = 'EcommerceDB';
const DB_VERSION = 1;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;

            // Products store
            if (!db.objectStoreNames.contains('products')) {
                const productsStore = db.createObjectStore('products', {
                    keyPath: 'product_id',
                    autoIncrement: true
                });
                productsStore.createIndex('product_name', 'product_name', { unique: false });
            }

            // Inventory store
            if (!db.objectStoreNames.contains('inventory')) {
                const inventoryStore = db.createObjectStore('inventory', {
                    keyPath: 'product_id'
                });
                inventoryStore.createIndex('current_stock', 'current_stock', { unique: false });
            }

            // Cart store
            if (!db.objectStoreNames.contains('cart')) {
                const cartStore = db.createObjectStore('cart', {
                    keyPath: 'cart_id',
                    autoIncrement: true
                });
                cartStore.createIndex('product_id', 'product_id', { unique: false });
            }

            // Orders store
            if (!db.objectStoreNames.contains('orders')) {
                const ordersStore = db.createObjectStore('orders', {
                    keyPath: 'order_id',
                    autoIncrement: true
                });
                ordersStore.createIndex('cart_id', 'cart_id', { unique: false });
                ordersStore.createIndex('buyer_id', 'buyer_id', { unique: false });
                ordersStore.createIndex('seller_id', 'seller_id', { unique: false });
                ordersStore.createIndex('order_date', 'order_date', { unique: false });
            }

            // Promo store
            if (!db.objectStoreNames.contains('promo')) {
                const promoStore = db.createObjectStore('promo', {
                    keyPath: 'promo_id',
                    autoIncrement: true
                });
                promoStore.createIndex('code', 'code', { unique: true });
                promoStore.createIndex('valid_from', 'valid_from', { unique: false });
                promoStore.createIndex('valid_to', 'valid_to', { unique: false });
            }

            // Order Promo store (junction table)
            if (!db.objectStoreNames.contains('order_promo')) {
                const orderPromoStore = db.createObjectStore('order_promo', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                orderPromoStore.createIndex('order_id', 'order_id', { unique: false });
                orderPromoStore.createIndex('promo_id', 'promo_id', { unique: false });
            }
        };
    });
}



// Generic CRUD operations
function add(storeName, data) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function getAll(storeName) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function get(storeName, key) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function update(storeName, data) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function remove(storeName, key) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
}

function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

// Usage examples:

// Add a product
// add('products', { product_name: 'Laptop' }).then(id => console.log('Product ID:', id));

// Get all products
// getAll('products').then(products => console.log(products));

// Get product by ID
// get('products', 1).then(product => console.log(product));

// Update inventory
// update('inventory', { product_id: 1, current_stock: 50 });

// Add to cart
// add('cart', { product_id: 1, quantity: 2 });

// Create order
// add('orders', {
//   cart_id: 1,
//   buyer_id: 101,
//   seller_id: 201,
//   payment_method: 'credit_card',
//   amount_paid: 1500.00,
//   amount_charged: 1600.00,
//   amount_discount: 100.00,
//   order_date: new Date().toISOString()
// });

// Add promo
// add('promo', {
//   code: 'SAVE20',
//   description: '20% off everything',
//   discount_type: 'percentage',
//   discount_value: 20,
//   valid_from: new Date().toISOString(),
//   valid_to: new Date(Date.now() + 30*24*60*60*1000).toISOString()
// });

// Link promo to order
// add('order_promo', { order_id: 1, promo_id: 1, discount_amount: 100.00 });

// Get orders by buyer
// getByIndex('orders', 'buyer_id', 101).then(orders => console.log(orders));

// Remove from cart
// remove('cart', 1);
