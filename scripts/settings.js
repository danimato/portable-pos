const versionString = "v0.0.0-alpha.1-home";
var deleteDontAskAgain = false;
var zoom = 100;
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

    // Setup checkbox toggles
    setupCheckboxToggle(
        document.getElementById('deleteDontAskAgainEl'),
        document.getElementById('deleteDontAskAgain-settings')
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