cart = document.getElementById('cart');

cartList = {}

async function addToCart(product, inventory) {
    const productId = product.product_id;
    
    // Get actual available stock
    const actualStock = await getActualStock(productId);
    
    // Check current quantity in cart
    const currentCartQty = cartList[productId] ? cartList[productId].count : 0;
    
    // Prevent adding if it would exceed stock
    if (currentCartQty >= actualStock) {
        showToast('Out of Stock', `Cannot add more. Only ${actualStock} available.`, 3000);
        return; // Exit early, don't add
    }
    
    // Original logic
    if (cartList[productId]) {
        cartList[productId].count += 1;
        document.querySelector('#cart [data-product="' + productId + '"] .counter-value').textContent = cartList[productId].count;
    } else {
        cartList[productId] = {
            count: 1,
            price: Number(inventory.price)
        };
        updateCheckoutButton();
        renderNewCartItem(product, inventory);
    }
}

function renderNewCartItem(product, inventory) {
    console.log("Adding to cart:", product);

    var productDiv = document.createElement('div');
    productDiv.className = 'cart-item';
    productDiv.setAttribute('data-product', product.product_id);

    var right = document.createElement("div");
    right.className = 'right';

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
        priceDiv.textContent = cF(newPrice);
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
        handleDecrement();
        decrementPressTimer = setTimeout(function () {
            isDecrementLongPress = true;
            decrementIntervalTimer = setInterval(function () {
                handleDecrement();
            }, 100);
        }, 500);
    });

    decrementBtn.addEventListener('mouseup', function () {
        clearTimeout(decrementPressTimer);
        clearInterval(decrementIntervalTimer);
    });

    decrementBtn.addEventListener('mouseleave', function () {
        clearTimeout(decrementPressTimer);
        clearInterval(decrementIntervalTimer);
    });

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

    function handleDecrement() {
        if (!cartList[product.product_id]) {
            updateCheckoutButton();
            clearInterval(decrementIntervalTimer);
            return;
        }

        var newCount = cartList[product.product_id].count - 1;
        var newPrice = parseFloat(inventory.price) * newCount;
        priceDiv.textContent = cF(newPrice);

        if (newCount > 0) {
            cartList[product.product_id].count = newCount;
            countValue.textContent = newCount;
        } else if (newCount === 0) {
            delete cartList[product.product_id];
            cart.removeChild(productDiv);
            updateCheckoutButton();
            clearInterval(decrementIntervalTimer);
        }
    }

    // Create count display
    var countValue = document.createElement('div');
    countValue.className = 'counter-value';
    countValue.textContent = cartList[product.product_id].count;

    // Create increment button with STOCK VALIDATION
    var incrementBtn = document.createElement('button');
    incrementBtn.className = 'counter-btn';
    incrementBtn.textContent = '+';
    
    // ✅ FIX: Add stock validation to click
    incrementBtn.addEventListener('click', async function () {
        const actualStock = await getActualStock(product.product_id);
        const currentCartQty = cartList[product.product_id].count;
        
        if (currentCartQty >= actualStock) {
            showToast('Out of Stock', `Cannot add more. Only ${actualStock} available.`, 3000);
            return;
        }
        
        cartList[product.product_id].count++;
        var newPrice = parseFloat(inventory.price) * cartList[product.product_id].count;
        priceDiv.textContent = cF(newPrice);
        countValue.textContent = cartList[product.product_id].count;
    });

    let pressTimer;
    let isLongPress = false;
    let intervalTimer;

    // ✅ FIX: Add stock validation to mousedown
    incrementBtn.addEventListener('mousedown', async function () {
        const actualStock = await getActualStock(product.product_id);
        let currentCartQty = cartList[product.product_id].count;
        
        if (currentCartQty >= actualStock) {
            showToast('Out of Stock', `Cannot add more. Only ${actualStock} available.`, 3000);
            return;
        }
        
        isLongPress = false;
        cartList[product.product_id].count++;
        updateDisplay();

        pressTimer = setTimeout(function () {
            isLongPress = true;
            intervalTimer = setInterval(async function () {
                const actualStock = await getActualStock(product.product_id);
                const currentCartQty = cartList[product.product_id].count;
                
                if (currentCartQty >= actualStock) {
                    clearInterval(intervalTimer);
                    showToast('Out of Stock', `Cannot add more. Only ${actualStock} available.`, 3000);
                    return;
                }
                
                cartList[product.product_id].count++;
                updateDisplay();
            }, 100);
        }, 500);
    });

    incrementBtn.addEventListener('mouseup', function () {
        clearTimeout(pressTimer);
        clearInterval(intervalTimer);
    });

    incrementBtn.addEventListener('mouseleave', function () {
        clearTimeout(pressTimer);
        clearInterval(intervalTimer);
    });

    // ✅ FIX: Add stock validation to touchstart
    incrementBtn.addEventListener('touchstart', async function (e) {
        e.preventDefault();
        
        const actualStock = await getActualStock(product.product_id);
        let currentCartQty = cartList[product.product_id].count;
        
        if (currentCartQty >= actualStock) {
            showToast('Out of Stock', `Cannot add more. Only ${actualStock} available.`, 3000);
            return;
        }
        
        isLongPress = false;
        cartList[product.product_id].count++;
        updateDisplay();

        pressTimer = setTimeout(function () {
            isLongPress = true;
            intervalTimer = setInterval(async function () {
                const actualStock = await getActualStock(product.product_id);
                const currentCartQty = cartList[product.product_id].count;
                
                if (currentCartQty >= actualStock) {
                    clearInterval(intervalTimer);
                    showToast('Out of Stock', `Cannot add more. Only ${actualStock} available.`, 3000);
                    return;
                }
                
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

    function updateDisplay() {
        var newPrice = parseFloat(inventory.price) * cartList[product.product_id].count;
        priceDiv.textContent = cF(newPrice);
        countValue.textContent = cartList[product.product_id].count;
    }

    // Assemble counter
    counterContainer.appendChild(decrementBtn);
    counterContainer.appendChild(countValue);
    counterContainer.appendChild(incrementBtn);

    var priceDiv = document.createElement('span');
    priceDiv.className = 'cart-item-price';
    console.log("Inventory price:", inventory);
    priceDiv.textContent = cF(inventory.price);

    productDiv.appendChild(counterContainer);
    right.appendChild(contentDiv);
    right.appendChild(priceDiv);
    productDiv.appendChild(right);
    cart.appendChild(productDiv);
}

var nextButton = document.getElementById('qrNextScreen');

function updateCheckoutButton() {
    console.log("called");
    console.log(cartList);
    if (Object.keys(cartList).length === 0) {
        nextButton.classList.add('hidden');
        nextButton.disabled = true;
    } else {
        nextButton.classList.remove('hidden');
        nextButton.disabled = false;
    }
}

var totalPaymentDue = document.getElementById("totalPaymentDue");
var paymentDueBox = document.getElementById("paymentDueBox");
var qrScreen = document.getElementById("qrScreen");
var qrFinishButton = document.getElementById("qrFinishButton");
var qrBackButton = document.getElementById("qrBackButton");

function qrStage2() {
    nextButton.classList.add("hidden");
    paymentDueBox.classList.remove("hidden");
    qrFinishButton.classList.remove("hidden");
    qrBackButton.classList.remove("hidden");
    qrScreen.classList.add("hidden");

    for (el of document.getElementsByClassName("counter-container")) {
        el.classList.add("hidden");
    }

    var sum = 0;
    for (product_id of Object.keys(cartList)) {
        sum += cartList[product_id].count * cartList[product_id].price;
    }
    totalPaymentDue.innerText = cF(sum);
}

async function qrFinish() {
    try {
        console.log(transactionIdNum);
        console.log(transactionDateNum);
        var sum = 0;
        for (product_id of Object.keys(cartList)) {
            sum += cartList[product_id].count * cartList[product_id].price;
        }
        var discountAmount = 0;
        var taxAmount = 0;
        var notes = '';
        total = sum - discountAmount + taxAmount;
        var paymentMethod = document.getElementById("modeOfPaymentChoice").value;

        cartListForDb = [];
        for (product_id of Object.keys(cartList)) {
            cartListForDb.push({
                product_id: product_id,
                quantity: cartList[product_id].count,
                price: cartList[product_id].price
            });
        }
        console.table(transactionIdNum, transactionDateNum, paymentMethod, sum, discountAmount, total, cartListForDb, notes, taxAmount);
        await db.createOrder(transactionIdNum, transactionDateNum, paymentMethod, sum, discountAmount, total, cartListForDb, notes, taxAmount);
        showToast('Transaction Added', `The transaction successfully completed.`, 5000);
        resetQrForm();
    }
    catch (e) {
        showToast('Transaction Error', `An error occured while finishing transaction: ${e}`, 5000)
    }
}

function qrBack() {
    nextButton.classList.remove("hidden");
    paymentDueBox.classList.add("hidden");
    qrFinishButton.classList.add("hidden");
    qrBackButton.classList.add("hidden");
    qrScreen.classList.remove("hidden");

    for (el of document.getElementsByClassName("counter-container")) {
        el.classList.remove("hidden");
    }
}

function resetQrForm() {
    qrBack();
    cart.innerHTML = '';
    cartList = [];
    updateCheckoutButton();

    const input = document.getElementById('qrInput');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    refreshProductCache().then(() => {
        console.log("Product cache refreshed for QR tab");
    });
    transactionIdNum = flake.gen();
    transactionDateNum = new Date().toISOString();
    console.log("transaction Id: ", transactionIdNum);
    document.getElementById("transactionId").innerText = transactionIdNum;
}