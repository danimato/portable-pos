const versionString = "v0.0.0-alpha.1-home";
var deleteDontAskAgain = false;
var zoom = 100;
var showLandingPage = true;

function hideLandingPage() {
    const lp = document.getElementById('landingPage');
    if (!lp) return;
    lp.classList.add('fade-out');
    setTimeout(() => lp.classList.add('hidden'), 400);
}

async function toggleShowLandingPage(event) {
    await toggleSetting(
        'showLandingPage',
        ['showLandingPage-settings'],
        (val) => {
            showLandingPage = val;
            localStorage.setItem('qt_showLandingPage', val);
        },
        event
    );
}
// Sync all checkboxes with matching IDs to a value
function syncCheckboxes(ids, value) {
    ids.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.checked = value;
    });
}

// Generic toggle function for any boolean setting
async function toggleSetting(settingKey, checkboxIds, updateCallback, event) {
    const newValue = event.target.checked;

    updateCallback(newValue);
    syncCheckboxes(checkboxIds, newValue);

    try {
        await db.update('settings', {
            setting_key: settingKey,
            setting_value: newValue
        });
    } catch (error) {
        console.error(`Error saving ${settingKey}:`, error);
    }
}

// Exchange rates
const RATES_CACHE_KEY = 'qt_exchangeRates_v2';
const RATES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchExchangeRates() {
    const cached = localStorage.getItem(RATES_CACHE_KEY);
    if (cached) {
        const { rates, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < RATES_CACHE_TTL) {
            currencyParameters.rates = { PHP: 1, ...rates };
            return;
        }
    }
    try {
        const res = await fetch('https://api.frankfurter.app/latest?from=PHP&to=USD,IDR,MYR,THB');
        if (res.ok) {
            const data = await res.json();
            currencyParameters.rates = { PHP: 1, ...data.rates };
            localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
                rates: data.rates,
                timestamp: Date.now()
            }));
            console.log('✓ Exchange rates updated:', data.rates);
        }
    } catch (e) {
        console.warn('Could not fetch exchange rates, using cached or defaults.');
    }
}

// Currency
const currencySymbols = { PHP: '₱', USD: '$', IDR: 'Rp', MYR: 'RM', THB: '฿' };

function updatePriceLabel() {
    const label = document.getElementById('price-label');
    if (label) {
        const symbol = currencySymbols[currencyParameters.currency] || currencyParameters.currency;
        const base = typeof t === 'function' ? t('form_price_base') : 'Price';
        label.textContent = `${base} (${symbol}):`;
    }
}

async function setCurrency(value) {
    currencyParameters.currency = value;
    updatePriceLabel();
    try {
        await db.update('settings', {
            setting_key: 'currency',
            setting_value: value
        });
    } catch (error) {
        console.error('Error saving currency setting:', error);
    }
}

// Specific setting toggles
async function toggleDeleteDontAskAgain(event) {
    await toggleSetting(
        'deleteDontAskAgain',
        ['deleteDontAskAgain-settings', 'deleteDontAskAgain-prompt'],
        (val) => deleteDontAskAgain = val,
        event
    );
}

// Generic checkbox toggle setup
function setupCheckboxToggle(parentElement, checkboxElement) {
    if (!parentElement || !checkboxElement) return;

    parentElement.addEventListener('click', function (e) {
        // Don't toggle if the click was on the checkbox itself
        if (e.target === checkboxElement) return;

        // Toggle the checkbox and dispatch event
        checkboxElement.checked = !checkboxElement.checked;
        checkboxElement.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Set version
    const versionElement = document.getElementById('version-text');
    if (versionElement) {
        versionElement.textContent = versionString;
    }

    // Load deleteDontAskAgain setting
    try {
        const setting = await db.get('settings', 'deleteDontAskAgain');
        if (setting) {
            deleteDontAskAgain = setting.setting_value;
            syncCheckboxes(['deleteDontAskAgain-settings', 'deleteDontAskAgain-prompt'], deleteDontAskAgain);
        }
    } catch (error) {
        console.error('Error loading deleteDontAskAgain setting:', error);
    }

    // Load exchange rates (fetch fresh or use cache)
    await fetchExchangeRates();

    // Load currency setting
    try {
        const setting = await db.get('settings', 'currency');
        if (setting) {
            currencyParameters.currency = setting.setting_value;
            const select = document.getElementById('currency-select');
            if (select) select.value = setting.setting_value;
        }
    } catch (error) {
        console.error('Error loading currency setting:', error);
    }
    updatePriceLabel();

    // Load language setting
    try {
        const langSetting = await db.get('settings', 'language');
        if (langSetting) {
            currentLanguage = langSetting.setting_value;
            const langSelect = document.getElementById('language-select');
            if (langSelect) langSelect.value = langSetting.setting_value;
        }
    } catch (error) {
        console.error('Error loading language setting:', error);
    }
    applyTranslations();

    var zoomInput = document.getElementById("zoom-input");
    // Load zoom setting
    try {
        const setting = await db.get('settings', 'zoom');
        if (setting) {
            zoom = setting.setting_value;
            document.body.style.zoom = zoom + "%";
            zoomInput.value = zoom;
        }
    } catch (error) {
        console.error('Error loading deleteDontAskAgain setting:', error);
    }

    // Load showLandingPage setting
    try {
        const lpSetting = await db.get('settings', 'showLandingPage');
        if (lpSetting) {
            showLandingPage = lpSetting.setting_value;
            syncCheckboxes(['showLandingPage-settings'], showLandingPage);
            localStorage.setItem('qt_showLandingPage', showLandingPage);
        }
        if (!showLandingPage) {
            const lp = document.getElementById('landingPage');
            if (lp) lp.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading showLandingPage setting:', error);
    }

    // Setup checkbox toggles
    setupCheckboxToggle(
        document.getElementById('deleteDontAskAgainEl'),
        document.getElementById('deleteDontAskAgain-settings')
    );
    setupCheckboxToggle(
        document.getElementById('landingPageToggleEl'),
        document.getElementById('showLandingPage-settings')
    );

    zoomInput.addEventListener("change", async () => {
        zoom = zoomInput.value;
        document.body.style.zoom = zoom + "%";


        try {
            await db.update('settings', {
                setting_key: "zoom",
                setting_value: zoomInput.value
            });
        } catch (error) {
            console.error(`Error saving ${settingKey}:`, error);
        }
    })
});