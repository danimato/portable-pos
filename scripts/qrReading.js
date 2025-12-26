productScannedEl = document.getElementById('productScanned');
function onScanSuccess(decodedText, decodedResult) {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    document.getElementById('qrInput').value = decodedText;
    handleScannedProduct(decodedText);
}

function handleScannedProduct(sku) {
    // Implement product lookup and addition to cart here
    console.log(`Handling scanned product with SKU: ${sku}`);

    db.getByIndex("products", "sku", sku).then(product => {
        if (product) {
            var product = product[0]; // get the first matching product
            // output scanned product to element
            productScannedEl.textContent = `Scanned Product: ${product.product_name} (SKU: ${product.sku})`;
        } else {
            console.warn(`No product found with SKU: ${sku}`);
        }
    }).catch(err => {
        console.error('Error looking up product by SKU:', err);
    });

    showToast('Product Scanned', `SKU: ${sku} added to cart.`, 500);
}

var html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10 });
html5QrcodeScanner.render(onScanSuccess);