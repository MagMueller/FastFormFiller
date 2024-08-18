import { fetchGPTResponse } from '../utils/openAiUtils.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processForm') {
        console.log("Processing form...");
        
        chrome.storage.sync.get(['contextText', 'apiKey', 'modelSelection', 'uncertaintyHandling'], function (data) {
            let contextText = data.contextText || "Default context text if none is set.";
            const apiKey = data.apiKey || "";
            const modelSelection = data.modelSelection !== undefined ? Number(data.modelSelection) : 0;
            const uncertaintyHandling = data.uncertaintyHandling !== undefined ? Number(data.uncertaintyHandling) : 0;
            console.log("model.data", data.modelSelection);
            const model = modelSelection === 1 ? "gpt-4o-2024-08-06" : "gpt-3.5-turbo-0125";
            const uncertaintyInstruction = uncertaintyHandling === 1 ? "Use 'unknown' as the value for any fields you are not sure about." : "Guess the value creatively if unknown.";

            console.log("Model Selection:", modelSelection);
            console.log("Model:", model);

            console.log("Uncertainty Instruction:", uncertaintyInstruction);
            console.log("Context Text:", contextText);

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
            const prompt = generatePrompt(contextText, formData, websiteText, uncertaintyInstruction);
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
                                console.log("Failed to send message:", chrome.runtime.lastError.message);
                            } else {
                                console.log("Form filling command sent successfully.");
                            }
                        });
                        sendResponse({ success: true });
                    } else {
                        console.log("No valid choices in the LLM response:", JSON.stringify(data, null, 2));
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

function generatePrompt(contextText, formData, websiteText, uncertaintyInstruction) {
    let prompt = `Based on the following context and the website content, fill out the requested form field(s) and return the result as a JSON object.`;
    prompt += `In your output JSON the key musst be the Unique ID from the input list and the value is the answer. `;
    prompt += uncertaintyInstruction;
    prompt += `The output should have only the Unique IDs from the input list and the answers. `;
    prompt += `Like {1: "answer", ...}. \n\nContext:\n${contextText}\n\nWebsite Content:\n${websiteText}\n`;
    prompt += `\nForm fields to fill out given in the form (Unique ID 0: Question1, Unique ID 1: Question2, ...):\n`;
    prompt += `{`;
    formData.forEach((field, index) => {
        prompt += `${index}: ${field.label}\n`;
    });         
    prompt += `}`;
    return prompt;
}

function parseLLMResponse(response) {
    try {
        return JSON.parse(response);
    } catch (e) {
        console.log("Failed to parse JSON from LLM response:", e);
        throw e;  
    }
}