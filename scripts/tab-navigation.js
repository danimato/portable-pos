
document.getElementById("home").style.display = "block";
document.getElementById("home").classList.add("active");
var transactionIdNum;
var transactionDateNum;
function openTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    console.table(tablinks);
    for (i = 0; i < tablinks.length; i++) {
        if (tablinks[i].classList.contains("active")) {
            tablinks[i].classList.remove("active");
        }
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");

    if (tabName === 'inventory') {
        // yes we are aware of the bug that causes double rendering here
        // but this is the simplest non working fix for now
        clearInventoryListRender();
        refreshInventoryList();
    } else if (tabName === 'qr') {
        resetQrForm();
    } else if (tabName === "activity") {
        var container = document.getElementById('listOfTransactions');
        loadOrders(container, group = true).then((orders) => {
            console.log(orders);
            if (orders.length == 0) {
                noTransactionsElement = document.createElement("div");
                noTransactionsElement.id = "noTransactions";
                noTransactionsElement.innerText = "Nothing to see here… yet!\nLog your first transaction in the QR tab to get started.";
                container.appendChild(noTransactionsElement);
            }
        });
    } else if (tabName === "home") {
        homeLoader();
    }
    if (tabName != "qr") resetQrForm();
}
