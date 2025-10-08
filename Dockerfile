# Node.js 18をベースイメージとして使用
FROM node:18-slim

# 作業ディレクトリを設定
WORKDIR /app

# システムの更新と必要なパッケージのインストール
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libxss1 \
    libgconf-2-4 \
    fonts-noto-cjk \
    --no-install-recommends

# Google Chromeの公開鍵を追加
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -

# Google Chromeのリポジトリを追加
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

# パッケージリストを更新してGoogle Chrome Stableをインストール
RUN apt-get update && apt-get install -y google-chrome-stable

# 不要なパッケージを削除してイメージサイズを削減
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# アプリケーションのソースコードをコピー
COPY . .

# 非rootユーザーを作成してセキュリティを向上
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# 非rootユーザーに切り替え
USER pptruser

# Puppeteerの環境変数を設定
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# ポート3000を公開（必要に応じて）
EXPOSE 3000

# アプリケーションを起動
CMD ["npm", "start"]
