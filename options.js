document.addEventListener('DOMContentLoaded', function () {
    // Load saved shortcuts
    chrome.commands.getAll(commands => {
        console.log("Commands in options.js:", commands);
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

    // Save shortcuts
    document.getElementById('save').addEventListener('click', function () {
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

        alert('Shortcuts saved!');
    });
});

function formatShortcut(event) {
    const keys = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.shiftKey) keys.push('Shift');
    if (event.altKey) keys.push('Alt');
    if (event.metaKey) keys.push('Meta');
    keys.push(event.key);
    return keys.join('+');
}