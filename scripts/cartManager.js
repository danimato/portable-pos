cart = document.getElementById('cart');

cartList = {}

function addToCart(product, inventory) {
    if (cartList[product.product_id]) {
        cartList[product.product_id].count += 1;
        document.querySelector('#cart [data-product="' + product.product_id + '"] .count').textContent = cartList[product.product_id].count;
    } else {
        cartList[product.product_id] = {
            count: 1
        };
        renderNewCartItem(product, inventory);
    }
}

function renderNewCartItem(product, inventory) {
    console.log("Adding to cart:", product);
    
    var productDiv = document.createElement('div');
    productDiv.className = 'cart-item';
    productDiv.setAttribute('data-product', product.product_id);
    
    var contentDiv = document.createElement('div');
    contentDiv.className = 'cart-item-content';

    var nameDiv = document.createElement('span');
    nameDiv.className = 'cart-item-name';
    nameDiv.textContent = product.product_name;
    contentDiv.appendChild(nameDiv);
    
    var skuDiv = document.createElement('span');
    skuDiv.className = 'cart-item-sku';
    skuDiv.textContent = ' (SKU: ' + product.sku + ')';
    contentDiv.appendChild(skuDiv);
    
    // Create counter container
    var counterContainer = document.createElement('div');
    counterContainer.className = 'counter-container';
    
    // Create decrement button
    var decrementBtn = document.createElement('button');
    decrementBtn.className = 'counter-btn';
    decrementBtn.textContent = '−';
    decrementBtn.addEventListener('click', function() {
        var newCount = cartList[product.product_id].count - 1;
        if (newCount > 0) {
            cartList[product.product_id].count = newCount;
            countValue.textContent = newCount;
        } else if (newCount === 0) {
            delete cartList[product.product_id];
            cart.removeChild(productDiv);
        }
    });
    
    // Create count display
    var countValue = document.createElement('div');
    countValue.className = 'counter-value';
    countValue.textContent = cartList[product.product_id].count;
    
    // Create increment button
    var incrementBtn = document.createElement('button');
    incrementBtn.className = 'counter-btn';
    incrementBtn.textContent = '+';
    incrementBtn.addEventListener('click', function() {
        cartList[product.product_id].count++;
        countValue.textContent = cartList[product.product_id].count;
    });
    
    // Assemble counter
    counterContainer.appendChild(decrementBtn);
    counterContainer.appendChild(countValue);
    counterContainer.appendChild(incrementBtn);
    
    var priceDiv = document.createElement('span');
    priceDiv.className = 'cart-item-price';
    console.log("Inventory price:", inventory);
    priceDiv.textContent = ' - $' + parseFloat(inventory.price).toFixed(2);

    productDiv.appendChild(counterContainer);
    productDiv.appendChild(contentDiv);
    productDiv.appendChild(priceDiv);

    cart.appendChild(productDiv);
}