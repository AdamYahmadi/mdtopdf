FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      fonts-dejavu-core \
      fonts-noto-core \
      fonts-noto-cjk \
      fonts-noto-color-emoji \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tell the server where Chromium is (Debian installs it here).
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
