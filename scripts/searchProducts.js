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
            keys: ['product_name', 'sku', 'description', 'category']
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
            productDiv.textContent = `Product: ${product.product_name}, SKU: ${product.sku}`;
            searchElementsDiv.appendChild(productDiv);
        });
    });
});
