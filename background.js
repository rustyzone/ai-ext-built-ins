chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.message === "generate_questions") {
        const questionsPrompt = `Based on the following content, generate 3 interesting questions that could be asked about it, keep the questions short and concise: ${request.content.substring(0, 2000)}`;  
        const session = await ai.languageModel.create({
            systemPrompt: `You are a helpful assistant that helps people create questions based on a provided text.`,
        });
        const response = await session.prompt(`${questionsPrompt}`);
        // Parse questions (assuming AI returns numbered list)
        const questions = response.split('\n')
            .filter(line => line.match(/^\d\./))
            .map(line => line.replace(/^\d\.\s*/, ''))
            .slice(0, 3);

        // remove ** from questions
        questions.forEach((question, index) => {
            questions[index] = question.replace(/\*\*/g, '');
        })
        
        // Send questions back to content script
        chrome.tabs.sendMessage(sender.tab.id, {
            message: "questions_generated",
            questions: questions
        });
    }
    if(request.message === "lookup_ai") {
        const prompt = request.prompt;
        const session = await ai.languageModel.create({
            systemPrompt: `You are a helpful assistant that helps people with their writing. You are helpful, creative, and friendly.`,
        });

        const tabId = sender.tab.id;

        // Example of streaming response
        // const stream = session.promptStreaming(`${prompt}  Output in JSON format, Do not use markdown. `);
        // for await (const chunk of stream) {
        //   console.log(chunk);
        //   chrome.tabs.sendMessage(tabId, {message: "lookup_ai", promptResp: chunk});
        // }

        let promptResp = await session.prompt(`${prompt}`);

        // remove ```json and ``` from promptResp
        promptResp = promptResp.replace(/```json/g, '');
        promptResp = promptResp.replace(/```/g, '');
        chrome.tabs.sendMessage(tabId, {message: "lookup_ai", promptResp: promptResp});
    }

})
