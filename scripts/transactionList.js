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
    } catch (error) {
        console.error('[loadOrders] Error loading orders:', error);
    }
}

// Call this function when you want to load the orders
// loadOrders();

// Or load automatically when the page loads
// document.addEventListener('DOMContentLoaded', loadOrders);