# 🤖 TikTokクリエイター自動スクレイピングシステム

TikTok Live Backstageからクリエイター情報を自動で取得し、Google Sheetsに同期するシステムです。

## ✨ 主要機能

- **🕙 自動実行**: 平日朝10:00（JST）にGitHub Actionsで自動実行
- **📊 データ取得**: 517人のクリエイター情報を26ページから取得
- **🇯🇵 日本語化**: ステータスを完全日本語化（例：Managed by agency → エージェンシーによって管理中）
- **⏰ 時間情報**: 時間付きステータス対応（例：承認待ち（招待期限: 6d 6h 58m））
- **📈 Google Sheets連携**: 取得データを自動でスプレッドシートに同期
- **🐳 Docker対応**: ローカルでのテスト実行環境完備

## 🚀 実行方法

### 方法1: GitHub Actions（推奨）

**平日朝10:00に自動実行**されます。手動実行も可能です。

1. **Actions**タブを開く
2. **TikTok Creator Scraper**を選択
3. **Run workflow**をクリック

### 方法2: ローカルDocker実行

```bash
# リポジトリをクローン
git clone https://github.com/na0-gh/backstage.git
cd backstage

# Docker実行（GitHub Secretsが設定されている場合のみ動作）
docker-compose up --build
```

詳細は [`DOCKER_README.md`](DOCKER_README.md) を参照してください。

## ⚙️ 設定

### GitHub Secrets（必須）

リポジトリの **Settings** > **Secrets and variables** > **Actions** で設定：

- `TIKTOK_EMAIL`: TikTokアカウントのメールアドレス
- `TIKTOK_PASSWORD`: TikTokアカウントのパスワード  
- `SPREADSHEET_ID`: Google SheetsのID
- `GOOGLE_CREDENTIALS`: Google認証情報のJSON

詳細は [`GITHUB_ACTIONS_README.md`](GITHUB_ACTIONS_README.md) を参照してください。

## 📊 実行結果

### 取得データ例
```json
{
  "name": "クリエイター名",
  "id": "@creator_id",
  "status": "エージェンシーによって管理中",
  "date": "2024/01/15 10:30:45"
}
```

### 出力先
- **JSONファイル**: `output/creators_YYYY-MM-DDTHH-mm-ss-sssZ.json`
- **Google Sheets**: 自動同期
- **GitHub Actions**: アーティファクトとして30日間保存

## 🔧 技術仕様

- **言語**: Node.js 18
- **ブラウザ自動化**: Puppeteer
- **コンテナ**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **スケジュール**: 平日朝10:00（JST）= UTC 1:00
- **データ同期**: Google Sheets API

## 📝 ログ出力例

```
✅ 合計 26 ページを検出しました
✅ 1ページ目: 20人のクリエイター情報を取得
✅ 2ページ目: 20人のクリエイター情報を取得
...
✅ 合計 517 人のクリエイターを取得しました
✅ データの正規化処理が完了しました
✅ 結果を ./output/creators_2024-01-15T01-30-45-123Z.json に保存しました
✅ Google Sheetsへの同期も完了しました
```

## 🔒 セキュリティ

- 認証情報は全てGitHub Secretsで管理
- 機密情報はリポジトリに含まれません
- 非rootユーザーでのDocker実行

## 📚 ドキュメント

- [GitHub Actions設定ガイド](GITHUB_ACTIONS_README.md)
- [Docker実行ガイド](DOCKER_README.md)

## 🆘 サポート

問題が発生した場合は、リポジトリのIssuesで報告してください。