// Codespacesでのスプレッドシート設定確認スクリプト
require('dotenv').config();
const { google } = require('googleapis');

async function checkSpreadsheetSettings() {
    console.log('🔍 Codespacesでのスプレッドシート設定確認\n');
    
    // 1. 環境変数の確認
    console.log('=== 環境変数チェック ===');
    console.log('SPREADSHEET_ID:', process.env.SPREADSHEET_ID || '❌ 未設定');
    console.log('GOOGLE_CREDENTIALS:', process.env.GOOGLE_CREDENTIALS ? '✅ 設定済み' : '❌ 未設定');
    console.log('');
    
    if (!process.env.GOOGLE_CREDENTIALS) {
        console.log('❌ GOOGLE_CREDENTIALS が設定されていません');
        return;
    }
    
    if (!process.env.SPREADSHEET_ID) {
        console.log('❌ SPREADSHEET_ID が設定されていません');
        return;
    }
    
    try {
        // 2. Google認証テスト
        console.log('=== Google認証テスト ===');
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        console.log('📧 サービスアカウント:', credentials.client_email);
        
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });
        console.log('✅ Google認証: 成功');
        console.log('');
        
        // 3. スプレッドシートアクセステスト
        console.log('=== スプレッドシートアクセステスト ===');
        console.log('🔗 テスト対象ID:', process.env.SPREADSHEET_ID);
        
        try {
            const spreadsheetInfo = await sheets.spreadsheets.get({
                spreadsheetId: process.env.SPREADSHEET_ID
            });
            
            console.log('✅ スプレッドシートアクセス: 成功');
            console.log('📊 タイトル:', spreadsheetInfo.data.properties.title);
            console.log('📄 シート数:', spreadsheetInfo.data.sheets.length);
            console.log('🌐 ロケール:', spreadsheetInfo.data.properties.locale);
            console.log('');
            
            // 4. 書き込みテスト
            console.log('=== 書き込み権限テスト ===');
            try {
                // Sheet1の存在確認
                const sheetNames = spreadsheetInfo.data.sheets.map(sheet => sheet.properties.title);
                console.log('📋 利用可能なシート:', sheetNames.join(', '));
                
                if (sheetNames.includes('Sheet1')) {
                    // 読み取りテスト
                    const readTest = await sheets.spreadsheets.values.get({
                        spreadsheetId: process.env.SPREADSHEET_ID,
                        range: 'Sheet1!A1:D1'
                    });
                    console.log('✅ 読み取り権限: 正常');
                    console.log('📖 現在のヘッダー:', readTest.data.values ? readTest.data.values[0] : '空');
                } else {
                    console.log('⚠️ Sheet1が見つかりません。利用可能シート:', sheetNames[0] || 'なし');
                }
                
            } catch (permissionError) {
                console.log('❌ 読み取り権限エラー:', permissionError.message);
                console.log('💡 サービスアカウントがスプレッドシートに共有されていない可能性があります');
            }
            
        } catch (accessError) {
            console.log('❌ スプレッドシートアクセスエラー:', accessError.message);
            
            if (accessError.message.includes('not found')) {
                console.log('💡 考えられる原因:');
                console.log('   1. SPREADSHEET_IDが間違っている');
                console.log('   2. スプレッドシートが削除されている');
                console.log('   3. サービスアカウントに共有されていない');
                console.log('');
                console.log('🔧 解決方法:');
                console.log('   1. スプレッドシートのURLから正しいIDを確認');
                console.log('   2. 以下のサービスアカウントを編集者として共有:');
                console.log('      📧', credentials.client_email);
            } else if (accessError.message.includes('permission')) {
                console.log('💡 権限エラー: サービスアカウントがスプレッドシートに共有されていません');
                console.log('   以下のメールアドレスを編集者として追加してください:');
                console.log('   📧', credentials.client_email);
            }
        }
        
    } catch (error) {
        console.log('❌ 予期しないエラー:', error.message);
    }
    
    console.log('\n🏁 診断完了');
}

checkSpreadsheetSettings().catch(console.error); 