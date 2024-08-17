export async function fetchLLMResponse(apiKey, prompt) {
    const unknownValue = "unknown";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: "Fill out the form based on the given context and return the result as a JSON object where the keys are the same IDs, and the values are the corresponding answers. If an answer is not known, use '" + unknownValue + "' as the value. Ensure the response is a valid JSON object." },
                { role: "user", content: prompt }
            ],
            max_tokens: 1500,
            response_format: { "type": "json_object" }  // Ensure JSON response format
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}