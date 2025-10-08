require('dotenv').config({ path: __dirname + '/.env' });
const puppeteer = require('puppeteer');
const fs = require('fs');
const { google } = require('googleapis');
const { execSync } = require('child_process');

// Google Sheets APIの設定
async function getGoogleSheetsClient() {
    try {
        let auth;
        
        // 環境変数からcredentialsを取得する場合
        if (process.env.GOOGLE_CREDENTIALS) {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        } else {
            // ローカルファイルから取得する場合
            const credentialsPath = __dirname + '/credentials.json';
            if (!require('fs').existsSync(credentialsPath)) {
                throw new Error('credentials.jsonファイルが見つかりません');
            }
            auth = new google.auth.GoogleAuth({
                keyFile: credentialsPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        }
        
        const client = await auth.getClient();
        return google.sheets({ version: 'v4', auth: client });
    } catch (error) {
        console.error('Google Sheets APIの設定中にエラーが発生:', error.message);
        throw error;
    }
}

// Google Sheets同期の可用性をチェック
async function isGoogleSheetsAvailable() {
    try {
        // 同期の無効化オプション
        if (process.env.DISABLE_GOOGLE_SHEETS === 'true') {
            console.log('Google Sheets同期は無効化されています（DISABLE_GOOGLE_SHEETS=true）');
            return false;
        }

        // 必要な環境変数の確認
        if (!process.env.SPREADSHEET_ID) {
            console.log('SPREADSHEET_IDが設定されていません');
            return false;
        }

        // 認証情報の確認
        if (!process.env.GOOGLE_CREDENTIALS && !require('fs').existsSync(__dirname + '/credentials.json')) {
            console.log('Google認証情報が設定されていません');
            return false;
        }

        // 簡単なAPIテスト
        console.log('🔍 Google Sheets接続テスト開始...');
        const sheets = await getGoogleSheetsClient();
        
        // デバッグ情報を追加
        console.log('SPREADSHEET_ID:', process.env.SPREADSHEET_ID);
        console.log('認証情報の種類:', process.env.GOOGLE_CREDENTIALS ? 'environment variable' : 'local file');
        
        console.log('📡 スプレッドシートアクセス試行中...');
        const result = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        console.log('✅ スプレッドシートアクセス成功:', result.data.properties.title);
        
        return true;
    } catch (error) {
        console.log('Google Sheets APIが利用できません:', error.message);
        return false;
    }
}

// スプレッドシートにデータを同期
async function syncToSpreadsheet(creators) {
    try {
        console.log('Google Sheetsとの同期を開始...');
        
        // Google Sheetsの可用性をチェック
        const isAvailable = await isGoogleSheetsAvailable();
        if (!isAvailable) {
            console.log('Google Sheets同期をスキップします（設定または接続の問題）');
            return false;
        }

        const sheets = await getGoogleSheetsClient();
        
        // データを適切な形式に変換
        const values = creators.map(creator => [
            creator.name,
            creator.id,
            creator.status,
            creator.date
        ]);
        
        // スプレッドシートにデータを追加
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Sheet1!A2:D2',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: values
            }
        });
        
        console.log('Google Sheetsとの同期が完了しました');
        return true;
    } catch (error) {
        console.error('Google Sheetsとの同期中にエラーが発生:', error.message);
        console.log('データはJSONファイルに保存されています');
        return false;
    }
}

// ユーティリティ関数: 指定時間待機
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeCreatorInfo(page) {
    try {
        // テーブルの読み込みを待機
        await page.waitForSelector('table', { timeout: 10000 });
        
        // テーブルから情報を取得
        const creators = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                return {
                    name: cells[0]?.textContent?.trim() || '',
                    id: cells[1]?.textContent?.trim() || '',
                    status: cells[2]?.textContent?.trim() || '',
                    date: cells[3]?.textContent?.trim() || ''
                };
            });
        });
        
        return creators;
    } catch (error) {
        console.error('クリエイター情報の取得中にエラーが発生:', error);
        return [];
    }
}

async function hasNextPage(page) {
    try {
        const hasNext = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(button => {
                const text = button.textContent.trim();
                const ariaLabel = button.getAttribute('aria-label');
                return text === '次へ' || text === 'Next' || 
                       ariaLabel === '次へ' || ariaLabel === 'Next' ||
                       button.querySelector('svg[aria-label="next"]');
            });
        });
        return hasNext;
    } catch (error) {
        console.error('次ページの確認中にエラーが発生:', error);
        return false;
    }
}

