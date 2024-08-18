document.addEventListener('DOMContentLoaded', function () {
    // Load saved settings
    chrome.storage.sync.get(['apiKey', 'contextText'], function (data) {
        document.getElementById('apiKey').value = data.apiKey || '';
        document.getElementById('contextText').value = data.contextText || '';
    });

    // Load saved shortcuts
    chrome.commands.getAll(commands => {
        console.log("Commands in popup.js:", commands);
        commands.forEach(command => {
            if (command.name === 'trigger_form_filling') {
                document.getElementById('formFillingShortcut').value = command.shortcut;
            } else if (command.name === 'trigger_cell_filling') {
                document.getElementById('cellFillingShortcut').value = command.shortcut;
            }
        });
    });

    // Capture keyboard shortcuts
    document.getElementById('formFillingShortcut').addEventListener('keydown', function (event) {
        event.preventDefault();
        this.value = formatShortcut(event);
    });

    document.getElementById('cellFillingShortcut').addEventListener('keydown', function (event) {
        event.preventDefault();
        this.value = formatShortcut(event);
    });

    // Save settings when fields lose focus
    document.getElementById('apiKey').addEventListener('blur', saveSettings);
    document.getElementById('contextText').addEventListener('blur', saveSettings);
    document.getElementById('formFillingShortcut').addEventListener('blur', saveShortcuts);
    document.getElementById('cellFillingShortcut').addEventListener('blur', saveShortcuts);
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

function saveShortcuts() {
    const formFillingShortcut = document.getElementById('formFillingShortcut').value;
    const cellFillingShortcut = document.getElementById('cellFillingShortcut').value;

    chrome.commands.update({
        name: 'trigger_form_filling',
        shortcut: formFillingShortcut
    }, function () {
        console.log('Form filling shortcut updated to:', formFillingShortcut);
    });

    chrome.commands.update({
        name: 'trigger_cell_filling',
        shortcut: cellFillingShortcut
    }, function () {
        console.log('Cell filling shortcut updated to:', cellFillingShortcut);
    });
}

function formatShortcut(event) {
    const keys = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.shiftKey) keys.push('Shift');
    if (event.altKey) keys.push('Alt');
    if (event.metaKey) keys.push('Cmd'); // Change 'Meta' to 'Cmd'
    keys.push(event.key);
    return keys.join('+');
}