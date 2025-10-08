# 🐳 Docker実行ガイド

## 📋 前提条件

- Docker Desktop がインストールされていること
- Docker Compose がインストールされていること

## 🚀 Docker環境での実行手順

### 1. 環境変数の設定

**重要**: このシステムはGitHub Secretsを前提としています。
ローカルでの実行には、環境変数を直接設定する必要があります：

```bash
# 環境変数を設定（PowerShellの場合）
$env:TIKTOK_EMAIL="your-email@example.com"
$env:TIKTOK_PASSWORD="your-password"
$env:SPREADSHEET_ID="your-spreadsheet-id"
$env:GOOGLE_CREDENTIALS='{"type":"service_account",...}'
```

### 2. Dockerイメージのビルドと実行

```bash
# Docker Composeでビルドと実行を一括で行う
docker-compose up --build

# バックグラウンドで実行する場合
docker-compose up --build -d

# ログを確認する場合（バックグラウンド実行時）
docker-compose logs -f tiktok-scraper
```

### 3. 実行結果の確認

実行が完了すると、`./output` フォルダに結果のJSONファイルが保存されます。

```bash
# 出力ファイルを確認
ls -la output/

# 最新の結果ファイルを表示
cat output/creators_*.json | jq '.[0:3]'  # 最初の3件を表示（jqが必要）
```

### 4. コンテナのクリーンアップ

```bash
# コンテナを停止
docker-compose down

# イメージも削除する場合
docker-compose down --rmi all

# ボリュームも削除する場合（出力ファイルも削除されるので注意）
docker-compose down -v
```

## 🔧 トラブルシューティング

### メモリ不足エラー

```bash
# メモリ制限を増やす場合（docker-compose.ymlを編集）
mem_limit: 4g  # 2gから4gに変更
```

### Chrome起動エラー

```bash
# セキュリティ設定を確認
# docker-compose.ymlのsecurity_optが正しく設定されているか確認
security_opt:
  - seccomp:unconfined
```

### 環境変数エラー

```bash
# .envファイルの内容を確認
cat .env

# 必要な環境変数が設定されているか確認
docker-compose config
```

## 📝 Docker環境の特徴

- **軽量化**: 本番環境に必要な最小限のパッケージのみインストール
- **セキュリティ**: 非rootユーザーで実行
- **分離**: ホストシステムに影響を与えない独立した環境
- **再現性**: どの環境でも同じ結果を得られる

## 🚨 注意事項

1. **認証情報**: `.env` ファイルは `.gitignore` に含まれているか確認
2. **出力ファイル**: `output/` フォルダの内容は永続化されます
3. **メモリ使用量**: 大量のデータを処理する場合はメモリ制限を調整
4. **ネットワーク**: TikTokサイトへのアクセスが必要です