async function clickNextPage(page) {
    try {
        const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextButton = buttons.find(button => {
                const text = button.textContent.trim();
                const ariaLabel = button.getAttribute('aria-label');
                return text === '次へ' || text === 'Next' || 
                       ariaLabel === '次へ' || ariaLabel === 'Next' ||
                       button.querySelector('svg[aria-label="next"]');
            });
            if (nextButton) {
                nextButton.click();
                return true;
            }
            return false;
        });
        
        if (clicked) {
            await page.waitForTimeout(2000); // ページの更新を待機
            return true;
        }
        return false;
    } catch (error) {
        console.error('次ページへの移動中にエラーが発生:', error);
        return false;
    }
}

async function getPageCount(page) {
    try {
        const pageCount = await page.evaluate(() => {
            const pageItems = Array.from(document.querySelectorAll('.semi-page-item'));
            const pageNumbers = pageItems
                .map(item => {
                    const pageNum = parseInt(item.textContent);
                    return isNaN(pageNum) ? 0 : pageNum;
                })
                .filter(num => num > 0);
            return Math.max(...pageNumbers);
        });
        console.log(`合計 ${pageCount} ページを検出しました`);
        return pageCount;
    } catch (error) {
        console.error('ページ数の取得中にエラーが発生:', error);
        return 1;
    }
}

async function goToPage(page, targetPage) {
    try {
        const clicked = await page.evaluate((targetPage) => {
            const pageItems = Array.from(document.querySelectorAll('.semi-page-item'));
            const targetButton = pageItems.find(item => {
                const ariaLabel = item.getAttribute('aria-label');
                return ariaLabel === `Page ${targetPage}`;
            });
            
            if (targetButton) {
                targetButton.click();
                return true;
            }
            return false;
        }, targetPage);

        if (clicked) {
            await wait(2000); // ページの更新を待機
            return true;
        } else {
            console.log(`${targetPage}ページ目のボタンが見つかりませんでした`);
            return false;
        }
    } catch (error) {
        console.error(`${targetPage}ページ目への移動中にエラーが発生:`, error);
        return false;
    }
}

async function scrapeCreators(page) {
    const allCreators = [];
    
    // 総ページ数を取得
    const totalPages = await getPageCount(page);
    
    // 各ページを処理
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        console.log(`ページ ${currentPage}/${totalPages} を処理中...`);
        
        if (currentPage > 1) {
            const success = await goToPage(page, currentPage);
            if (!success) {
                console.log('ページの移動に失敗したため、スクレイピングを終了します');
                break;
            }
        }
        
        await wait(2000); // ページの読み込みを待機
        const creators = await scrapeCreatorInfo(page);
        if (creators.length > 0) {
            allCreators.push(...creators);
            console.log(`${currentPage}ページ目: ${creators.length}人のクリエイター情報を取得`);
        } else {
            console.log(`${currentPage}ページ目: クリエイター情報の取得に失敗`);
        }
    }

    return allCreators;
}

