# 🤖 GitHub Actions 自動実行ガイド

## 📋 概要

このプロジェクトは、GitHub Actionsを使用してTikTokクリエイター情報の自動スクレイピングを**平日朝10:00（JST）**に実行します。

## ⚙️ セットアップ手順

### 1. GitHub Secretsの設定

リポジトリの **Settings** > **Secrets and variables** > **Actions** で以下のシークレット変数を設定してください：

#### 🔐 必須の環境変数
- `TIKTOK_EMAIL`: TikTokアカウントのメールアドレス
- `TIKTOK_PASSWORD`: TikTokアカウントのパスワード

#### 📊 オプションの環境変数
- `SPREADSHEET_ID`: Google SheetsのID（Google Sheets同期を使用する場合）
- `GOOGLE_CREDENTIALS`: Google認証情報のJSON（Google Sheets同期を使用する場合）
- `DISABLE_GOOGLE_SHEETS`: Google Sheets同期を無効化する場合は `true`

### 2. ワークフローファイルの配置

`.github/workflows/tiktok-scraper.yml` ファイルが正しく配置されていることを確認してください。

### 3. 実行スケジュール

- **自動実行**: 平日（月〜金）の朝10:00（JST）
- **手動実行**: GitHub Actionsページから「Run workflow」ボタンで任意のタイミングで実行可能

## 🔄 実行フロー

1. **環境セットアップ**
   - Ubuntu最新版でNode.js 18をセットアップ
   - Google Chrome Stableをインストール
   - 日本語フォントをインストール

2. **スクレイピング実行**
   - TikTok Live Backstageにログイン
   - クリエイター情報を取得
   - データを正規化（日本語化、日付変換）

3. **結果保存**
   - JSONファイルとして保存
   - Google Sheetsに同期（設定している場合）
   - GitHub Actionsのアーティファクトとして30日間保存

## 📊 実行結果の確認

### GitHub Actionsページでの確認

1. リポジトリの **Actions** タブを開く
2. **TikTok Creator Scraper** ワークフローを選択
3. 最新の実行結果を確認

### アーティファクトのダウンロード

1. 実行完了後、**Artifacts** セクションから結果ファイルをダウンロード可能
2. ファイル名: `tiktok-scraper-results-{実行番号}`
3. 保存期間: 30日間

### Google Sheetsでの確認

Google認証情報を設定している場合、結果は自動的にGoogle Sheetsに同期されます。

## 🛠️ トラブルシューティング

### ❌ ログイン失敗

```
解決策:
1. TIKTOK_EMAIL と TIKTOK_PASSWORD が正しく設定されているか確認
2. TikTokアカウントが有効でログイン可能か確認
3. 2要素認証が有効になっていないか確認
```

### ❌ Chrome起動エラー

```
解決策:
通常は自動的に解決されますが、ワークフロー内でChromeの再インストールを行います
```

### ❌ Google Sheets同期エラー

```
解決策:
1. GOOGLE_CREDENTIALS が正しいJSON形式か確認
2. SPREADSHEET_ID が正しいか確認
3. サービスアカウントにスプレッドシートの編集権限があるか確認
```

### ❌ タイムアウトエラー

```
現在の設定: 30分でタイムアウト
大量データの場合は、ワークフローファイルのtimeout値を調整可能
```

## 📝 実行ログの確認

### 成功時のログ例
```
✅ TikTokクリエイター情報のスクレイピングが正常に完了しました
実行時刻: 2024-01-15 10:00:00 JST
データ件数: 150件
Google Sheetsへの同期も完了しました
```

### エラー時のログ例
```
❌ TikTokクリエイター情報のスクレイピングでエラーが発生しました
エラー内容: ログインに失敗しました
実行時刻: 2024-01-15 10:00:00 JST
```

## 🔧 カスタマイズ

### 実行時刻の変更

`.github/workflows/tiktok-scraper.yml` の `cron` 設定を変更：

```yaml
schedule:
  - cron: '0 1 * * 1-5'  # 平日10:00 JST (UTC 1:00)
  - cron: '0 5 * * 1-5'  # 平日14:00 JST (UTC 5:00) に変更する場合
```

### 実行頻度の変更

```yaml
# 毎日実行する場合
- cron: '0 1 * * *'

# 毎週月曜日のみ実行する場合
- cron: '0 1 * * 1'

# 毎月1日に実行する場合
- cron: '0 1 1 * *'
```

## 🚨 セキュリティ注意事項

1. **認証情報**: GitHub Secretsに保存し、ログに出力されないよう注意
2. **アクセス制限**: リポジトリのアクセス権限を適切に設定
3. **定期監視**: 実行結果を定期的に確認し、異常がないかチェック

## 💡 運用のベストプラクティス

1. **定期的な確認**: 週に1回は実行結果を確認
2. **エラー対応**: エラーが連続した場合は原因を調査
3. **データバックアップ**: 重要なデータは別途バックアップを推奨
4. **認証情報の更新**: パスワード変更時はGitHub Secretsも更新
