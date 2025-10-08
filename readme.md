# TikTok Scraper - Codespaces実行ガイド

## 🚀 Codespacesでの実行方法

### 1. **Codespacesを開く**
1. GitHubリポジトリページで **Code** ボタンをクリック
2. **Codespaces** タブを選択
3. **Create codespace on main** をクリック

### 2. **自動セットアップ（推奨）**

#### 🔐 **前提条件**: GitHubでCodespaces Secretsを設定
1. リポジトリの **Settings** > **Codespaces** > **Repository secrets**
2. 以下の環境変数を追加：
   - `TIKTOK_EMAIL`: TikTokアカウントのメールアドレス ✅
   - `TIKTOK_PASSWORD`: TikTokアカウントのパスワード ✅
   - `SPREADSHEET_ID`: Google SheetsのID（既に設定済み）✅
   - `GOOGLE_CREDENTIALS`: Google認証情報（既に設定済み）✅

#### ✨ **実行手順**
ターミナルで以下のコマンドを実行：

```bash
# プロジェクトフォルダに移動
cd backstage-update

# 自動セットアップを実行（Codespaces Secretsを自動検出）
chmod +x setup-codespaces.sh
npm run setup

# スクレイピング実行
npm start
```

### 3. **手動セットアップ（トラブル時）**
```bash
# 依存関係をインストール
npm install

# Google Chromeをインストール
chmod +x install-chrome.sh
npm run install-chrome

# 環境変数を設定
cp env.example .env

# スクレイピング実行
npm start
```

### 3. **結果確認**
- 実行結果は `creators_YYYY-MM-DDTHH-mm-ss-sssZ.json` ファイルに保存されます
- Google Sheetsにも自動で同期されます

## ⚙️ 環境変数について

環境変数は**Codespaces Secrets**で自動設定されています。
手動設定は不要です。

## 🔧 トラブルシューティング

### エラーが発生した場合
1. **依存関係の再インストール**：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Chrome関連エラー**：
   ```bash
   sudo apt-get update
   sudo apt-get install -y chromium-browser
   ```

3. **環境変数エラー**：
   リポジトリオーナーにCodespaces Secretsの設定を確認してもらってください。

## 📝 注意事項

- **headless: true**設定でブラウザはバックグラウンド実行されます
- 実行には数分かかる場合があります
- ネットワーク環境により実行時間が変わります

## 🆘 サポート

問題が発生した場合は、リポジトリのIssuesで報告してください。 