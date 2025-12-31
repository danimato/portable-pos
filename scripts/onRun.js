// Check if the user is offline
function checkUserConnection() {
    if (!navigator.onLine) {
        showToast('Connection Lost', 'You are currently offline. Some features may be unavailable.', 1000);
        // You can add additional logic here, like showing a notification
    } else {
        console.log("User is online.");
    }
}

// Listen for online and offline events
window.addEventListener('online', () => showToast('Connection Restored', 'You are now online.', 1000));
window.addEventListener('offline', () => showToast('Connection Lost', 'You are currently offline. Some features may be unavailable.', 1000));



function homeLoader() {
    var container = document.getElementById('homeTransactions');
    loadOrders(container, group = false);
    updateHomeTab();
    var bestSellerContainer = document.getElementById("bestSeller");
    loadBestSellers(bestSellerContainer);
}
homeLoader();