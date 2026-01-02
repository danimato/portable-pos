const DB_NAME = 'EcommerceDB';
const DB_VERSION = 6; // Updated version for inventory history

class EcommerceDB {
    constructor() {
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                const oldVersion = e.oldVersion;

                // Products store - core product information
                if (!db.objectStoreNames.contains('products')) {
                    const productsStore = db.createObjectStore('products', {
                        keyPath: 'product_id',
                        autoIncrement: true
                    });
                    productsStore.createIndex('product_name', 'product_name', { unique: false });
                    productsStore.createIndex('category', 'category', { unique: false });
                    productsStore.createIndex('sku', 'sku', { unique: true });
                }

                // Inventory store - stock and pricing information
                if (!db.objectStoreNames.contains('inventory')) {
                    const inventoryStore = db.createObjectStore('inventory', {
                        keyPath: 'product_id'
                    });
                    inventoryStore.createIndex('current_stock', 'current_stock', { unique: false });
                    inventoryStore.createIndex('price', 'price', { unique: false });
                }

                // Remove cart store if it exists (migration from v3)
                if (db.objectStoreNames.contains('cart')) {
                    db.deleteObjectStore('cart');
                }

                // Orders store - now with snowflake IDs
                if (!db.objectStoreNames.contains('orders')) {
                    const ordersStore = db.createObjectStore('orders', {
                        keyPath: 'order_id'
                    });
                    ordersStore.createIndex('order_date', 'order_date', { unique: false });
                    ordersStore.createIndex('status', 'status', { unique: false });
                }

                // Order Items store
                if (!db.objectStoreNames.contains('order_items')) {
                    const orderItemsStore = db.createObjectStore('order_items', {
                        keyPath: 'order_item_id',
                        autoIncrement: true
                    });
                    orderItemsStore.createIndex('order_id', 'order_id', { unique: false });
                    orderItemsStore.createIndex('product_id', 'product_id', { unique: false });
                }

                // Promo store (keep for later implementation)
                if (!db.objectStoreNames.contains('promo')) {
                    const promoStore = db.createObjectStore('promo', {
                        keyPath: 'promo_id',
                        autoIncrement: true
                    });
                    promoStore.createIndex('code', 'code', { unique: true });
                    promoStore.createIndex('valid_from', 'valid_from', { unique: false });
                    promoStore.createIndex('valid_to', 'valid_to', { unique: false });
                    promoStore.createIndex('is_active', 'is_active', { unique: false });
                }

                // Order Promo store (keep for later implementation)
                if (!db.objectStoreNames.contains('order_promo')) {
                    const orderPromoStore = db.createObjectStore('order_promo', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    orderPromoStore.createIndex('order_id', 'order_id', { unique: false });
                    orderPromoStore.createIndex('promo_id', 'promo_id', { unique: false });
                }

                // Settings
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', {
                        keyPath: 'setting_key'
                    });
                    settingsStore.createIndex('setting_value', 'setting_value', { unique: false });
                }

                // Version 5: Add soft delete fields to existing products and inventory
                if (oldVersion < 5) {
                    const transaction = e.target.transaction;

                    // Update existing products
                    if (db.objectStoreNames.contains('products')) {
                        const productsStore = transaction.objectStore('products');
                        productsStore.openCursor().onsuccess = (event) => {
                            const cursor = event.target.result;
                            if (cursor) {
                                const product = cursor.value;
                                if (!product.hasOwnProperty('is_deleted')) {
                                    product.is_deleted = false;
                                    product.deleted_at = null;
                                    cursor.update(product);
                                }
                                cursor.continue();
                            }
                        };
                    }

                    // Update existing inventory
                    if (db.objectStoreNames.contains('inventory')) {
                        const inventoryStore = transaction.objectStore('inventory');
                        inventoryStore.openCursor().onsuccess = (event) => {
                            const cursor = event.target.result;
                            if (cursor) {
                                const inventory = cursor.value;
                                if (!inventory.hasOwnProperty('is_deleted')) {
                                    inventory.is_deleted = false;
                                    inventory.deleted_at = null;
                                    cursor.update(inventory);
                                }
                                cursor.continue();
                            }
                        };
                    }
                }

                // v6: added inventory history
                // Inventory History store - track stock changes
                if (!db.objectStoreNames.contains('inventory_history')) {
                    const inventoryHistoryStore = db.createObjectStore('inventory_history', {
                        keyPath: 'history_id',
                        autoIncrement: true
                    });
                    inventoryHistoryStore.createIndex('product_id', 'product_id', { unique: false });
                    inventoryHistoryStore.createIndex('change_date', 'change_date', { unique: false });
                    inventoryHistoryStore.createIndex('change_type', 'change_type', { unique: false });
                }
            };
        });
    }

    async add(storeName, data) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Soft delete method
    async softDelete(storeName, key) {
        const item = await this.get(storeName, key);
        if (!item) throw new Error('Item not found');

        item.is_deleted = true;
        item.deleted_at = new Date().toISOString();
        return this.update(storeName, item);
    }

    async getByIndex(storeName, indexName, value) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async count(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Helper methods for common operations
    async addProduct(name, description, category, sku) {
        const productId = await this.add('products', {
            product_name: name,
            description,
            category,
            sku,
            is_deleted: false,
            deleted_at: null
        });
        return productId;
    }

    async addInventory(productId, price, stock) {
        return this.add('inventory', {
            product_id: productId,
            price,
            current_stock: stock,
            is_deleted: false,
            deleted_at: null
        });
    }

    async createOrder(orderId, order_date, paymentMethod, subtotal, discountAmount, totalAmount, items, notes = '', taxAmount = 0) {
        await this.add('orders', {
            order_id: orderId,
            order_date: order_date,
            status: 'pending',
            payment_method: paymentMethod,
            subtotal: subtotal,
            discount_amount: discountAmount,
            total_amount: totalAmount,
            notes: notes,
            tax_amount: taxAmount
        });

        // Add order items
        for (const item of items) {
            await this.add('order_items', {
                order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            });
        }

        return orderId;
    }

    async getOrderItems(orderId) {
        return this.getByIndex('order_items', 'order_id', orderId);
    }

    async updateOrderStatus(orderId, status) {
        const order = await this.get('orders', orderId);
        if (!order) throw new Error('Order not found');

        order.status = status;
        return this.update('orders', order);
    }

    // Promo methods (for later implementation)
    async addPromo(code, description, discountType, discountValue, validFrom, validTo) {
        return this.add('promo', {
            code,
            description,
            discount_type: discountType,
            discount_value: discountValue,
            valid_from: validFrom,
            valid_to: validTo,
            is_active: true
        });
    }

    async getPromoByCode(code) {
        const promos = await this.getByIndex('promo', 'code', code);
        return promos[0] || null;
    }

    async applyPromoToOrder(orderId, promoId, discountAmount) {
        return this.add('order_promo', {
            order_id: orderId,
            promo_id: promoId,
            discount_amount: discountAmount
        });
    }

    async logInventoryChange(productId, changeType, quantityChange, previousStock, newStock, notes = '') {
        return this.add('inventory_history', {
            product_id: productId,
            change_type: changeType, // e.g., 'sale', 'restock', 'adjustment', 'return'
            quantity_change: quantityChange,
            previous_stock: previousStock,
            new_stock: newStock,
            change_date: new Date().toISOString(),
            notes: notes
        });
    }

    async getInventoryHistory(productId) {
        return this.getByIndex('inventory_history', 'product_id', productId);
    }
}

