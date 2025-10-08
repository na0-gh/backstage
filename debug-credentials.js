// Google認証情報の詳細デバッグスクリプト
// 使用方法: GOOGLE_CREDENTIALS="..." node debug-credentials.js

require('dotenv').config();
const { google } = require('googleapis');

async function debugCredentials() {
    console.log('🔍 Google認証情報の詳細デバッグ\n');
    
    // 1. 環境変数の存在確認
    console.log('=== 環境変数チェック ===');
    console.log('GOOGLE_CREDENTIALS:', process.env.GOOGLE_CREDENTIALS ? '設定済み' : '未設定');
    console.log('SPREADSHEET_ID:', process.env.SPREADSHEET_ID || '未設定');
    console.log('');
    
    if (!process.env.GOOGLE_CREDENTIALS) {
        console.log('❌ GOOGLE_CREDENTIALS が設定されていません');
        return;
    }
    
    try {
        // 2. JSON解析テスト
        console.log('=== JSON解析テスト ===');
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        console.log('✅ JSON解析: 成功');
        console.log('📧 client_email:', credentials.client_email);
        console.log('🆔 project_id:', credentials.project_id);
        console.log('🔑 private_key_id:', credentials.private_key_id);
        console.log('📅 作成日時を推測:', credentials.private_key_id.substring(0, 8));
        console.log('');
        
        // 3. Google Auth設定テスト
        console.log('=== Google Auth設定テスト ===');
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const client = await auth.getClient();
        console.log('✅ Google Auth設定: 成功');
        console.log('');
        
        // 4. Sheets API接続テスト
        console.log('=== Sheets API接続テスト ===');
        const sheets = google.sheets({ version: 'v4', auth: client });
        
        if (process.env.SPREADSHEET_ID) {
            const spreadsheetInfo = await sheets.spreadsheets.get({
                spreadsheetId: process.env.SPREADSHEET_ID
            });
            console.log('✅ スプレッドシートアクセス: 成功');
            console.log('📊 タイトル:', spreadsheetInfo.data.properties.title);
            console.log('👤 オーナー:', spreadsheetInfo.data.properties.locale || '不明');
            console.log('');
            
            // 5. 書き込み権限テスト
            console.log('=== 書き込み権限テスト ===');
            try {
                await sheets.spreadsheets.values.get({
                    spreadsheetId: process.env.SPREADSHEET_ID,
                    range: 'Sheet1!A1:A1'
                });
                console.log('✅ 読み取り権限: 正常');
                
                // 実際に書き込みテストは行わず、権限のみ確認
                console.log('💡 書き込みテストは実行されませんでした（安全のため）');
                
            } catch (writeError) {
                console.log('❌ 読み取り/書き込み権限エラー:', writeError.message);
            }
        } else {
            console.log('⚠️ SPREADSHEET_ID が設定されていないため、スプレッドシートテストをスキップ');
        }
        
    } catch (error) {
        console.log('❌ エラー:', error.message);
        
        if (error.message.includes('Unexpected token')) {
            console.log('💡 JSONの形式が不正です。改行や特殊文字が含まれていないか確認してください');
        } else if (error.message.includes('access')) {
            console.log('💡 サービスアカウントがスプレッドシートに共有されていない可能性があります');
            console.log('   スプレッドシートの共有設定で以下のメールアドレスを追加してください:');
            
            try {
                const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
                console.log('   📧', creds.client_email);
            } catch (e) {
                console.log('   📧 client_emailの取得に失敗');
            }
        } else if (error.message.includes('API')) {
            console.log('💡 Google Sheets APIが有効になっていない可能性があります');
        }
    }
    
    console.log('\n🏁 デバッグ完了');
}

debugCredentials().catch(console.error); 