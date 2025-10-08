# 🚀 Backstage Update - Codespacesセットアップガイド

## 📋 概要
このプロジェクトはTikTokのクリエイター情報をスクレイピングし、Google Sheetsに自動同期するツールです。

## ⚡ クイックセットアップ（推奨）

### 🔐 **前提条件: Codespaces Secretsの設定**
GitHubリポジトリで以下の環境変数を設定してください：

1. **Settings** > **Codespaces** > **Repository secrets** で以下を追加：
   - `TIKTOK_EMAIL`: TikTokアカウントのメールアドレス
   - `TIKTOK_PASSWORD`: TikTokアカウントのパスワード
   - `SPREADSHEET_ID`: Google SheetsのID（オプション）
   - `GOOGLE_CREDENTIALS`: Google Sheetsの認証情報（オプション）

### 1. 自動セットアップの実行
```bash
# プロジェクトフォルダに移動
cd backstage-update

# セットアップスクリプトの実行権限を付与
chmod +x setup-codespaces.sh

# 自動セットアップを実行（Codespaces Secretsを自動検出）
npm run setup
```

### 2. 実行
```bash
# スクレイピングを開始
npm start
```

## 🔧 手動セットアップ（トラブル時）

### ステップ1: Google Chromeのインストール
```bash
# セットアップスクリプトの実行権限を付与
chmod +x install-chrome.sh

# Chromeのインストール
npm run install-chrome

# インストール確認
google-chrome-stable --version
```

### ステップ2: Node.jsの依存関係をインストール
```bash
npm install
```

### ステップ3: 環境変数の設定
```bash
# .envファイルを作成（env.exampleから）
cp env.example .env

# .envファイルを編集（必要に応じて）
nano .env
```

### ステップ4: 実行
```bash
# 通常実行
npm start

# または開発モード
npm run dev
```

## 🛠️ トラブルシューティング

### ❌ 問題: "Puppeteer起動失敗"
```bash
# 解決策1: Chromeの再インストール
sudo apt-get remove --purge google-chrome-stable
npm run install-chrome

# 解決策2: 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
```

### ❌ 問題: "Chrome実行パスが見つからない"
```bash
# Chromeのパスを確認
which google-chrome-stable

# パスが表示されない場合はChromeを再インストール
npm run install-chrome
```

### ❌ 問題: "メモリ不足エラー"
```bash
# より軽量な設定で実行
export PUPPETEER_ARGS="--memory-pressure-off --max_old_space_size=2048"
npm start
```

### ❌ 問題: "環境変数エラー"
```bash
# .envファイルの存在確認
ls -la .env

# .envファイルの内容確認
cat .env

# 必要に応じて再作成
cp env.example .env
```

## 📝 設定ファイルの説明

### .env ファイル
```env
# TikTokアカウント情報（必須）
TIKTOK_EMAIL=your-email@example.com
TIKTOK_PASSWORD=your-password

# Google Sheets設定（オプション）
SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_CREDENTIALS={"type":"service_account",...}

# Google Sheets同期の無効化
DISABLE_GOOGLE_SHEETS=false  # false = 同期する, true = 同期しない

# その他
NODE_ENV=production
```

## 🔍 実行結果

### セットアップ時の出力例（Codespaces Secrets使用）
```
🚀 Backstage Update - Codespaces セットアップを開始...
✅ Google Chrome Stableは既にインストールされています
🔍 Codespaces Secretsの確認中...
✅ TikTokの認証情報: Codespaces Secretsで設定済み
✅ Google Sheets設定: Codespaces Secretsで設定済み
✅ Google認証情報: Codespaces Secretsで設定済み
🎉 Codespaces Secretsが検出されました！
   .envファイルの作成は不要です。
✅ 依存関係のインストール完了
✅ Chrome実行パス: /usr/bin/google-chrome-stable
🎉 セットアップが完了しました！
```

### スクレイピング実行時の出力例
```
🚀 Puppeteerを起動中...
📝 ログインページへ移動中...
✅ ログイン完了を待機中...
📊 クリエイター情報の取得を開始...
✅ 合計 150 人のクリエイターを取得しました
💾 結果を creators_2024-01-15T10-30-45-123Z.json に保存しました
✅ Google Sheetsへの同期も完了しました
```

### 出力ファイル
- `creators_YYYY-MM-DDTHH-mm-ss-sssZ.json` - スクレイピング結果
- Google Sheetsにも自動同期（設定した場合）

## 🚨 重要な注意事項

1. **メモリ使用量**: Codespacesは2GBのメモリ制限があります
2. **実行時間**: 大量データの場合、数分から数十分かかる場合があります
3. **ネットワーク**: TikTokサイトへのアクセスが必要です
4. **認証情報**: .envファイルは絶対にGitにコミットしないでください

## 💡 ヒント

- **Codespaces Secretsが設定済み**の場合、Google Sheets同期が自動的に有効になります
- Google Sheets同期が不要な場合は、環境変数 `DISABLE_GOOGLE_SHEETS=true` に設定
- エラーが発生した場合は、まず `npm run setup` を再実行
- Chromeが起動しない場合は、メモリ不足の可能性があります

## 📞 サポート

問題が発生した場合は、以下の情報と共にIssueを作成してください：
- エラーメッセージの全文
- 実行環境の詳細 (`node --version`, `google-chrome-stable --version`)
- .envファイルの設定状況（パスワード等は除く） 