// クリエイターデータの正規化処理
function normalizeCreatorData(creator) {
    let status = creator.status;
    let date = creator.date;
    
    // ステータスを日本語に統一 - より包括的なマッピング
    const statusMap = {
        // 英語ステータス
        'Creator declined': 'クリエイターが拒否済み',
        'Invitation expired': '招待が期限切れ',
        'Reviewer declined': '審査員により却下',
        'Reviewer declinedThe account may be affiliated with other accounts': '審査員により却下このアカウントは他のアカウントと提携している可能性があります',
        'Reviewer declinedInvalid LIVE': '審査員により却下無効なLIVE',
        'Trial incomplete': 'トライアル未完了',
        'Trial incompleteLIVE duration less than 10m': 'トライアル未完了LIVE時間が10分未満',
        'Review period expired': '審査期間終了',
        'Managed by Creator Network': 'エージェンシーによって管理中',
        'Terminated': '関係終了',
        'Pending': '保留中',
        'Active': 'アクティブ',
        'Inactive': '非アクティブ',
        'Declined': 'クリエイターが拒否済み',
        'Expired': '招待が期限切れ',
        'Review expired': '審査期間終了',
        'Managed by agency': 'エージェンシーによって管理中',
        'Trial ongoing': 'トライアル進行中',
        'Awaiting approval': '承認待ち'
    };
    
    // 複合ステータス（時間情報付き）の処理
    let processedStatus = status;
    
    // "Awaiting approvalInvitation expiring in X" パターン
    if (status.includes('Awaiting approval') && status.includes('Invitation expiring in')) {
        const timeMatch = status.match(/Invitation expiring in (.+)/);
        processedStatus = timeMatch ? `承認待ち（招待期限: ${timeMatch[1]}）` : '承認待ち';
    }
    // "Trial ongoingEnds in X" パターン
    else if (status.includes('Trial ongoing') && status.includes('Ends in')) {
        const timeMatch = status.match(/Ends in (.+)/);
        processedStatus = timeMatch ? `トライアル進行中（終了予定: ${timeMatch[1]}）` : 'トライアル進行中';
    }
    // 既存のマッピングを確認
    else if (statusMap[status]) {
        processedStatus = statusMap[status];
    }
    
    status = processedStatus;
    
    // 日付を日本形式に統一 (YYYY/MM/DD HH:mm:ss JST)
    if (date) {
        try {
            // US形式 (MM/DD/YYYY HH:mm:ss) を日本形式に変換
            const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
            const match = date.match(dateRegex);
            
            if (match) {
                const [, month, day, year, hour, minute, second] = match;
                // 日本のタイムゾーンに変換
                const jsDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
                jsDate.setHours(jsDate.getHours() + 9); // UTC+9 (JST)
                
                const jstYear = jsDate.getFullYear();
                const jstMonth = String(jsDate.getMonth() + 1).padStart(2, '0');
                const jstDay = String(jsDate.getDate()).padStart(2, '0');
                const jstHour = String(jsDate.getHours()).padStart(2, '0');
                const jstMinute = String(jsDate.getMinutes()).padStart(2, '0');
                const jstSecond = String(jsDate.getSeconds()).padStart(2, '0');
                
                date = `${jstYear}/${jstMonth}/${jstDay} ${jstHour}:${jstMinute}:${jstSecond}`;
            }
        } catch (error) {
            console.warn('日付の正規化中にエラーが発生:', error);
        }
    }
    
    return {
        ...creator,
        status,
        date
    };
}

