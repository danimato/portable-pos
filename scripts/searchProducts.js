// Cache products in memory instead of loading every time
let cachedProducts = null;

function loadAllProducts(forceRefresh = false) {
    // Return cached products if available and not forcing refresh
    if (cachedProducts && !forceRefresh) {
        console.log(`Using ${cachedProducts.length} cached products`);
        return Promise.resolve(cachedProducts);
    }
    
    console.log("Loading all products from database");
    return db.getAll("products").then(products => {
        console.log(`Loaded ${products.length} products from database`);
        cachedProducts = products; // Cache the results
        return products;
    });
}

function searchProducts(query) {
    return loadAllProducts().then(productList => {
        var options = {
            keys: ['product_name', 'sku', 'description', 'category'],
            limit: 5
        }
        var fuse = new Fuse(productList, options);
        var result = fuse.search(query);
        return result.map(res => res.item);
    });
}

// Optional: Function to refresh the cache when needed
function refreshProductCache() {
    return loadAllProducts(true);
}

document.getElementById('qrInput').addEventListener('input', (event) => {
    console.log("Input event detected");
    var query = event.target.value;
    searchProducts(query).then(results => {
        var searchElementsDiv = document.getElementById('searchElements');
        searchElementsDiv.innerHTML = '';
            console.log(results);
        results.forEach(product => { 
            var productDiv = document.createElement('div');
            productDiv.className = 'search-product';
            productDiv.dataset.productId = product.product_id;
            var leftDiv = document.createElement("div");
            leftDiv.id = "leftDiv";

            var productNameSpan = document.createElement('span');
            productNameSpan.className = 'product-name';
            productNameSpan.textContent = product.product_name;

            var productSkuSpan = document.createElement('span');
            productSkuSpan.className = 'product-sku';
            productSkuSpan.textContent = ` (SKU: ${product.sku})`;

            leftDiv.appendChild(productNameSpan);
            leftDiv.appendChild(productSkuSpan);


            var rightDiv = document.createElement("div");
            rightDiv.id = "rightDiv";

            var addBtn = document.createElement('button');
            addBtn.className = 'add-to-cart-btn';
            addBtn.textContent = "+";
            addBtn.addEventListener('click', () => {
                fetchProductAndInventory(product.product_id).then(({product, inventory}) => {
                    addToCart(product, inventory);
                    showToast('Product Added', `Added ${product.product_name} to cart.`, 500);
                }).catch(error => {
                    console.error('Error adding product to cart:', error);
                    showToast('Error', 'Failed to add product to cart.', 5000);
                });
            });
            rightDiv.appendChild(addBtn);
            productDiv.appendChild(leftDiv);
            productDiv.appendChild(rightDiv);
            searchElementsDiv.appendChild(productDiv);
        });
    });
});

function fetchProductAndInventory(productId) {
    return db.get("products", productId).then(product => {
        if (!product) {
            return Promise.reject('Product not found');
        }
        return db.get("inventory", productId).then(inventoryItems => {
            return {
                product: product,
                inventory: inventoryItems
            };
        });
    });
}