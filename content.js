chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message in content.js:", request);

    if (request.action === 'fillForm') {
        const suggestions = request.data;
        console.log("Received suggestions:", suggestions);

        document.querySelectorAll('input[type="text"], textarea, select, input[type="radio"], input[type="checkbox"], input[type="email"], input[type="password"], input[type="number"], input[type="date"], input[type="url"], input[type="tel"]').forEach((element) => {
            const key = element.id || element.name;  // Use either ID or name as the key
            const value = key in suggestions ? suggestions[key] : "unknown";  // Default to "unknown" if the key is not found
            console.log(`Filling field with ID: ${key} with value: ${value} (type: ${element.type})`);

            // Use setFieldValue to ensure the value is set properly
            try {
                if (element.type === 'radio') {
                    console.log(`Setting radio value for key: ${key}, value: ${value}`);
                    setRadioValue(element, value);
                } else if (element.type === 'checkbox') {
                    console.log(`Setting checkbox value for key: ${key}, value: ${value}`);
                    setCheckboxValue(element, value);
                } else if (element.tagName.toLowerCase() === 'select') {
                    console.log(`Setting select value for key: ${key}, value: ${value}`);
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
    console.debug(`Setting select value for element: ${element.id || element.name}, value: ${value}`);
    const options = Array.from(element.options);
    const optionToSelect = options.find(option => option.text === value || option.value === value);
    if (optionToSelect) {
        element.value = optionToSelect.value;
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
        console.debug(`Successfully set select value to: ${optionToSelect.value}`);
    } else {
        console.warn(`Option with value "${value}" not found in select element with ID: ${element.id || element.name}`);
    }
}

function setRadioValue(element, value) {
    const radioButton = document.querySelector(`input[id="${element.id}"]`);
    if (radioButton && radioButton.type === 'radio') {
        radioButton.checked = value === "true";
        const changeEvent = new Event('change', { bubbles: true });
        radioButton.dispatchEvent(changeEvent);
        console.log(`Successfully set radio button: ${element.id} to ${value}`);
    } else {
        console.log(`No matching radio button found for key: ${element.id}`);
    }
}

function setCheckboxValue(element, value) {
    const checkbox = document.querySelector(`input[id="${element.id}"]`);
    if (checkbox && checkbox.type === 'checkbox') {
        checkbox.checked = value === "true";
        const changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
        console.log(`Successfully set checkbox: ${element.id} to ${value}`);
    } else {
        console.log(`No matching checkbox found for key: ${element.id}`);
    }
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