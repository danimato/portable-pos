const versionString = "v0.0.0-alpha.1-home"
var deleteDontAskAgain = false;

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
    const versionElement = document.getElementById('version-text');
    if (versionElement) {
        versionElement.textContent = versionString;
    }

    // Load the deleteDontAskAgain setting from the database
    try {
        const setting = await db.get('settings', 'deleteDontAskAgain');
        if (setting) {
            deleteDontAskAgain = setting.setting_value;
            syncCheckboxes();
        }
    } catch (error) {
        console.error('Error loading deleteDontAskAgain setting:', error);
    }
});

// Sync all checkboxes to current state
function syncCheckboxes() {
    const settingsCheckbox = document.getElementById('deleteDontAskAgain-settings');
    const promptCheckbox = document.getElementById('deleteDontAskAgain-prompt');
    
    if (settingsCheckbox) settingsCheckbox.checked = deleteDontAskAgain;
    if (promptCheckbox) promptCheckbox.checked = deleteDontAskAgain;
}

// Toggle the setting and save to database
async function toggleDeleteDontAskAgain(event) {
    // Get the checkbox that was actually clicked
    const clickedCheckbox = event?.target || document.activeElement;
    
    // Update the global variable from the clicked checkbox
    deleteDontAskAgain = clickedCheckbox.checked;
    
    // Sync both checkboxes to match
    syncCheckboxes();
    
    // Save to database
    try {
        await db.update('settings', {
            setting_key: 'deleteDontAskAgain',
            setting_value: deleteDontAskAgain
        });
        console.log('deleteDontAskAgain setting saved:', deleteDontAskAgain);
    } catch (error) {
        console.error('Error saving deleteDontAskAgain setting:', error);
    }
}

function setupCheckboxToggle(parentElement, checkboxElement) {
  parentElement.addEventListener('click', function(e) {
    // Don't toggle if the click was on the checkbox itself
    if (e.target === checkboxElement) {
      return;
    }
    
    // Toggle the checkbox
    checkboxElement.checked = !checkboxElement.checked;
    
    // Dispatch the input event
    checkboxElement.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

setupCheckboxToggle(document.getElementById("deleteDontAskAgainEl"), document.getElementById("deleteDontAskAgain-settings"))