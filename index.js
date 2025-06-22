const { Client } = require('discord.js-selfbot-v13');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // .envファイルを読み込む

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!DISCORD_TOKEN || !GEMINI_API_KEY) {
    console.error("【設定エラー】 .envファイルにDISCORD_TOKENまたはGEMINI_API_KEYが設定されていません。");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new Client({
    checkUpdate: false,
});

async function callGemini(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return `🤖: Gemini APIとの通信中にエラーが発生しました: ${error.message}`;
    }
}


client.on('ready', async () => {
    console.log("--------------------------------------------------");
    console.log(`アカウント '${client.user.tag}' として正常にログインしました。`);
    console.log("返信とメンションを監視しています...");
    console.log("プログラムを終了するには、このウィンドウで Ctrl + C を押してください。");
    console.log("--------------------------------------------------");
});


client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) return;

    if (!message.mentions.has(client.user.id) || !message.reference) return;

    try {
        const originalMessage = await message.channel.messages.fetch(message.reference.messageId);
        const originalContent = originalMessage.content;
        if (!originalContent) {
            return message.reply("🤖: 返信元のメッセージにテキストが含まれていません。");
        }

        const commandText = message.content.replace(/<@!?\d+>/g, '').trim();
        
        await message.channel.sendTyping();

        let prompt = "";
        if (commandText.toLowerCase() === "ファクトチェック") {
            prompt = `あなたは信頼性の高いファクトチェッカーです。以下のテキストの内容について、事実に基づいているか、誤っているか、あるいは意見であるかを分析し、簡潔に結論を述べてください。可能であれば根拠も示してください。\n\n【検証対象テキスト】\n${originalContent}`;
        } else if (commandText.toLowerCase() === "検索") {
            prompt = `あなたは優秀なリサーチャーです。以下のキーワードについてインターネットで検索し、最も重要な点を3つの箇条書きで簡潔に要約してください。\n\n【検索キーワード】\n${originalContent}`;
        } else { // 自由な質問
            prompt = `あなたは文脈を理解するアシスタントです。以下の『元の文』と『質問』を考慮して、最適な回答をしてください。\n\n【元の文】\n${originalContent}\n\n【質問】\n${commandText}`;
        }

        const responseText = await callGemini(prompt);

        await message.reply(responseText);

    } catch (error) {
        console.error("エラーが発生しました:", error);
        if (error.code === 10008) { 
             await message.reply("🤖: 返信元のメッセージが見つかりませんでした（削除された可能性があります）");
        } else {
             await message.reply(`🤖: 処理中に予期せぬエラーが発生しました: ${error.message}`);
        }
    }
});


// --- プログラムの実行 ---
console.log("起動中.");

client.login(DISCORD_TOKEN).catch(err => {
    console.error("\n[致命的なログインエラー]");
    console.error("1. .envファイルのDISCORD_TOKENが間違っている可能性があります。");
    console.error("2. Discordのパスワードを変更した場合、トークンも再取得する必要があります。");
    console.error("3. このライブラリでも対策されたか、一時的なネットワークの問題の可能性があります。");
    console.error("詳細:", err.message);
});
