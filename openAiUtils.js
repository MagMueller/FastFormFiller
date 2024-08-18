export async function fetchGPTResponse(apiKey, prompt, bigModel) {

    const model = bigModel ?  "gpt-4o-2024-08-06" : "gpt-3.5-turbo-0125";
    console.log("using model", model);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [
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