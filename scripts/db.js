const DB_NAME = 'EcommerceDB';
const DB_VERSION = 2; // Incremented version for schema changes

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

                // Cart store
                if (!db.objectStoreNames.contains('cart')) {
                    const cartStore = db.createObjectStore('cart', {
                        keyPath: 'cart_id',
                        autoIncrement: true
                    });
                    cartStore.createIndex('product_id', 'product_id', { unique: false });
                    cartStore.createIndex('user_id', 'user_id', { unique: false });
                }

                // Orders store
                if (!db.objectStoreNames.contains('orders')) {
                    const ordersStore = db.createObjectStore('orders', {
                        keyPath: 'order_id',
                        autoIncrement: true
                    });
                    ordersStore.createIndex('buyer_id', 'buyer_id', { unique: false });
                    ordersStore.createIndex('seller_id', 'seller_id', { unique: false });
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

                // Promo store
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

                // Order Promo store
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
            sku
        });
        return productId;
    }

    async addInventory(productId, price, stock) {
        return this.add('inventory', {
            product_id: productId,
            price,
            current_stock: stock
        });
    }

    async addToCart(userId, productId, quantity) {
        return this.add('cart', { user_id: userId, product_id: productId, quantity });
    }

    async getCartItems(userId) {
        return this.getByIndex('cart', 'user_id', userId);
    }

    async createOrder(buyerId, sellerId, paymentMethod, amountPaid, amountCharged, amountDiscount, items) {
        const orderId = await this.add('orders', {
            buyer_id: buyerId,
            seller_id: sellerId,
            payment_method: paymentMethod,
            amount_paid: amountPaid,
            amount_charged: amountCharged,
            amount_discount: amountDiscount,
            order_date: new Date().toISOString(),
            status: 'pending'
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

    async getOrdersByBuyer(buyerId) {
        return this.getByIndex('orders', 'buyer_id', buyerId);
    }

    async getOrderItems(orderId) {
        return this.getByIndex('order_items', 'order_id', orderId);
    }

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
        return this.add('order_promo', { order_id: orderId, promo_id: promoId, discount_amount: discountAmount });
    }
}

// Usage
const db = new EcommerceDB();

// Example usage:
/*
(async () => {
    // Add a product with all its info
    const productId = await db.addProduct(
        'Gaming Laptop',
        'High-performance gaming laptop with RTX graphics',
        'Electronics',
        'LAP-001'
    );
    console.log('Product ID:', productId);

    // Add inventory for the product
    await db.addInventory(productId, 1299.99, 50);

    // Add to cart
    await db.addToCart(1, productId, 2);

    // Get cart items
    const cartItems = await db.getCartItems(1);
    console.log('Cart:', cartItems);

    // Create order
    const orderId = await db.createOrder(
        1, // buyer_id
        100, // seller_id
        'credit_card',
        2499.98,
        2599.98,
        100.00,
        [{ product_id: productId, quantity: 2, price: 1299.99 }]
    );

    // Add promo
    const promoId = await db.addPromo(
        'SAVE20',
        '20% off everything',
        'percentage',
        20,
        new Date().toISOString(),
        new Date(Date.now() + 30*24*60*60*1000).toISOString()
    );

    // Apply promo to order
    await db.applyPromoToOrder(orderId, promoId, 100.00);

    // Get orders
    const orders = await db.getOrdersByBuyer(1);
    console.log('Orders:', orders);
})();
*/