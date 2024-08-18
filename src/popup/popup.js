document.addEventListener('DOMContentLoaded', function () {
    // Load saved settings
    chrome.storage.sync.get(['apiKey', 'contextText', 'modelSelection', 'uncertaintyHandling'], function (data) {
        document.getElementById('apiKey').value = data.apiKey || '';
        document.getElementById('contextText').value = data.contextText || '';
        document.getElementById('modelSlider').value = data.modelSelection || 0;
        document.getElementById('uncertaintySlider').value = data.uncertaintyHandling || 0;
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
    const modelSelection = document.getElementById('modelSlider').value;
    const uncertaintyHandling = document.getElementById('uncertaintySlider').value;

    chrome.storage.sync.set({
        apiKey: apiKey,
        contextText: contextText,
        modelSelection: modelSelection,
        uncertaintyHandling: uncertaintyHandling
    }, function () {
        console.log('Settings saved!');
    });
}