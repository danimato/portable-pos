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

function handleScannedProduct(sku) {
    console.log(`Handling scanned product with SKU: ${sku}`);

    db.getByIndex("products", "sku", sku).then(products => {
        if (products != null && products.length > 0) {
            console.log(products);
            var product = products[0]; // Don't redeclare - removed 'var'
            
            // Look up inventory for this product
            db.get("inventory", product.product_id).then(inventoryItems => {
                if (inventoryItems != null) {
                    // add product to cart logic here
                    addToCart(product, inventoryItems);
                    showToast('Product Scanned', `SKU: ${sku} ${product.product_name} added to cart.`, 500);
                } else {
                    console.warn(`No inventory found for product: ${product.product_name}`);
                    showToast('No Inventory', `Product found but no inventory available.`, 1000);
                }
            }).catch(err => {
                console.error('Error looking up inventory:', err);
            });

        } else {
            // This was missing - handles when no product is found
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