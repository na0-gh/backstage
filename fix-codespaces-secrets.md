# 🔧 Codespaces Secrets での Google Credentials 設定問題の解決方法

## 📊 診断結果
- ✅ 現在のGoogle Credentials（7/9作成）は**技術的に正常動作**
- ❌ 問題は**Codespaces Secrets**での設定方法にある可能性が高い

## 🚨 よくある問題と解決方法

### 1. **JSON文字列のエスケープ問題**
Codespaces Secretsに大きなJSONを設定する際の問題：

#### ❌ 間違った設定方法
```
# 改行やスペースが含まれてしまう
{
  "type": "service_account",
  "project_id": "aidea-438802"...
}
```

#### ✅ 正しい設定方法
```
# 一行のminifiedされたJSONとして設定
{"type":"service_account","project_id":"YOUR_PROJECT_ID","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n","client_email":"YOUR_SERVICE_ACCOUNT_EMAIL","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"YOUR_CLIENT_CERT_URL","universe_domain":"googleapis.com"}
```

### 2. **Codespaces Secrets設定手順**

#### ステップ1: GitHubリポジトリで設定
1. リポジトリページ → **Settings**
2. **Codespaces** → **Repository secrets**  
3. **New repository secret** をクリック

#### ステップ2: GOOGLE_CREDENTIALS の設定
- **Name**: `GOOGLE_CREDENTIALS`
- **Value**: 上記のminifiedされたJSONを貼り付け

#### ステップ3: その他の環境変数
- **Name**: `SPREADSHEET_ID`
- **Value**: `1bvJx_OC1JpmOCHWxtMw6RZ4Gurelnx-uyO4U3Ep9SHE`

- **Name**: `TIKTOK_EMAIL`  
- **Value**: `ppp_ttla@torihada.co.jp`

- **Name**: `TIKTOK_PASSWORD`
- **Value**: `ppp@1234`

### 3. **スプレッドシート共有設定の確認**

以下のサービスアカウントがスプレッドシートに**編集者権限**で共有されているか確認：
```
📧 tiktok-scraper@aidea-438802.iam.gserviceaccount.com
```

#### 共有手順:
1. Google Sheetsを開く
2. 右上の **共有** ボタンをクリック
3. 上記のメールアドレスを追加
4. 権限を **編集者** に設定

### 4. **古いキー（3/8作成）との違いの調査**

古いキーで動作していた場合の確認点：
- サービスアカウントのメールアドレスが違う可能性
- プロジェクトIDが異なる可能性  
- スプレッドシートの共有設定が異なる可能性

### 5. **デバッグ用コマンド**

Codespacesで環境変数が正しく設定されているか確認：
```bash
# 環境変数の確認（値は表示しない、存在のみチェック）
node -e "console.log('GOOGLE_CREDENTIALS:', process.env.GOOGLE_CREDENTIALS ? '設定済み' : '未設定')"
node -e "console.log('SPREADSHEET_ID:', process.env.SPREADSHEET_ID || '未設定')"

# JSON解析テスト
node -e "try { JSON.parse(process.env.GOOGLE_CREDENTIALS); console.log('JSON解析: 成功'); } catch(e) { console.log('JSON解析エラー:', e.message); }"

# 詳細デバッグ
node debug-credentials.js
```

## 🎯 **推奨される解決手順**

1. **まず現在のCodespaces Secretsを削除**
2. **新しいminifiedされたJSONで再設定**  
3. **スプレッドシートの共有設定を確認**
4. **Codespacesで再テスト**

これで新しいGoogle Credentials（7/9作成）が正常に動作するはずです！ 