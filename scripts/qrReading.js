productScannedEl = document.getElementById('productScanned');

var beep = new Audio('res/beep.wav');

function onScanSuccess(decodedText, decodedResult) {
    beep.play();
    console.log(`Scan result: ${decodedText}`, decodedResult);
    document.getElementById('qrInput').value = decodedText;
    handleScannedProduct(decodedText);
    var event = new Event('input', {
        bubbles: true,
        cancelable: true
    });
    document.getElementById('qrInput').dispatchEvent(event);

}
var lastValidScanned = null;
var lastScanTime = 0;
var scanDebounceMs = 5000; // Configurable debounce time

function handleScannedProduct(sku) {
    console.log(`Handling scanned product with SKU: ${sku}`);
    
    // Check if this is a duplicate scan within the debounce period
    const now = Date.now();
    if (lastValidScanned === sku && (now - lastScanTime) < scanDebounceMs) {
        console.log(`Ignoring duplicate scan of SKU: ${sku}`);
        return; // Exit early, don't process
    }

    db.getByIndex("products", "sku", sku).then(products => {
    if (products != null && products.length > 0) {
        console.log(products);
        var product = products[0];
        
        // Look up inventory for this product
        db.get("inventory", product.product_id).then(async inventoryItems => {  // ← Added async here
            if (inventoryItems != null) {
                const actualStock = await getActualStock(product.product_id);
                const currentCartQty = cartList[product.product_id] ? cartList[product.product_id].count : 0;
                
                // Check if adding would exceed stock
                if (currentCartQty >= actualStock) {
                    showToast('Out of Stock', `${product.product_name} - Only ${actualStock} in stock`, 3000);
                    return;
                }
                
                // Update scan tracking BEFORE adding to cart
                lastValidScanned = sku;
                lastScanTime = Date.now();
                
                // Add product to cart logic here
                await addToCart(product, inventoryItems);
                showToast('Product Scanned', `SKU: ${sku} ${product.product_name} added to cart.`, 500);
            } else {
                console.warn(`No inventory found for product: ${product.product_name}`);
                showToast('No Inventory', `Product found but no inventory available.`, 1000);
            }
        }).catch(err => {
            console.error('Error looking up inventory:', err);
        });

    } else {
        console.warn(`No product found with SKU: ${sku}`);
        showToast('Product Not Found', `No product found with SKU: ${sku}`, 1000);
    }

    }).catch(err => {
        console.error('Error looking up product by SKU:', err);
        showToast('Error', 'Failed to lookup product.', 1000);
    });
}
// Re-render scanner after handling
var html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10 });
html5QrcodeScanner.render(onScanSuccess);