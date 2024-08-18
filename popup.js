document.addEventListener('DOMContentLoaded', function () {
    // Load saved settings
    chrome.storage.sync.get(['apiKey', 'contextText'], function (data) {
        document.getElementById('apiKey').value = data.apiKey || '';
        document.getElementById('contextText').value = data.contextText || '';
    });

    // Save settings when the save button is clicked
    document.getElementById('saveSettings').addEventListener('click', function () {
        saveSettings();
        window.close(); // Close the popup after saving
    });
});

function saveSettings() {
    const apiKey = document.getElementById('apiKey').value;
    const contextText = document.getElementById('contextText').value;

    chrome.storage.sync.set({
        apiKey: apiKey,
        contextText: contextText
    }, function () {
        console.log('Settings saved!');
    });
}