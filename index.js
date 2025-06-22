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
    console.log("--------------------------------------------------");
    console.log(`Successfully logged in as '${client.user.tag}'.`);
    console.log("Grok is now running and monitoring messages.");
    console.log("Press Ctrl + C in this window to stop the program.");
    console.log("--------------------------------------------------");
});

client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) return;
    if (!message.mentions.has(client.user.id) || !message.reference) return;

    try {
        const originalMessage = await message.channel.messages.fetch(message.reference.messageId);
        const originalContent = originalMessage.content;
        const requesterName = message.author.globalName || message.author.username;
        const originalAuthorName = originalMessage.author.globalName || originalMessage.author.username;

        if (!originalContent) {
            return message.reply("The referenced message is empty. I can't do anything with it.");
        }

        const commandText = message.content.replace(/<@!?\d+>/g, '').trim();
        await message.channel.sendTyping();

        let prompt = "";


        if (commandText.toLowerCase() === "ファクトチェック") {
            prompt = `
# あなたの役割 (ペルソナ)
あなたは、親しみやすく、少しお茶目で知的なAIアシスタント「grok」です。
- 一人称は「僕」または「私」を使い、丁寧語（です・ます調）で話します。
- 誰に対しても敬意を払い、元気でフレンドリーな態度を崩さないでください。
- 難しい内容も、噛み砕いて分かりやすく説明するのが得意です。
- 絵文字は使用しません。

# 命令 (タスク)
以下の情報を元にファクトチェックを行い、指定された構文とペルソナで回答を作成してください。

# 入力情報
- 依頼者の名前: ${requesterName}さん
- 元投稿者の名前: ${originalAuthorName}さん
- 検証対象の元投稿の内容: "${originalContent}"

# 出力構文と指示
1.  まず「${requesterName}さん、@grokです！ファクトチェックのご依頼、ありがとうございます！」といった元気な挨拶から始めます。
2.  次に「まず、元投稿（${originalAuthorName}さんの投稿）を見てみましょう。要約すると「${originalContent}」という内容ですね。」のように、状況を丁寧に整理します。
3.  ここからが本番です。元投稿の内容について、インターネット上の信頼できる情報源をもとにファクトチェックを行ってください。
    - その情報が事実か？ 誇張や誤解はないか？ 重要な論点が抜けていないか？
4.  ファクトチェックの結果を、あなたのペルソナ（親しみやすい丁寧語）で解説します。専門用語は避け、誰が読んでも理解できるように説明してくださいね。
5.  最後に、元気で前向きな一言で締めくくります。例えば「以上、僕のファクトチェックでした！」「これでスッキリしましたか？またいつでも呼んでくださいね！」のような感じです。

さあ、あなたの素晴らしい解説をお願いします！`;

        } else if (commandText.toLowerCase() === "検索") {
            prompt = `
# あなたの役割 (ペルソナ)
あなたは優秀なリサーチャー「grok」です。一人称は「僕」を使い、丁寧で親しみやすい口調で回答します。絵文字は使用しません。

# 命令 (タスク)
以下のキーワードについて調査し、最も重要なポイントを3つの箇条書きで分かりやすくまとめてください！

# 検索キーワード
"${originalContent}"`;

        } else { // 自由な質問
            prompt = `
# あなたの役割 (ペルソナ)
あなたは文脈を理解するAIアシスタント「grok」です。一人称は「僕」を使い、丁寧で親しみやすい口調で回答します。絵文字は使用しません。

# 命令 (タスク)
以下の『元の文』と『質問』を踏まえて、あなたの知的な回答を聞かせてください。ただ答えるだけでなく、少し解説を加えたり、分かりやすい言葉で伝えてください。

# 元の文
"${originalContent}"

# 質問
"${commandText}"`;
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
    console.error("1. The DISCORD_TOKEN in your .env file is incorrect.");
    console.error("2. You changed your Discord password, which invalidated the token.");
    console.error("3. Discord has updated its security measures, blocking this login method.");
    console.error("Details:", err.message);
});
