function bestSellerAlgorithm(a, b) {
    // 70% weight on quantity, 30% weight on revenue
    const scoreA = (a.quantity_sold * 0.7) + (a.total_revenue / 1000 * 0.3);
    const scoreB = (b.quantity_sold * 0.7) + (b.total_revenue / 1000 * 0.3);
    return scoreB - scoreA;
}

function rngForSKU() {
    var params = {
        start: 100000000,
        end: 999999999
    }
    const minCeiled = Math.ceil(params.start);
    const maxFloored = Math.floor(params.end);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}