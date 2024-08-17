// Load saved settings when the popup opens
document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get(['isActive', 'apiKey', 'contextText'], function (data) {
        document.getElementById('activate').checked = data.isActive || false;
        document.getElementById('apiKey').value = data.apiKey || '';
        document.getElementById('contextText').value = data.contextText || '';
    });
});
document.getElementById('triggerFill').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerFill" });
    });
});

// Save settings when the save button is clicked
document.getElementById('saveSettings').addEventListener('click', function () {
    const isActive = document.getElementById('activate').checked;
    const apiKey = document.getElementById('apiKey').value;
    const contextText = document.getElementById('contextText').value;

    chrome.storage.sync.set({
        isActive: isActive,
        apiKey: apiKey,
        contextText: contextText
    }, function () {
        alert('Settings saved!');
    });
});
