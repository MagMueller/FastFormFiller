// Load saved settings when the popup opens
document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get(['apiKey', 'contextText'], function (data) {
        document.getElementById('apiKey').value = data.apiKey || '';
        document.getElementById('contextText').value = data.contextText || '';
    });
});

document.getElementById('triggerPageFill').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerPageFill" });
    });
});

document.getElementById('triggerCurrentFieldFill').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerCurrentFieldFilling" });
    });
});

// Save settings when the save button is clicked
document.getElementById('saveSettings').addEventListener('click', function () {
    const apiKey = document.getElementById('apiKey').value;
    const contextText = document.getElementById('contextText').value;

    chrome.storage.sync.set({
        apiKey: apiKey,
        contextText: contextText
    }, function () {
        alert('Settings saved!');
    });
});