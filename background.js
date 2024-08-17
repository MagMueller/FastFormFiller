chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processForm') {
        chrome.storage.sync.get(['contextText', 'apiKey'], function (data) {
            const contextText = data.contextText || "Default context text if none is set.";
            const apiKey = data.apiKey || "";
            const unknownValue = "unknown";

            if (!apiKey) {
                console.error('API Key is not set.');
                sendResponse({ success: false, message: 'API Key is not set.' });
                return;
            }

            const prompt = generatePrompt(contextText, request.data);
            console.log("Prompt:", prompt);

            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-2024-08-06",
                    messages: [
                        { role: "system", content: "Fill out the form based on the given context and return the result as a JSON object where the keys are the form field IDs, and the values are the corresponding answers. If an answer is not known, use '" + unknownValue + "' as the value. Ensure the response is a valid JSON object." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 500,
                    response_format: { "type": "json_object" }  // Ensure JSON response format
                }),
            })
            .then(response => response.json())
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
                    console.log("Form filling message sent successfully.");
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