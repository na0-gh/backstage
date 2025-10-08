#!/bin/bash

# Google Chrome for Codespacesのインストールスクリプト
echo "🚀 Codespaces用Google Chromeのインストールを開始..."

# システムの更新
sudo apt-get update

# 必要な依存関係をインストール
sudo apt-get install -y wget gnupg

# Googleの公開鍵を追加
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -

# Google Chromeのリポジトリを追加
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list

# パッケージリストの更新
sudo apt-get update

# Google Chrome Stableをインストール
sudo apt-get install -y google-chrome-stable

# インストールの確認
if command -v google-chrome-stable &> /dev/null; then
    echo "✅ Google Chrome Stableのインストールが完了しました"
    google-chrome-stable --version
else
    echo "❌ Google Chrome Stableのインストールに失敗しました"
    exit 1
fi

# 日本語フォントのインストール（TikTokサイトの文字化け防止）
sudo apt-get install -y fonts-noto-cjk

echo "🎉 すべてのインストールが完了しました！" 