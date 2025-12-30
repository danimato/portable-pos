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
    document.getElementById("totalSalesValue").innerText = "$" + sum.toFixed(2);
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