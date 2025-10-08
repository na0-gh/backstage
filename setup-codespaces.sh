#!/bin/bash

echo "🚀 Backstage Update - Codespaces セットアップを開始..."

# ステップ1: Google Chromeのインストール
echo "\n📦 ステップ1: Google Chromeのインストール"
if command -v google-chrome-stable &> /dev/null; then
    echo "✅ Google Chrome Stableは既にインストールされています"
    google-chrome-stable --version
else
    echo "Google Chrome Stableをインストール中..."
    
    # システムの更新
    sudo apt-get update -qq
    
    # 必要な依存関係をインストール
    sudo apt-get install -y wget gnupg
    
    # Googleの公開鍵を追加
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    
    # Google Chromeのリポジトリを追加
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
    
    # パッケージリストの更新
    sudo apt-get update -qq
    
    # Google Chrome Stableをインストール
    sudo apt-get install -y google-chrome-stable
    
    # 日本語フォントのインストール
    sudo apt-get install -y fonts-noto-cjk
    
    if command -v google-chrome-stable &> /dev/null; then
        echo "✅ Google Chrome Stableのインストール完了"
        google-chrome-stable --version
    else
        echo "❌ Google Chrome Stableのインストールに失敗しました"
        exit 1
    fi
fi

# ステップ2: 環境変数の確認と設定
echo "\n📝 ステップ2: 環境変数の確認と設定"

# Codespaces Secretsの確認
echo "🔍 Codespaces Secretsの確認中..."
HAS_CODESPACES_SECRETS=false

if [ -n "$TIKTOK_EMAIL" ] && [ -n "$TIKTOK_PASSWORD" ]; then
    echo "✅ TikTokの認証情報: Codespaces Secretsで設定済み"
    HAS_CODESPACES_SECRETS=true
else
    echo "⚠️  TikTokの認証情報: Codespaces Secretsで未設定"
fi

if [ -n "$SPREADSHEET_ID" ]; then
    echo "✅ Google Sheets設定: Codespaces Secretsで設定済み"
else
    echo "⚠️  Google Sheets設定: Codespaces Secretsで未設定"
fi

if [ -n "$GOOGLE_CREDENTIALS" ]; then
    echo "✅ Google認証情報: Codespaces Secretsで設定済み"
else
    echo "⚠️  Google認証情報: Codespaces Secretsで未設定"
fi

# .envファイルの処理
if [ "$HAS_CODESPACES_SECRETS" = true ]; then
    echo "🎉 Codespaces Secretsが検出されました！"
    echo "   .envファイルの作成は不要です。"
    
    # 既存の.envファイルがある場合の警告
    if [ -f ".env" ]; then
        echo "⚠️  既存の.envファイルが検出されました。"
        echo "   Codespaces Secretsが優先されるため、.envファイルは使用されません。"
    fi
    
    # Google Sheets同期の状況を確認
    if [ -n "$SPREADSHEET_ID" ] && [ -n "$GOOGLE_CREDENTIALS" ]; then
        echo "🔗 Google Sheets同期が有効になります"
    else
        echo "📝 JSONファイルのみに保存されます（Google Sheets設定が不完全）"
    fi
else
    echo "📄 Codespaces Secretsが未設定のため、.envファイルを作成します..."
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            echo "✅ .envファイルを作成しました (env.exampleからコピー)"
            echo "⚠️  .envファイルを編集して、認証情報を設定してください"
        else
            # デフォルトの.envファイルを作成
            cat > .env << EOF
# TikTokアカウント情報（必須）
TIKTOK_EMAIL=your-email@example.com
TIKTOK_PASSWORD=your-password

# Google Sheets設定（オプション）
# SPREADSHEET_ID=your-spreadsheet-id
# GOOGLE_CREDENTIALS=

# Google Sheets同期の無効化（trueにすると同期をスキップ）
DISABLE_GOOGLE_SHEETS=false

# その他の設定
NODE_ENV=production
EOF
            echo "✅ デフォルトの.envファイルを作成しました"
            echo "⚠️  .envファイルを編集して、認証情報を設定してください"
        fi
    else
        echo "✅ .envファイルは既に存在します"
    fi
fi

# ステップ3: Node.jsの依存関係をインストール
echo "\n📦 ステップ3: Node.jsの依存関係をインストール"
if [ -f "package.json" ]; then
    echo "Node.jsの依存関係をインストール中..."
    npm install
    echo "✅ 依存関係のインストール完了"
else
    echo "❌ package.jsonが見つかりません"
    exit 1
fi

# ステップ4: Puppeteerの設定確認
echo "\n🔧 ステップ4: Puppeteerの設定確認"
CHROME_PATH=$(which google-chrome-stable)
if [ -n "$CHROME_PATH" ]; then
    echo "✅ Chrome実行パス: $CHROME_PATH"
    echo "✅ Puppeteerがこのパスを使用します"
else
    echo "❌ Google Chrome Stableが見つかりません"
    exit 1
fi

echo "\n🎉 セットアップが完了しました！"
echo ""
echo "次のステップ:"
echo "1. 必要に応じて .env ファイルを編集してください"
echo "2. 以下のコマンドでスクレイピングを実行できます:"
echo "   npm start"
echo "   または"
echo "   node index.js"
echo ""
echo "💡 ヒント: Google Sheets同期が不要な場合は .env の DISABLE_GOOGLE_SHEETS=true にしてください" 