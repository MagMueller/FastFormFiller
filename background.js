const DEBUG = true; // Set this to false in production

import { fetchLLMResponse } from './llmUtils.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processForm') {
        chrome.storage.sync.get(['contextText', 'apiKey'], function (data) {
            let contextText = data.contextText || "Default context text if none is set.";
            const apiKey = data.apiKey || "";

            if (DEBUG) {
                // load context text from file
                contextText = `
                Company Name: Tech Innovators Inc.

                Address:
                123 Innovation Drive
                Techville, CA 94043
                USA

                Company Info:
                Tech Innovators Inc. is a leading technology company specializing in innovative solutions for the modern world. Our mission is to drive technological advancements and provide cutting-edge products and services to our customers.
                Founded: 2005   
                Employees: 500+
                Industry: Technology

                Key Numbers:
                Annual Revenue: $50 million
                Market Share: 15%
                Customer Satisfaction: 95%
                Growth Rate: 10% year-over-year

                Vision
                To be the global leader in technology innovation, empowering businesses and individuals to achieve their full potential through our advanced solutions and services.
                `;
            }
            console.log("Context Text:", contextText);
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

                        // Send message to content script
                        chrome.tabs.sendMessage(sender.tab.id, {
                            action: "fillForm",
                            data: jsonResponse,
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
        });
    }
});

function generatePrompt(contextText, formData) {
    let prompt = `Based on the following context, fill out the form and return the result as a JSON object where the keys are the form field IDs, and the values are the corresponding answers. If an answer is not known, use "unknown" as the value. Ensure the response is a valid JSON object.\n\nContext:\n${contextText}\n\nForm fields:\n`;
    formData.forEach((field, index) => {
        prompt += `${index + 1}. Field ID: ${field.id}, Label: ${field.label}, Type: ${field.type}\n`;
    });
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