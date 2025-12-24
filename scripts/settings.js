const versionString = "v0.0.0-alpha.1"

document.addEventListener('DOMContentLoaded', () => {
    const versionElement = document.getElementById('version-text');
    if (versionElement) {
        versionElement.textContent = versionString;
    }
});