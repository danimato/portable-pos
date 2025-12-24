// Select the version element
const versionElement = document.querySelector('#version');

// Initialize variables to track clicks and timing
let clickCount = 0;
let clickTimer = null;

// Function to enable tests
function enableTests() {
    if (window.testsEnabled) return; // Prevent multiple enables
    window.testsEnabled = true;
    console.log('Tests enabled!');
    // Add your test enabling logic here
    const testsDiv = document.getElementById('tests');
    testsDiv.classList.remove('hidden');
    showToast('Tests Enabled', 'Here be dragons.', 5000);
}

// Add a click event listener to the version element
versionElement.addEventListener('click', () => {
    clickCount++;

    // Start or reset the timer
    if (!clickTimer) {
        clickTimer = setTimeout(() => {
            clickCount = 0; // Reset click count after 5 seconds
            clickTimer = null;
        }, 5000); // 5 seconds
    }

    // Check if the click count reaches 5
    if (clickCount === 5) {
        clearTimeout(clickTimer); // Clear the timer
        enableTests(); // Enable tests
        clickCount = 0; // Reset click count
        clickTimer = null; // Reset timer
    }
});

function processTest() {
    alert(document.getElementById("select-text").value)
}