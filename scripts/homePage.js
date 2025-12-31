function setActive(button) {
    const buttons = document.querySelectorAll('.focus-box-tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    updateHomeTab();
}

function between(x, min, max) {
    return x >= min && x <= max;
}

async function updateHomeTab() {
    const allOrders = await db.getAll('orders');
    console.log(allOrders);
    const activeElement = document.querySelector('.focus-box-tab-button.active').id;
    var today = new Date();
    var onlyOrders;
    switch (activeElement) {
        case "week":
            onlyOrders = allOrders.filter((transaction) => {
                var { start, end } = getWeekRange(today);
                var daterequest = new Date(transaction.order_date);
                return between(daterequest, start, end);
            });
            console.log(onlyOrders);
            break;
        case "month":
            onlyOrders = allOrders.filter((transaction) => {
                var { start, end } = getMonthRange(today);
                var daterequest = new Date(transaction.order_date);
                console.log(between(daterequest, start, end));
                return between(daterequest, start, end);
            });
            console.log(onlyOrders);

            break;
        case "lifetime":
            onlyOrders = allOrders;
            console.log(onlyOrders);

            break;
    }
    var sum = summer(onlyOrders);
    updateFocusBoxValue(sum);
}

function summer(allOrders) {
    var transactionSum = 0;
    for (transaction of allOrders) {
        transactionSum += transaction.subtotal;
    }
    return transactionSum;
}
function updateFocusBoxValue(sum) {
    document.getElementById("totalSalesValue").innerText = cF(sum);
}


function getWeekRange(date) {
    const tempDate = new Date(date); // Create a copy to avoid mutating input
    const day = tempDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate difference to get to Sunday (start of week)
    const diff = tempDate.getDate() - day;

    const sunday = new Date(tempDate);
    sunday.setDate(diff);
    sunday.setHours(0, 0, 0, 0); // Set to 12:00 AM

    const saturday = new Date(sunday.getTime()); // Use getTime() to create a proper copy
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999); // Set to 11:59:59.999 PM

    console.log(sunday, saturday);

    return {
        start: sunday,
        end: saturday
    };
}

// Get month range
function getMonthRange(date) {
    // First day of month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

    // Last day of month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    console.log(firstDay, lastDay);
    return {
        start: firstDay,
        end: lastDay,
        month: date.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
}

async function getDetailedProductSales() {
    const db = new EcommerceDB();
    await db.init();

    const orderItems = await db.getAll('order_items');
    const products = await db.getAll('products');

    // Aggregate quantities by product_id
    const salesByProduct = orderItems.reduce((acc, item) => {
        const productId = item.product_id;
        if (!acc[productId]) {
            acc[productId] = { quantity: 0, revenue: 0 };
        }
        acc[productId].quantity += item.quantity;
        acc[productId].revenue += item.quantity * item.price;
        return acc;
    }, {});

    // Join with product details
    const detailedSales = products.map(product => ({
        product_id: product.product_id,
        product_name: product.product_name,
        sku: product.sku,
        category: product.category,
        quantity_sold: salesByProduct[product.product_id]?.quantity || 0,
        total_revenue: salesByProduct[product.product_id]?.revenue || 0
    }));

    return detailedSales;
}



// Main function to load and display orders
async function loadBestSellers(container) {
    try {
        container.innerHTML = '';
        var productSales = await getDetailedProductSales();
        productSales.sort((a, b) => {
            return bestSellerAlgorithm(a, b);
        });

        // Display top sellers (optional: limit to top 10)
        const topSellers = productSales.slice(0, 10);

        // Now render topSellers to your container
        // ...
        topSellers.forEach((topSeller, index) => {
            topSeller.top = index + 1;
            console.log(topSeller);
            container.appendChild(bestSellerItemGen(topSeller));
        });
    } catch (error) {
        console.error('[loadBestSellers] Error loading orders:', error);
    }
}


function bestSellerItemGen(product_data) {
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transactionItem';

    // Create left section
    const transactionLeft = document.createElement('div');
    transactionLeft.className = 'transactionleft';

    // Create title span
    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = product_data.product_name;

    // Create status span
    const statusSpan = document.createElement('span');
    statusSpan.className = 'status';
    statusSpan.textContent = `SKU: ${product_data.sku} - Qty: ${product_data.quantity_sold}`;

    transactionLeft.appendChild(titleSpan);
    transactionLeft.appendChild(statusSpan);

    // Create price span
    const priceSpan = document.createElement('span');
    priceSpan.className = 'price';
    priceSpan.textContent = `${product_data.top} - ${cF(product_data.total_revenue)}`;

    transactionItem.appendChild(transactionLeft);
    transactionItem.appendChild(priceSpan);

    return transactionItem;
}