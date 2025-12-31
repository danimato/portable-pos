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

var currencyParameters = {
    currency: "PHP",
    decimals: 2
}

function cF(strint) {
    var money = Number(strint);
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: currencyParameters.currency, minimumFractionDigits: currencyParameters.decimals, maximumFractionDigits: currencyParameters.decimals

     }).format(money);
}
