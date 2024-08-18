const formFields = 'input[type="text"], textarea, input[type="email"], input[type="number"], input[type="date"], input[type="url"], input[type="tel"]';
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message in content.js:", request);

    if (request.action === 'fillForm') {
        const suggestions = request.data;
        console.log("Received suggestions:", suggestions);
        // select, input[type="radio"], input[type="checkbox"],
        
        document.querySelectorAll(formFields).forEach((element) => {
            const key = element.id || element.name;  // Use either ID or name as the key
            if (key in suggestions) {  // Only update if the key is in suggestions
                const value = suggestions[key];
                console.log(`Filling field with ID: ${key} with value: ${value} (type: ${element.type})`);
                try {
                    setFieldValue(element, value);
                } catch (error) {
                    console.error(`Error setting value for field with ID: ${key} with value: ${value}`, error);
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

function findQuestionForInput(inputElement) {
    console.log("Finding question for input:", inputElement);
    if (inputElement.id) {
        const label = document.querySelector(`label[for="${inputElement.id}"]`);
        console.log("Found question via for= label:", label);
        if (label) {
            return label.innerText.trim();
        }
    }
    
    if (inputElement.hasAttribute('aria-labelledby')) {
        const labelId = inputElement.getAttribute('aria-labelledby');
        const ariaLabel = document.getElementById(labelId);
        console.log("Found question via aria-labelledby:", ariaLabel);
        if (ariaLabel) {
            return ariaLabel.innerText.trim();
        }
    }
    
    return null;
}
function setFieldValue(element, value) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
}


function extractFieldData(element) {
    const fieldData = {
        id: element.id || element.name,  // Use either ID or name as the key
        label: findQuestionForInput(element),
        type: element.type
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
    const formElements = document.querySelectorAll(formFields);

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
                console.log("Error processing form data:", response.message);
            } else {
                console.log("Unknown error occurred while processing form data");
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
                console.log("Error processing form data:", response.message);
            } else {
                console.log("Unknown error occurred while processing form data");
            }
        }
    });
}
