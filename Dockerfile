# mdtopdf web — Node + system Chromium, running the same pipeline as the CLI.
FROM node:20-slim

# Chromium and the fonts it needs to render text (incl. CJK + emoji) correctly.
# We use the distro's Chromium so the PDF print path matches a normal desktop
# Chrome/Chromium as closely as possible.
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

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# App source.
COPY . .

# Render provides $PORT; the server already honours it (defaults to 3000).
EXPOSE 3000
CMD ["node", "server.js"]
