'use strict';

const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { renderMarkdownToHtml, renderPreviewHtml } = require('./mdtohtml');

const app = express();
const PORT = process.env.PORT || 3000;

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function which(cmd) {
  const dirs = (process.env.PATH || '').split(path.delimiter);
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE').split(';')
    : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      const full = path.join(dir, cmd + ext);
      try {
        if (fs.statSync(full).isFile()) return full;
      } catch (_) { /* not here */ }
    }
  }
  return null;
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  for (const c of CHROME_CANDIDATES) {
    try {
      if (path.isAbsolute(c) && fs.statSync(c).isFile()) return c;
    } catch (_) { /* not a direct file */ }
    const found = which(c);
    if (found) return found;
  }
  return null;
}

const CHROME_PATH = findChrome();

app.use(express.json({ limit: '5mb' }));
app.use(express.text({ type: 'text/markdown', limit: '5mb' }));

app.use(express.static(path.join(__dirname, 'public')));

function getMarkdown(req) {
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body.markdown === 'string') return req.body.markdown;
  return '';
}

function getFontSize(req) {
  const n = req.body && Number(req.body.fontSize);
  if (!n || Number.isNaN(n)) return undefined;
  return Math.min(28, Math.max(8, Math.round(n)));
}

app.post('/api/preview', (req, res) => {
  try {
    const md = getMarkdown(req);
    res.type('html').send(renderPreviewHtml(md, { fontSize: getFontSize(req) }));
  } catch (err) {
    res.status(500).type('text').send('Preview failed: ' + err.message);
  }
});

const CHROME_FLAGS = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--run-all-compositor-stages-before-draw',
  '--print-to-pdf-no-header',
  '--no-pdf-header-footer',
];

function runChrome(htmlPath, pdfPath) {
  const args = [
    ...CHROME_FLAGS,
    `--print-to-pdf=${pdfPath}`,
    'file://' + htmlPath,
  ];
  return new Promise((resolve, reject) => {
    execFile(CHROME_PATH, args, { timeout: 30000 }, (err) =>
      err ? reject(err) : resolve()
    );
  });
}

let queue = Promise.resolve();
function printToPdf(htmlPath, pdfPath) {
  const run = () => runChrome(htmlPath, pdfPath);
  queue = queue.then(run, run);
  return queue;
}

const pdfCache = new Map();
const CACHE_MAX = 24;
function cacheKey(md, fontSize) {
  return crypto.createHash('sha1').update((fontSize || '') + '\n' + md).digest('hex');
}
function cacheGet(key) {
  const v = pdfCache.get(key);
  if (v) { pdfCache.delete(key); pdfCache.set(key, v); }
  return v;
}
function cacheSet(key, buf) {
  pdfCache.set(key, buf);
  while (pdfCache.size > CACHE_MAX) pdfCache.delete(pdfCache.keys().next().value);
}

app.post('/api/convert', async (req, res) => {
  const md = getMarkdown(req);
  if (!md.trim()) {
    return res.status(400).type('text').send('No markdown provided.');
  }
  if (!CHROME_PATH) {
    return res.status(500).type('text').send(
      'No Chrome/Chromium found. Install Google Chrome, or set CHROME_PATH ' +
      'to your browser binary and restart the server.'
    );
  }

  const fontSize = getFontSize(req);
  const key = cacheKey(md, fontSize);

  const cached = cacheGet(key);
  if (cached) {
    res.type('application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    return res.send(cached);
  }

  const id = crypto.randomBytes(8).toString('hex');
  const htmlPath = path.join(os.tmpdir(), `mdtopdf-${id}.html`);
  const pdfPath = path.join(os.tmpdir(), `mdtopdf-${id}.pdf`);

  try {
    fs.writeFileSync(htmlPath, renderMarkdownToHtml(md, { fontSize }), 'utf8');
    await printToPdf(htmlPath, pdfPath);

    const pdf = fs.readFileSync(pdfPath);
    cacheSet(key, pdf);
    res.type('application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    res.send(pdf);
  } catch (err) {
    console.error('convert failed:', err);
    res.status(500).type('text').send('Conversion failed: ' + err.message);
  } finally {
    fs.rm(htmlPath, { force: true }, () => {});
    fs.rm(pdfPath, { force: true }, () => {});
  }
});

app.get('/healthz', (_req, res) => res.type('text').send('ok'));

app.listen(PORT, () => {
  console.log(`mdtopdf web listening on :${PORT}`);
  console.log(CHROME_PATH ? `chrome: ${CHROME_PATH}` : 'chrome: NOT FOUND (set CHROME_PATH)');
});