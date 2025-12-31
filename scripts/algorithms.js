function bestSellerAlgorithm(a,b) {
    // 70% weight on quantity, 30% weight on revenue
    const scoreA = (a.quantity_sold * 0.7) + (a.total_revenue / 1000 * 0.3);
    const scoreB = (b.quantity_sold * 0.7) + (b.total_revenue / 1000 * 0.3);
    return scoreB - scoreA;
}

// Function to format time as "Month Day, Year HH:MM:SS"
function formatDateTime(dateStr) {

    const date = new Date(dateStr);

    const dateFormatted = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const timeFormatted = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });


    const result = `${dateFormatted} ${timeFormatted}`;

    return result;
}