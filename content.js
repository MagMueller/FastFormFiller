chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message in content.js:", request);

    if (request.action === 'fillForm') {
        const suggestions = request.data;
        console.log("Received suggestions:", suggestions);

        document.querySelectorAll('input[type="text"], textarea, select, input[type="radio"], input[type="checkbox"], input[type="email"], input[type="password"], input[type="number"], input[type="date"], input[type="url"], input[type="tel"]').forEach((element) => {
            const key = element.id || element.name;  // Use either ID or name as the key
            const value = suggestions[key] || "unknown";  // Default to "unknown" if the key is not found
            console.log(`Filling field with ID: ${key} with value: ${value} (type: ${element.type})`);

            // Use setFieldValue to ensure the value is set properly
            try {
                if (element.type === 'radio') {
                    if (element.value === value) {
                        element.checked = true;
                    } else {
                        element.checked = false;
                    }
                } else if (element.type === 'checkbox') {
                    element.checked = value.toLowerCase() === 'true';
                } else if (element.tagName.toLowerCase() === 'select') {
                    setSelectValue(element, value);
                } else {
                    setFieldValue(element, value);
                }
            } catch (error) {
                console.error(`Failed to set value for field with ID: ${key}`, error);
            }
        });
        sendResponse({ success: true });
    }

    if (request.action === "triggerFill") {
        console.log("Triggering form filling...");
        triggerFormFilling();
        sendResponse({ success: true });
    }

    // Indicate that the response will be sent asynchronously
    return true;
});

function setFieldValue(element, value) {
    // Use the proper approach for setting values in a React-based environment
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'value').set;
    nativeInputValueSetter.call(element, value);

    // Dispatch proper events
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);

    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);
}

function setSelectValue(element, value) {
    const options = Array.from(element.options);
    const optionToSelect = options.find(option => option.text === value || option.value === value);
    if (optionToSelect) {
        element.value = optionToSelect.value;
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
    } else {
        console.warn(`Option with value "${value}" not found in select element with ID: ${element.id || element.name}`);
    }
}

function extractFormData() {
    const formElements = document.querySelectorAll('input[type="text"], textarea, select, input[type="radio"], input[type="checkbox"], input[type="email"], input[type="password"], input[type="number"], input[type="date"], input[type="url"], input[type="tel"]');
    console.log("Extracted form elements:", formElements);

    const formData = [];
    let currentQuestion = '';

    formElements.forEach((element) => {
        // Check if the previous sibling is a question label
        const previousElement = element.previousElementSibling;
        if (previousElement && previousElement.tagName.toLowerCase() === 'label') {
            currentQuestion = previousElement.innerText;
        }

        // If the element is a radio or checkbox, prepend the question to the label
        let label = document.querySelector(`label[for="${element.id}"]`)?.innerText || element.placeholder;
        if (element.type === 'radio' || element.type === 'checkbox') {
            label = `${currentQuestion} ${label}`;
        }

        const fieldData = {
            id: element.id || element.name,  // Use either ID or name as the key
            label: label,
            type: element.type,
            value: element.type === 'checkbox' ? element.checked : element.value,
        };
        console.log("Extracted field data:", fieldData);
        formData.push(fieldData);
    });

    return formData;
}

// Extract form data and trigger the form-filling process
function triggerFormFilling() {
    const formData = extractFormData();
    chrome.runtime.sendMessage({ action: 'processForm', data: formData }, function (response) {
        if (response && response.success) {
            console.log("Form data processed successfully.");
        } else {
            console.log("Form data processing failed. Response:", response);
            console.log("Type of response:", typeof response);
            if (chrome.runtime.lastError) {
                console.log("Runtime error:", chrome.runtime.lastError.message);
            } else if (response && response.message) {
                console.error("Error processing form data:", response.message);
            } else {
                console.error("Unknown error occurred while processing form data");
            }
        }
    });
}