// Export for use
const db = new EcommerceDB();

// Example usage:
/*
(async () => {
    // Initialize database
    await db.init();

    // Add a product
    const productId = await db.addProduct(
        'Gaming Laptop',
        'High-performance gaming laptop with RTX graphics',
        'Electronics',
        'LAP-001'
    );
    console.log('Product ID:', productId);

    // Add inventory for the product
    await db.addInventory(productId, 1299.99, 50);

    // Cart is now handled in your application state as:
    // { productId: { price: 1299.99, quantity: 2 } }

    // Create order with snowflake ID
    const orderId = await db.createOrder(
        'credit_card',        // payment_method
        2599.98,              // subtotal
        100.00,               // discount_amount
        2499.98,              // total_amount
        [                     // items array
            { 
                product_id: productId, 
                quantity: 2, 
                price: 1299.99 
            }
        ],
        'Express shipping',   // notes (optional)
        249.99                // tax_amount (optional)
    );
    console.log('Order ID (Snowflake):', orderId);

    // Get order items
    const orderItems = await db.getOrderItems(orderId);
    console.log('Order Items:', orderItems);

    // Update order status
    await db.updateOrderStatus(orderId, 'completed');

    // Get all orders
    const allOrders = await db.getAll('orders');
    console.log('All Orders:', allOrders);
})();
*/