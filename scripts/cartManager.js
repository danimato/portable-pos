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
        var sum = 0;
        for (product_id of Object.keys(cartList)) {
            sum += cartList[product_id].count * cartList[product_id].price;
        }
        var paymentMethod = document.getElementById("modeOfPaymentChoice").value;
        var total = sum;

        const rate = currencyParameters.rates[currencyParameters.currency] || 1;
        const displayTotal = total * rate;
        const paidDisplay = parseFloat(document.getElementById('cashPaidInput').value) || 0;

        if (paidDisplay === 0) {
            showToast('Amount Required', 'Please enter the amount paid before proceeding.', 3000);
            return;
        }
        if (paidDisplay < displayTotal) {
            showToast('Insufficient Amount', `Amount paid is less than the total due of ${cF(total)}.`, 3000);
            return;
        }

        showReceiptPage(transactionIdNum, transactionDateNum, total, paymentMethod);
    }
    catch (e) {
        showToast('Transaction Error', `An error occured while finishing transaction: ${e}`, 5000);
    }
}

// ---- Receipt page ----
var _receiptTotal = 0;
var _receiptTransId = null;
var _receiptTransDate = null;
var _receiptPaymentMethod = null;
var _receiptCartSnapshot = null;

function showReceiptPage(transId, transDate, total, paymentMethod) {
    _receiptTransId = transId;
    _receiptTransDate = transDate;
    _receiptTotal = total;
    _receiptPaymentMethod = paymentMethod;

    // Snapshot cart before any reset
    _receiptCartSnapshot = {};
    for (var pid of Object.keys(cartList)) {
        _receiptCartSnapshot[pid] = { ...cartList[pid] };
    }

    // Transaction ID
    document.getElementById('receiptTidValue').textContent = transId;

    // Items from cart
    const list = document.getElementById('receiptItemsList');
    list.innerHTML = '';
    document.querySelectorAll('#cart .cart-item').forEach(item => {
        const pid = item.getAttribute('data-product');
        const name = item.querySelector('.cart-item-name')?.textContent || '';
        const sku = item.querySelector('.cart-item-sku')?.textContent?.trim() || '';
        const qty = cartList[pid]?.count || 1;
        const itemTotal = (cartList[pid]?.price || 0) * qty;

        const row = document.createElement('div');
        row.className = 'receipt-item';

        const left = document.createElement('div');
        left.className = 'receipt-item-left';

        const nameEl = document.createElement('span');
        nameEl.className = 'receipt-item-name';
        nameEl.textContent = `x${qty} ${name}`;

        const skuEl = document.createElement('span');
        skuEl.className = 'receipt-item-sku';
        skuEl.textContent = sku;

        left.appendChild(nameEl);
        left.appendChild(skuEl);

        const priceEl = document.createElement('span');
        priceEl.className = 'receipt-item-price';
        priceEl.textContent = cF(itemTotal);

        row.appendChild(left);
        row.appendChild(priceEl);
        list.appendChild(row);
    });

    // Totals
    document.getElementById('receiptAmountDue').textContent = cF(total);

    const rate = currencyParameters.rates[currencyParameters.currency] || 1;
    const displayTotal = total * rate;
    const paidDisplay = parseFloat(document.getElementById('cashPaidInput').value) || 0;
    const changeDisplay = paidDisplay - displayTotal;

    document.getElementById('receiptPaidValue').textContent = paidDisplay > 0 ? cF(paidDisplay / rate) : '—';
    document.getElementById('receiptChangeValue').textContent = changeDisplay >= 0 ? cF(changeDisplay / rate) : '—';

    document.getElementById('receiptPage').classList.remove('hidden');
}

async function _saveReceiptOrder() {
    const cartListForDb = Object.keys(_receiptCartSnapshot).map(pid => ({
        product_id: pid,
        quantity: _receiptCartSnapshot[pid].count,
        price: _receiptCartSnapshot[pid].price
    }));
    await db.createOrder(
        _receiptTransId, _receiptTransDate, _receiptPaymentMethod,
        _receiptTotal, 0, _receiptTotal, cartListForDb, '', 0
    );
}

document.getElementById('receiptBackBtn').addEventListener('click', function () {
    document.getElementById('receiptPage').classList.add('hidden');
});

document.getElementById('receiptHomeBtn').addEventListener('click', async function () {
    try {
        await _saveReceiptOrder();
        document.getElementById('receiptPage').classList.add('hidden');
        document.querySelector('.tablinks[onclick*="home"]').click();
    } catch (e) {
        showToast('Error', `Failed to save order: ${e}`, 5000);
    }
});

document.getElementById('receiptNewTxnBtn').addEventListener('click', async function () {
    try {
        await _saveReceiptOrder();
        document.getElementById('receiptPage').classList.add('hidden');
        document.querySelector('.tablinks[onclick*="\'qr\'"]').click();
    } catch (e) {
        showToast('Error', `Failed to save order: ${e}`, 5000);
    }
});

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

    document.getElementById('cashPaidInput').value = '';
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