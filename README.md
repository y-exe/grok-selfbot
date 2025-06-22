# Grog風セルボ (Geminiapi)

**開発言語:** Node.js (JavaScript)

## 警告

このプログラムはDiscordの利用規約に明確に違反する**Self-Bot**です。

*   **アカウントの永久凍結（BAN）のリスクが非常に高いです。**
*   **このプログラムを使用したことによるいかなる損害についても、作者は一切の責任を負いません。**
*   **必ず自己責任で、実験的な目的でのみ使用してください。**

他人に迷惑をかける行為は絶対に避けてください。

---

## 機能

ユーザーが特定のメッセージに返信する形で、以下のようなコマンドを実行できます。

1.  `@あなたのアカウント名 ファクトチェック`
    *   返信元のメッセージの内容が事実に即しているかをGemini APIが検証します。

2.  `@あなたのアカウント名 検索`
    *   返信元のメッセージのキーワードについてGemini APIが検索し、3行で要約します。

3.  `@あなたのアカウント名 [任意の質問]`
    *   返信元のメッセージを文脈として、指定された質問にGemini APIが回答します。

## 必要なもの

*   [Node.js](https://nodejs.org/ja) (v16.9.0 以上)
*   あなたのDiscordアカウントのトークン
*   [Google Gemini APIキー](https://aistudio.google.com/app/apikey)

---

## セットアップ手順 (Windows11)

### 1. PowerShellの実行ポリシー変更（初回のみ）

Windowsの初期設定ではスクリプト実行が制限されているため、これを許可します。

1.  Windowsスタートメニューで `powershell` を検索し、「**Windows PowerShell**」を**右クリック**して「**管理者として実行**」を選択します。
2.  管理者権限のPowerShellで、以下のコマンドを実行します。
    ```powershell
    Set-ExecutionPolicy RemoteSigned
    ```
3.  確認メッセージが表示されたら、`Y` を入力してEnterキーを押します。
4.  管理者権限のPowerShellは閉じて構いません。

### 2. プロジェクトの準備

1.  任意の場所にプロジェクト用フォルダを作成します（例: `C:\Grok_JS`）。
2.  通常のPowerShell（またはコマンドプロンプト）を開き、作成したフォルダに移動します。
    ```powershell
    mkdir C:\Grok_JS
    cd C:\Grok_JS
    ```
3.  Node.jsプロジェクトを初期化します。
    ```powershell
    npm init -y
    ```
4.  必要なライブラリをインストールします。
    ```powershell
    npm install discord.js-selfbot-v13 dotenv @google/generative-ai
    ```

### 3. 環境変数の設定

1.  プロジェクトフォルダ直下に `.env` という名前のファイルを作成します。
2.  以下の内容を記述し、ご自身のトークンとAPIキーに置き換えてください。

    ```ini
    # .envファイル

    # Discordアカウントのトークン
    DISCORD_TOKEN="ここにあなたのDiscordアカウントトークンを貼り付け"

    # Gemini APIキー
    GEMINI_API_KEY="ここにあなたのGemini APIキーを貼り付け"
    ```
    **注意:** トークンとAPIキーは、絶対に公開リポジトリにコミットしないでください。`.gitignore`ファイルを作成して、`.env`を無視するように設定することを強く推奨します。

    **`.gitignore` ファイルの例:**
    ```
    # .gitignore
    node_modules
    .env
    ```

### 4. プログラムの配置

プロジェクトフォルダに `index.js` という名前のファイルを作成し、このリポジトリにある `index.js` のコードをコピペ

---

## 実行方法

すべての設定が完了したら、PowerShellで以下のコマンドを実行してプログラムを起動します。

```powershell
node index.js
