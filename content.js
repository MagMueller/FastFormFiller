function extractFormData() {
    const formElements = document.querySelectorAll('input[type="text"], textarea, select');
    console.log("Extracted form elements:", formElements);

    return Array.from(formElements).map((element) => {
        const fieldData = {
            id: element.id || element.name,  // Use either ID or name as the key
            label: document.querySelector(`label[for="${element.id}"]`)?.innerText || element.placeholder,
            type: element.type,
            value: element.value,
        };
        console.log("Extracted field data:", fieldData);
        return fieldData;
    });
}

// Extract form data and trigger the form-filling process
function triggerFormFilling() {
    chrome.storage.sync.get('isActive', function (data) {
        console.log("Extension active state:", data.isActive);
        if (data.isActive) {
            const formData = extractFormData();
            chrome.runtime.sendMessage({ action: 'processForm', data: formData }, function (response) {
                if (response.success) {
                    console.log("Form data processed successfully.");
                } else {
                    console.error("Error processing form data:", response.message);
                }
            });
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message in content.js:", request);

    if (request.action === 'fillForm') {
        const suggestions = request.data;
        console.log("Received suggestions:", suggestions);

        document.querySelectorAll('input[type="text"], textarea, select').forEach((element) => {
            const key = element.id || element.name;  // Use either ID or name as the key
            const value = suggestions[key] || "unknown";  // Default to "unknown" if the key is not found
            console.log(`Filling field with ID: ${key} with value: ${value}`);
            element.value = value;
        });
        sendResponse({ success: true });
    }

    if (request.action === "triggerFill") {
        console.log("Triggering form filling...");
        triggerFormFilling();
    }
});
