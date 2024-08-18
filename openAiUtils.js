export async function fetchGPTResponse(apiKey, prompt) {
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
                { role: "system", content: "Use " + unknownValue + " as the value for any unknown fields." },
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