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
    decimals: 2,
    rates: { PHP: 1, USD: 1, IDR: 1, MYR: 1, THB: 1 }
}

const currencyLocales = {
    PHP: 'en-PH',
    USD: 'en-US',
    IDR: 'id-ID',
    MYR: 'ms-MY',
    THB: 'th-TH'
};

function cF(strint) {
    var money = Number(strint) * (currencyParameters.rates[currencyParameters.currency] || 1);
    var locale = currencyLocales[currencyParameters.currency] || 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyParameters.currency,
        minimumFractionDigits: currencyParameters.decimals,
        maximumFractionDigits: currencyParameters.decimals
     }).format(money);
}
