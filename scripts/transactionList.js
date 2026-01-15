// Function to format date as "Month Day, Year"
function formatDate(dateStr) {

    const date = new Date(dateStr);

    const formatted = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return formatted;
}


// Function to group orders by date
function groupOrdersByDate(orders) {
    const grouped = {};

    orders.forEach(order => {
        const dateKey = formatDate(order.order_date);
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(order);
    });

    return grouped;
}

// Function to render a single transaction item
function createTransactionItem(order) {
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transactionItem';

    // Create left section
    const transactionLeft = document.createElement('div');
    transactionLeft.className = 'transactionleft';

    // Create title span
    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = formatDateTime(order.order_date);

    // Create status span
    const statusSpan = document.createElement('span');
    statusSpan.className = 'status';
    statusSpan.textContent = `TID: ${order.order_id} - ${order.status}`;

    transactionLeft.appendChild(titleSpan);
    transactionLeft.appendChild(statusSpan);

    // Create price span
    const priceSpan = document.createElement('span');
    priceSpan.className = 'price';
    priceSpan.textContent = cF(order.total_amount);

    transactionItem.appendChild(transactionLeft);
    transactionItem.appendChild(priceSpan);

    transactionItem.dataset.order_id = order.order_id;
    transactionItem.addEventListener('click', showTransacHistoryForm);
    return transactionItem;
}

// Function to render a date block with its transactions
function createDateBlock(date, orders) {
    const dateBlock = document.createElement('div');
    dateBlock.className = 'dateBlock';

    const dateHeader = document.createElement('div');
    dateHeader.className = 'date';
    dateHeader.textContent = date;
    dateBlock.appendChild(dateHeader);

    orders.forEach(order => {
        const transactionItem = createTransactionItem(order);
        dateBlock.appendChild(transactionItem);
    });

    return dateBlock;
}

// Main function to load and display orders
async function loadOrders(container, group = true) {
    try {


        // Get all orders from database, sorted by created_at descending
        const orders = await db.getAll('orders');
        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
        container.innerHTML = '';
        // Group orders by date
        if (group) {
            const groupedOrders = groupOrdersByDate(orders);
            // Clear existing content
            // Render each date block
            Object.keys(groupedOrders).forEach(date => {
                const dateBlock = createDateBlock(date, groupedOrders[date]);
                container.appendChild(dateBlock);
            });
        } else {
            for (order of orders) {
                //const dateBlock = createDateBlock(date, groupedOrders[date]);
                //container.appendChild(dateBlock);
                console.log(order);
                container.appendChild(createTransactionItem(order));
            };
        }
        return orders;
    } catch (error) {
        console.error('[loadOrders] Error loading orders:', error);
    }
}

// Call this function when you want to load the orders
// loadOrders();

// Or load automatically when the page loads
// document.addEventListener('DOMContentLoaded', loadOrders);


async function showTransacHistoryForm(evt) {
    try {
        var transactionId;
        var currentElement = evt.target;
        var depth = 0;
        var maxDepth = 6;

        // Traverse up the parent elements until we find data-order_id or reach max depth
        while (depth < maxDepth && currentElement) {
            if (currentElement.dataset && currentElement.dataset.order_id) {
                transactionId = currentElement.dataset.order_id;
                break;
            }
            currentElement = currentElement.parentElement;
            depth++;
        }

        if (!transactionId) {
            throw new Error("order_id not found in element or its parents");
        }

        order_data = await db.get("orders", transactionId);
        order_items = await db.getOrderItems(transactionId);
        console.log(order_items);
        await renderTransacHistoryForm(order_data, order_items);
    } catch (e) {
        showToast("Transaction History Form Error", `An error occured while showing the transaction history form: ${e}`, 5000);
    }
}
//var orderDataEl = document.getElementById("orderData");
//var orderItemsPreEl = document.getElementById("orderItemsPre");

async function renderTransacHistoryForm(order_data, order_items) {
    try {
    document.getElementById('overlay').classList.add('active');
    document.getElementById('transacHistoryForm').classList.add('active');

    //orderDataEl.innerText = JSON.stringify(order_data, null, 4);

    //orderItemsPreEl.innerText = JSON.stringify(order_items, null, 4);

    console.log(document.getElementById("transactionId"));
    document.getElementById("transactionId").innerText = order_data["order_id"];
    var orderItemsEl = document.getElementById("orderItems");
    orderItemsEl.innerHTML = '';

    for (const order_item of order_items) {
        const product_data = await db.get("products", parseInt(order_item.product_id));
        console.log(product_data);

        if (!product_data) {
            console.error("Product not found for ID:", order_item.product_id);
            continue;
        }

        // Merge data if needed
        const combined = { ...order_item, ...product_data };
        orderItemsEl.appendChild(orderItemGen(combined));
    }

    document.getElementById("totalRevenue").innerText = cF(order_data.total_amount);
}
catch(e) {
    showToast('Transaction History Form Error', `An error occured while loading the history form: ${e}`, 5000);
}
}
function hideTransacHistoryForm() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('transacHistoryForm').classList.remove('active');
}

// Close form when clicking overlay
document.getElementById('overlay').addEventListener('click', hideTransacHistoryForm);


function orderItemGen(product_data) {
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transactionItem';

    // Create left section
    const transactionLeft = document.createElement('div');
    transactionLeft.className = 'transactionleft';

    // Create title span
    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = `x${product_data.quantity} ${product_data.product_name}`;

    // Create status span
    const statusSpan = document.createElement('span');
    statusSpan.className = 'status';
    statusSpan.textContent = `SKU: ${product_data.sku}`;

    transactionLeft.appendChild(titleSpan);
    transactionLeft.appendChild(statusSpan);

    // Create price span
    const priceSpan = document.createElement('span');
    priceSpan.className = 'price';
    priceSpan.textContent = `${cF(product_data.price * product_data.quantity)}`;

    transactionItem.appendChild(transactionLeft);
    transactionItem.appendChild(priceSpan);

    return transactionItem;
}