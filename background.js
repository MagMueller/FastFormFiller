const DEBUG = true; // Set this to false in production

import { fetchLLMResponse } from './llmUtils.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processForm') {
        chrome.storage.sync.get(['contextText', 'apiKey'], function (data) {
            let contextText = data.contextText || "Default context text if none is set.";
            const apiKey = data.apiKey || "";

            const loadContext = new Promise((resolve, reject) => {
                if (DEBUG) {
                    // load context text from file
                    fetch(chrome.runtime.getURL('exampleContext.txt'))
                        .then(response => response.text())
                        .then(text => {
                            contextText = text;
                            console.log("Loaded context text from file:", contextText);
                            resolve(contextText);
                        })
                        .catch(error => {
                            console.error("Failed to load context text from file:", error);
                            reject(error);
                        });
                } else {
                    resolve(contextText);
                }
            });

            loadContext.then(contextText => {
                if (!apiKey) {
                    console.error('API Key is not set.');
                    sendResponse({ success: false, message: 'API Key is not set.' });
                    return;
                }

                const prompt = generatePrompt(contextText, request.data);
                console.log("Prompt:", prompt);

                // Call the function to fetch LLM response
                fetchLLMResponse(apiKey, prompt)
                    .then(data => {
                        console.log("LLM Response:", JSON.stringify(data, null, 2));

                        if (data.choices && data.choices.length > 0) {
                            const jsonResponse = parseLLMResponse(data.choices[0].message.content);
                            console.log("Parsed JSON Response:", jsonResponse);

                            // Map the response back to field IDs
                            const mappedResponse = {};
                            request.data.forEach((field, index) => {
                                if (jsonResponse.hasOwnProperty(index)) {
                                    mappedResponse[field.id] = jsonResponse[index];
                                }
                            });
                            console.log("Mapped Response:", mappedResponse);

                            // Send message to content script
                            chrome.tabs.sendMessage(sender.tab.id, {
                                action: "fillForm",
                                data: mappedResponse,
                            }, function(response) {
                                if (chrome.runtime.lastError) {
                                    console.error("Failed to send message:", chrome.runtime.lastError.message);
                                } else {
                                    console.log("Form filling message sent successfully.");
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

                // Indicate that the response will be sent asynchronously
                return true;
            }).catch(error => {
                sendResponse({ success: false, message: 'Failed to load context text.' });
            });
        });
    }
});

function generatePrompt(contextText, formData) {
    console.log("Form Data:", formData);    
    let prompt = `\nContext:\n${contextText}\n`;
    prompt += `\nThe following are the form fields in the style of \nIndex: Type: Label \n the output should be JSON with keys the index and values the answer\n`;
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
        throw e;  // Rethrow the error to be caught in the fetch handler
    }
}

chrome.commands.onCommand.addListener(function (command) {
    if (command === "trigger_form_filling") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "triggerFill" }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Failed to send message:", chrome.runtime.lastError.message);
                } else {
                    console.log("Trigger fill command sent successfully.");
                }
            });
        });
    }
});