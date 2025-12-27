cart = document.getElementById('cart');

cartList = {}

function addToCart(product, inventory) {
    if (cartList[product.product_id]) {
        cartList[product.product_id].count += 1;
        document.querySelector('#cart [data-product="' + product.product_id + '"] .counter-value').textContent = cartList[product.product_id].count;
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
    decrementBtn.addEventListener('click', function () {
        var newCount = cartList[product.product_id].count - 1;
        var newPrice = parseFloat(inventory.price) * newCount;
        priceDiv.textContent = '$' + newPrice.toFixed(2);
        if (newCount > 0) {
            cartList[product.product_id].count = newCount;
            countValue.textContent = newCount;
        } else if (newCount === 0) {
            delete cartList[product.product_id];
            cart.removeChild(productDiv);
        }
    });



    let decrementPressTimer;
    let isDecrementLongPress = false;
    let decrementIntervalTimer;

    decrementBtn.addEventListener('mousedown', function () {
        isDecrementLongPress = false;

        // Initial press - decrement once
        handleDecrement();

        // Start timer for long press detection
        decrementPressTimer = setTimeout(function () {
            isDecrementLongPress = true;
            // Start rapid decrement
            decrementIntervalTimer = setInterval(function () {
                handleDecrement();
            }, 100); // Decrement every 100ms
        }, 500); // Long press triggers after 500ms
    });

    decrementBtn.addEventListener('mouseup', function () {
        clearTimeout(decrementPressTimer);
        clearInterval(decrementIntervalTimer);
    });

    decrementBtn.addEventListener('mouseleave', function () {
        clearTimeout(decrementPressTimer);
        clearInterval(decrementIntervalTimer);
    });

    // Touch support for mobile
    decrementBtn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        isDecrementLongPress = false;

        handleDecrement();

        decrementPressTimer = setTimeout(function () {
            isDecrementLongPress = true;
            decrementIntervalTimer = setInterval(function () {
                handleDecrement();
            }, 100);
        }, 500);
    });

    decrementBtn.addEventListener('touchend', function (e) {
        e.preventDefault();
        clearTimeout(decrementPressTimer);
        clearInterval(decrementIntervalTimer);
    });

    // Helper function to handle decrement logic
    function handleDecrement() {
        // Stop decrementing if item no longer exists
        if (!cartList[product.product_id]) {
            clearInterval(decrementIntervalTimer);
            return;
        }

        var newCount = cartList[product.product_id].count - 1;
        var newPrice = parseFloat(inventory.price) * newCount;
        priceDiv.textContent = '$' + newPrice.toFixed(2);

        if (newCount > 0) {
            cartList[product.product_id].count = newCount;
            countValue.textContent = newCount;
        } else if (newCount === 0) {
            delete cartList[product.product_id];
            cart.removeChild(productDiv);
            clearInterval(decrementIntervalTimer); // Stop interval when removed
        }
    }

    // Create count display
    var countValue = document.createElement('div');
    countValue.className = 'counter-value';
    countValue.textContent = cartList[product.product_id].count;

    // Create increment button
    var incrementBtn = document.createElement('button');
    incrementBtn.className = 'counter-btn';
    incrementBtn.textContent = '+';
    incrementBtn.addEventListener('click', function () {
        cartList[product.product_id].count++;
        var newPrice = parseFloat(inventory.price) * cartList[product.product_id].count;
        priceDiv.textContent = '$' + newPrice.toFixed(2);
        countValue.textContent = cartList[product.product_id].count;
    });


    let pressTimer;
    let isLongPress = false;
    let intervalTimer;

    incrementBtn.addEventListener('mousedown', function () {
        isLongPress = false;

        // Initial press - increment once
        cartList[product.product_id].count++;
        updateDisplay();

        // Start timer for long press detection
        pressTimer = setTimeout(function () {
            isLongPress = true;
            // Start rapid increment
            intervalTimer = setInterval(function () {
                cartList[product.product_id].count++;
                updateDisplay();
            }, 100); // Increment every 100ms
        }, 500); // Long press triggers after 500ms
    });

    incrementBtn.addEventListener('mouseup', function () {
        clearTimeout(pressTimer);
        clearInterval(intervalTimer);
    });

    incrementBtn.addEventListener('mouseleave', function () {
        clearTimeout(pressTimer);
        clearInterval(intervalTimer);
    });

    // Touch support for mobile
    incrementBtn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        isLongPress = false;

        cartList[product.product_id].count++;
        updateDisplay();

        pressTimer = setTimeout(function () {
            isLongPress = true;
            intervalTimer = setInterval(function () {
                cartList[product.product_id].count++;
                updateDisplay();
            }, 100);
        }, 500);
    });

    incrementBtn.addEventListener('touchend', function (e) {
        e.preventDefault();
        clearTimeout(pressTimer);
        clearInterval(intervalTimer);
    });

    // Helper function to update display
    function updateDisplay() {
        var newPrice = parseFloat(inventory.price) * cartList[product.product_id].count;
        priceDiv.textContent = '$' + newPrice.toFixed(2);
        countValue.textContent = cartList[product.product_id].count;
    }



    // Assemble counter
    counterContainer.appendChild(decrementBtn);
    counterContainer.appendChild(countValue);
    counterContainer.appendChild(incrementBtn);

    var priceDiv = document.createElement('span');
    priceDiv.className = 'cart-item-price';
    console.log("Inventory price:", inventory);
    priceDiv.textContent = '$' + parseFloat(inventory.price).toFixed(2);

    productDiv.appendChild(counterContainer);
    productDiv.appendChild(contentDiv);
    productDiv.appendChild(priceDiv);

    cart.appendChild(productDiv);
}