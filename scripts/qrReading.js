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
            showToast('Product Scanned', `SKU: ${sku} ${product.product_name} added to cart.`, 500);
        } else {
            console.warn(`No product found with SKU: ${sku}`);
            showToast('Product Not Found', `No product found with SKU: ${sku}`, 1000);
        }
    }).catch(err => {
        console.error('Error looking up product by SKU:', err);
    });

}

var html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10 });
html5QrcodeScanner.render(onScanSuccess);