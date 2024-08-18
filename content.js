chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message in content.js:", request);

    if (request.action === 'fillForm') {
        const suggestions = request.data;
        console.log("Received suggestions:", suggestions);

        document.querySelectorAll('input[type="text"], textarea, select, input[type="radio"], input[type="checkbox"], input[type="email"], input[type="password"], input[type="number"], input[type="date"], input[type="url"], input[type="tel"]').forEach((element) => {
            const key = element.id || element.name;  // Use either ID or name as the key
            if (key in suggestions) {  // Only update if the key is in suggestions
                const value = suggestions[key];
                console.log(`Filling field with ID: ${key} with value: ${value} (type: ${element.type})`);

                // Use setFieldValue to ensure the value is set properly
                try {
                    if (element.type === 'radio') {
                        console.log(`Setting radio value for key: ${key}, value: ${value}`);
                        setRadioValue(element, value);
                    } else if (element.type === 'checkbox') {
                        console.log(`Setting checkbox value for key: ${key}, value: ${value}`);
                        setCheckboxValue(element, value);
                    } else {
                        setFieldValue(element, value);
                    }
                } catch (error) {
                    console.error(`Error setting value for field with ID: ${key}`, error);
                }
            }
        });
        sendResponse({ success: true });
    }

    if (request.action === "triggerPageFill") {
        console.log("Triggering form filling...");
        triggerPageFilling();
        sendResponse({ success: true });
    }

    if (request.action === "triggerCurrentFieldFilling") {
        console.log("Filling current field...");
        triggerCurrentFieldFilling();
        sendResponse({ success: true });
    }

    // Indicate that the response will be sent asynchronously
    return true;
});

function setFieldValue(element, value) {
    if (element.tagName === 'SELECT') {
        const option = Array.from(element.options).find(opt => opt.value === value || opt.text === value);
        if (option) {
            element.value = option.value;
        }
    } else {
        element.value = value;
    }
}

function setRadioValue(element, value) {
    if (element.value === value) {
        element.checked = true;
    }
}

function setCheckboxValue(element, value) {
    element.checked = value === 'true' || value === true;
}

function extractFieldData(element) {
    const fieldData = {
        id: element.id || element.name,  // Use either ID or name as the key
        label: document.querySelector(`label[for="${element.id}"]`)?.innerText || element.placeholder,
        type: element.type,
        value: element.type === 'checkbox' ? element.checked : element.value,
    };
    console.log("Extracted field data:", fieldData);
    return fieldData;
}

function extractCurrentFieldData() {
    const activeElement = document.activeElement;
    const formData = [extractFieldData(activeElement)]; // Ensure formData is an array
    const websiteText = document.body.innerText;
    return { formData, websiteText };
}

function extractPageData() {
    const formElements = document.querySelectorAll('input[type="text"], textarea, select, input[type="radio"], input[type="checkbox"], input[type="email"], input[type="password"], input[type="number"], input[type="date"], input[type="url"], input[type="tel"]');
    console.log("Extracted form elements:", formElements);

    const formData = Array.from(formElements).map(extractFieldData);
    const websiteText = document.body.innerText;
    return { formData, websiteText };
}

// Extract form data and trigger the form-filling process
function triggerPageFilling() {
    const { formData, websiteText } = extractPageData();
    chrome.runtime.sendMessage({ action: 'processForm', data: formData, websiteText: websiteText }, function (response) {
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

function triggerCurrentFieldFilling() {
    const { formData, websiteText } = extractCurrentFieldData();
    
    chrome.runtime.sendMessage({ action: 'processForm', data: formData, websiteText: websiteText }, function (response) {
        if (response && response.success) {
            console.log("Form data processed successfully.");
        } else {
            console.log("Form data processing failed. Response:", response);
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