async function main() {
    console.log('Puppeteerを起動中...');
    
    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: null,
        timeout: 60000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-crash-reporter',
            '--disable-in-process-stack-traces',
            '--disable-logging',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-accelerated-jpeg-decoding',
            '--disable-accelerated-mjpeg-decode',
            '--disable-accelerated-video-decode',
            '--disable-accelerated-video-encode',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-component-extensions-with-background-pages',
            '--disable-default-apps',
            '--disable-dev-shm-usage',
            '--disable-domain-reliability',
            '--disable-extensions',
            '--disable-features=TranslateUI',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-sync',
            '--disable-translate',
            '--disable-windows10-custom-titlebar',
            '--metrics-recording-only',
            '--no-first-run',
            '--no-default-browser-check',
            '--no-pings',
            '--password-store=basic',
            '--use-mock-keychain',
            '--start-maximized',
            '--lang=ja-JP',
            '--timezone=Asia/Tokyo'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // ブラウザ切断時の処理
        browser.on('disconnected', () => {
            console.log('ブラウザが切断されました');
        });
        
        // ページエラーの処理
        page.on('error', (error) => {
            console.log('ページエラー:', error.message);
        });
        
        // デバッグ用のコンソールログを無効化（必要時のみ有効化）
        // page.on('console', msg => console.log('ブラウザコンソール:', msg.text()));
        
        // ページのビューポートを設定
        await page.setViewport({ width: 1920, height: 1080 });
        
        // ログインページにアクセス
        console.log('ログインページへ移動中...');
        
        // User-Agentを設定してより自然なアクセスに
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        try {
            await page.goto('https://live-backstage.tiktok.com/login/', {
                waitUntil: 'networkidle2', // networkidle0からnetworkidle2に変更
                timeout: 60000 // 30秒から60秒に延長
            });
            console.log('ページの読み込みが完了しました');
        } catch (error) {
            console.log('初回アクセスに失敗しました。再試行中...', error.message);
            // 再試行
            await page.goto('https://live-backstage.tiktok.com/login/', {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
            console.log('再試行でページの読み込みが完了しました');
        }

        // ページの読み込みを待機
        await wait(5000);

        // フォームが表示されるまで待機
        console.log('ログインフォームの読み込みを待機中...');
        await page.waitForSelector('form', { timeout: 10000 });

        // 入力フィールドを探す
        const emailInput = await page.$('input[name="email"]') || 
                          await page.$('input[type="text"]') ||
                          await page.$('input[placeholder*="mail"]');
        
        const passwordInput = await page.$('input[name="password"]') ||
                            await page.$('input[type="password"]');

        if (!emailInput || !passwordInput) {
            throw new Error('ログインフォームの要素が見つかりません');
        }

        // ログイン情報を入力
        console.log('ログイン情報を入力中...');
        
        // 環境変数の確認
        const email = process.env.TIKTOK_EMAIL;
        const password = process.env.TIKTOK_PASSWORD;
        
        console.log('メールアドレス設定状況:', email ? '設定済み' : '未設定');
        console.log('パスワード設定状況:', password ? '設定済み' : '未設定');
        
        if (!email || !password) {
            throw new Error('TIKTOK_EMAILまたはTIKTOK_PASSWORDが設定されていません。.envファイルを確認してください。');
        }
        
        await emailInput.type(String(email), { delay: 100 });
        await passwordInput.type(String(password), { delay: 100 });

        // ログインボタンをクリック
        console.log('ログイン試行中...');
        const loginButtonSelector = 'button.semi-button-block';
        await page.waitForSelector(loginButtonSelector);
        await wait(1000);
        await page.click(loginButtonSelector);

        // ログイン後のページ遷移を待機（タイムアウト時間を延長）
        console.log('ログイン完了を待機中...');
        try {
            await page.waitForNavigation({
                waitUntil: 'networkidle0',
                timeout: 60000  // 30秒から60秒に延長
            });
        } catch (error) {
            console.log('ナビゲーション待機がタイムアウトしました。現在のページで続行を試みます...');
            console.log('現在のURL:', page.url());
        }

        // クリエイター関係ページに遷移
        console.log('クリエイター関係ページへ移動中...');
        await page.goto('https://live-backstage.tiktok.com/portal/anchor/relation', {
            waitUntil: 'networkidle0',
            timeout: 60000  // タイムアウト時間を延長
        });

        // ポリシーポップアップの処理
        console.log('ポリシーポップアップの処理中...');
        try {
            await page.waitForSelector('button.semi-modal-close', { timeout: 5000 });
            await wait(1000);
            await page.click('button.semi-modal-close');
            console.log('ポリシーポップアップを閉じました');
            await wait(1000);
        } catch (error) {
            console.log('ポップアップが見つからないか、閉じることができませんでした:', error.message);
        }

        // クリエイター情報の取得
        console.log('クリエイター情報の取得を開始...');
        const rawCreators = await scrapeCreators(page);
        console.log(`合計 ${rawCreators.length} 人のクリエイターを取得しました`);
        
        // データの正規化処理
        console.log('データの正規化処理を実行中...');
        const creators = rawCreators.map(creator => normalizeCreatorData(creator));
        console.log('データの正規化処理が完了しました');
        
        // 結果をファイルに保存
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const filename = `creators_${timestamp}.json`;
        
        // outputディレクトリが存在しない場合は作成
        const outputDir = './output';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = `${outputDir}/${filename}`;
        fs.writeFileSync(outputPath, JSON.stringify(creators, null, 2));
        console.log(`結果を ${outputPath} に保存しました`);

        // スプレッドシートにデータを同期（オプション）
        const syncSuccess = await syncToSpreadsheet(creators);
        if (syncSuccess) {
            console.log('Google Sheetsへの同期も完了しました');
        } else {
            console.log('Google Sheetsへの同期は失敗しましたが、データはJSONファイルに保存済みです');
        }

    } catch (error) {
        console.error('エラーが発生しました:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// スクリプトの実行
main()
    .then(() => console.log('スクリプトが正常に完了しました'))
    .catch(error => console.error('スクリプトの実行に失敗しました:', error));
