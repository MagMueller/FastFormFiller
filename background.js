import { fetchGPTResponse } from './openAiUtils.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processForm') {
        console.log("Processing form...");
        
        chrome.storage.sync.get(['contextText', 'apiKey', 'modelSelection'], function (data) {
            let contextText = data.contextText || "Default context text if none is set.";
            const apiKey = data.apiKey || "";
            const model = data.modelSelection === '1';
            if (!apiKey) {
                console.error('API Key is not set.');
                sendResponse({ success: false, message: 'API Key is not set.' });
                return;
            }
            
            const formData = request.data;
            if (!formData) {
                console.log('Form data is empty: ' + formData);
                sendResponse({ success: false, message: 'Form data is empty.' });
                return;
            }
            const websiteText = request.websiteText;
            const prompt = generatePrompt(contextText, formData, websiteText);
            console.log("Prompt:", prompt);

            fetchGPTResponse(apiKey, prompt, model)
                .then(data => {
                    console.log("LLM Response:", JSON.stringify(data, null, 2));

                    if (data.choices && data.choices.length > 0) {
                        const jsonResponse = parseLLMResponse(data.choices[0].message.content);
                        console.log("Parsed JSON Response:", jsonResponse);

                        const mappedResponse = {};
                        formData.forEach((field, index) => {
                            if (jsonResponse.hasOwnProperty(index)) {
                                mappedResponse[field.id] = jsonResponse[index];
                            }
                        });
                        console.log("Mapped Response:", mappedResponse);

                        chrome.tabs.sendMessage(sender.tab.id, {
                            action: "fillForm",
                            data: mappedResponse,
                        }, function(response) {
                            if (chrome.runtime.lastError) {
                                console.error("Failed to send message:", chrome.runtime.lastError.message);
                            } else {
                                console.log("Form filling command sent successfully.");
                            }
                        });
                        sendResponse({ success: true });
                    } else {
                        console.error("No valid choices in the LLM response:", JSON.stringify(data, null, 2));
                        sendResponse({ success: false, message: 'No valid choices in the LLM response.' });
                    }
                })
                .catch(error => {
                    console.error("Error fetching LLM response:", error);
                    sendResponse({ success: false, message: 'Error fetching LLM response.' });
                });
        });
        return true; // Indicate that the response will be sent asynchronously
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === 'trigger_form_filling') {
        triggerFormFilling();
    } else if (command === 'trigger_cell_filling') {
        triggerCellFilling();
    }
});

function triggerFormFilling() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'triggerPageFill' });
    });
}

function triggerCellFilling() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'triggerCurrentFieldFilling' });
    });
}

function generatePrompt(contextText, formData, websiteText) {
    let prompt = `Based on the following context and the website content, fill out the requested form field(s) and return the result as a JSON object where the keys are the form field indices, and the values are the corresponding answers. Ensure the response is a valid JSON object.\n\nContext:\n${contextText}\n\nWebsite Content:\n${websiteText}\n`;
    prompt += `\nForm fields to fill out given in the form (Index: Type: Label):\n`;
    formData.forEach((field, index) => {
        prompt += `${index}: ${field.type}: ${field.label}\n`;
    });         
    prompt += `\nInstructions:\n`;
    prompt += `- For text inputs and textareas, return the text value.\n`;
    prompt += `- For checkboxes, return "true" if it should be checked, otherwise "false".\n`;
    prompt += `- For radio buttons, return "true" for the option that should be selected, otherwise "false".\n`;
    prompt += `- For dropdown menus (select elements), return the value or text of the option that should be selected.\n`;
    return prompt;
}

function parseLLMResponse(response) {
    try {
        return JSON.parse(response);
    } catch (e) {
        console.error("Failed to parse JSON from LLM response:", e);
        throw e;  
    }
}