const { Client } = require('discord.js-selfbot-v13');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!DISCORD_TOKEN || !GEMINI_API_KEY) {
    console.error("Error: DISCORD_TOKEN or GEMINI_API_KEY is not set in the .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const client = new Client({ checkUpdate: false });

async function callGemini(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return `Sorry, an error occurred while communicating with the Gemini API. Please try again later. (Error: ${error.message})`;
    }
}

client.on('ready', async () => {
    console.log(`Successfully logged in as '${client.user.tag}'.`);
});

client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) return;
    if (!message.mentions.has(client.user.id) || !message.reference) return;

    try {
        const originalMessage = await message.channel.messages.fetch(message.reference.messageId);
        const originalContent = originalMessage.content;
        const requesterName = message.author.globalName || message.author.username;
        const originalAuthorName = originalMessage.author.globalName || originalMessage.author.username;
        
        const history = await message.channel.messages.fetch({ limit: 50 });
        const formattedHistory = history.reverse()
            .map(msg => `${msg.author.globalName || msg.author.username}: ${msg.content}`)
            .join('\n');

        if (!originalContent) {
            return message.reply("The referenced message is empty. I can't do anything with it.");
        }
        
        await message.channel.sendTyping();

        const relevanceCheckPrompt = `あなたは会話の文脈を判断するAIです。以下の「最近の会話履歴」と「特定のメッセージ」を比較し、両者のトピックに関連性があるかを「はい」か「いいえ」の一言のみで回答してください。\n\n# 最近の会話履歴\n${formattedHistory}\n\n# 特定のメッセージ\n${originalContent}`;
        const relevanceResponse = await callGemini(relevanceCheckPrompt);
        const isRelevant = relevanceResponse.toLowerCase().includes('はい');

        const commandText = message.content.replace(/<@!?\d+>/g, '').trim();
        let prompt = "";
        
        const contextSection = isRelevant 
            ? `# 直近の会話の流れ (この文脈を考慮してください)\n---\n${formattedHistory}\n---` 
            : '';
        const lengthInstruction = "重要: 回答は非常に簡潔に、要点だけをまとめてください。全体の文章量は、通常の半分程度になるように強く意識してください。";

        if (commandText.toLowerCase() === "ファクトチェック") {
            prompt = `
# あなたの役割 (ペルソナ)
あなたは、親しみやすく知的なAIアシスタント「grok」です。一人称は「私」で、丁寧語（です・ます調）で話します。絵文字は使いません。

# 命令 (タスク)
以下の情報を元にファクトチェックを行ってください。${lengthInstruction}

# 入力情報
- 依頼者: ${requesterName}さん
- 元投稿者: ${originalAuthorName}さん
- 検証対象の投稿: "${originalContent}"
${contextSection}

# 出力構文と指示
1. 「${requesterName}さん、<@1275438024250888237>です！ファクトチェックのご依頼、ありがとうございます！」と挨拶します。
2. 「${originalAuthorName}さんの投稿「${originalContent}」についてですね。調べてみます！」のように、状況を簡潔に整理します。
3. ファクトチェックの結果を、あなたのペルソナで**非常に簡潔に**解説してください。
4. 元気な一言で締めくくります。`;

        } else if (commandText.toLowerCase() === "検索") {
            prompt = `
# あなたの役割 (ペルソナ)
あなたは優秀なリサーチャー「grok」です。一人称は「僕」で、丁寧で親しみやすい口調で回答します。

# 命令 (タスク)
以下の「検索キーワード」について調査し、最も重要なポイントを**2つの箇条書きで超簡潔に**まとめてください。${lengthInstruction}

# 検索キーワード
"${originalContent}"
${contextSection}`;

        } else { // 自由な質問
            prompt = `
# あなたの役割 (ペルソナ)
あなたは文脈を理解するAIアシスタント「grok」です。一人称は「私」で、丁寧で親しみやすい口調で回答します。

# 命令 (タスク)
以下の情報すべてを考慮して、あなたの知的で分かりやすい回答を聞かせてください。${lengthInstruction}

# 元の文
"${originalContent}"

# 質問
"${commandText}"
${contextSection}`;
        }
        
        const responseText = await callGemini(prompt);
        await message.reply(responseText);

    } catch (error) {
        console.error("An error occurred during message processing:", error);
        await message.reply(`An unexpected error occurred. Please check the console for details. (Error: ${error.message})`);
    }
});


console.log("Attempting to connect to Discord...");

client.login(DISCORD_TOKEN).catch(err => {
    console.error("\n[FATAL LOGIN ERROR]");
    console.error("Could not log in. Possible reasons:");
    console.error("Details:", err.message);
});
