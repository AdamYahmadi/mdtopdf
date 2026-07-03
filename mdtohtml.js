'use strict';

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const markedKatex = require('marked-katex-extension');

function preprocessMath(src) {
  const stash = [];
  const mask = (s) => {
    stash.push(s);
    return `\u0000MATHMASK${stash.length - 1}\u0000`;
  };

  let out = src
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, mask)
    .replace(/(`+)[^`]*?\1/g, mask);

  out = out
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, body) => `$$${body}$$`) 
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, body) => `$${body}$`);  

  out = out.replace(/\$\$([\s\S]*?)\$\$/g, (m, body) =>
    body.includes('\n') ? `$$\n${body.trim()}\n$$` : m
  );

  out = out.replace(/\u0000MATHMASK(\d+)\u0000/g, (_, i) => stash[Number(i)]);
  return out;
}

const KATEX_DIST = path.join(__dirname, 'node_modules', 'katex', 'dist');

let cachedKatexCss = null;
function loadKatexCss() {
  if (cachedKatexCss) return cachedKatexCss;

  let css = fs.readFileSync(path.join(KATEX_DIST, 'katex.min.css'), 'utf8');

  css = css.replace(/url\(fonts\/([^)]+\.woff2)\)/g, (match, file) => {
    const fontPath = path.join(KATEX_DIST, 'fonts', file);
    const b64 = fs.readFileSync(fontPath).toString('base64');
    return `url(data:font/woff2;base64,${b64})`;
  });

  css = css.replace(/,url\(fonts\/[^)]+\.woff\) format\("woff"\)/g, '');
  css = css.replace(/,url\(fonts\/[^)]+\.ttf\) format\("truetype"\)/g, '');

  cachedKatexCss = css;
  return css;
}

const GITHUB_CSS = `
.markdown-body {
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  margin: 0;
  color: #1F2328;
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";
  font-size: 13px;
  line-height: 1.5;
  word-wrap: break-word;
}
.markdown-body a { color: #0969da; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body b, .markdown-body strong { font-weight: 600; }
.markdown-body hr { height: .25em; padding: 0; margin: 24px 0; background-color: #d8dee4; border: 0; }
.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6 {
  margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25;
}
.markdown-body h1 { font-size: 2em; padding-bottom: .3em; border-bottom: 1px solid #d8dee4; }
.markdown-body h2 { font-size: 1.5em; padding-bottom: .3em; border-bottom: 1px solid #d8dee4; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body h4 { font-size: 1em; }
.markdown-body h5 { font-size: .875em; }
.markdown-body h6 { font-size: .85em; color: #636c76; }
.markdown-body p { margin-top: 0; margin-bottom: 16px; }
.markdown-body blockquote {
  margin: 0 0 16px; padding: 0 1em; color: #636c76; border-left: .25em solid #d8dee4;
}
.markdown-body blockquote > :first-child { margin-top: 0; }
.markdown-body blockquote > :last-child { margin-bottom: 0; }
.markdown-body ul, .markdown-body ol { margin-top: 0; margin-bottom: 16px; padding-left: 2em; }
.markdown-body li + li { margin-top: .25em; }
.markdown-body li > p { margin-top: 16px; }
.markdown-body table {
  border-spacing: 0; border-collapse: collapse; display: block;
  width: max-content; max-width: 100%; overflow: auto; margin-bottom: 16px;
}
.markdown-body table th { font-weight: 600; }
.markdown-body table th, .markdown-body table td {
  padding: 6px 13px; border: 1px solid #d8dee4;
}
.markdown-body table tr { background-color: #fff; border-top: 1px solid #d8dee4; }
.markdown-body table tr:nth-child(2n) { background-color: #f6f8fa; }
.markdown-body tt, .markdown-body code, .markdown-body samp {
  font-family: ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;
  font-size: 10px;
}
.markdown-body pre {
  margin-top: 0; margin-bottom: 16px; padding: 12px 14px;
  font-size: 10px; line-height: 1.45; background-color: #f6f8fa; border-radius: 6px;
  font-family: ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;
  white-space: pre; overflow-x: hidden;
}
.markdown-body pre code {
  display: block; padding: 0; margin: 0;
  line-height: inherit; background-color: transparent; border: 0;
  font-size: 100%; white-space: pre; overflow-wrap: normal; word-break: normal;
}
.markdown-body :not(pre) > code {
  padding: .2em .4em; margin: 0; font-size: 85%;
  white-space: break-spaces; background-color: #818b981f; border-radius: 6px;
}
/* Display math: give block equations a little breathing room and let long
   equations scroll horizontally rather than overflow the page. */
.markdown-body .katex-display { margin: 16px 0; overflow-x: auto; overflow-y: hidden; }
.markdown-body .katex { font-size: 1.1em; }
`;

let markedConfigured = false;
function configureMarked() {
  if (markedConfigured) return;
  marked.use(
    markedKatex({
      throwOnError: false, 
    })
  );
  marked.setOptions({ headerIds: false, mangle: false });
  markedConfigured = true;
}

const DEFAULT_FONT_PX = 13;
function sizeOverrideCss(fontSize) {
  const size = Number(fontSize);
  if (!size || size === DEFAULT_FONT_PX) return '';
  const codePx = (10 * (size / DEFAULT_FONT_PX)).toFixed(2);
  return `
.markdown-body { font-size: ${size}px; }
.markdown-body tt, .markdown-body code, .markdown-body samp { font-size: ${codePx}px; }
.markdown-body pre { font-size: ${codePx}px; }`;
}

function documentShell(bodyHtml, fontSize) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${loadKatexCss()}
${GITHUB_CSS}${sizeOverrideCss(fontSize)}
@page { size: A4; margin: 10mm 9mm; }
body { background: #fff; }
.markdown-body { max-width: 100%; margin: 0; padding: 0; box-sizing: border-box; }
</style>
</head>
<body>
<article class="markdown-body">
${bodyHtml}
</article>
</body>
</html>`;
}

function renderMarkdownToHtml(rawMd, opts = {}) {
  configureMarked();
  const body = marked.parse(preprocessMath(rawMd));
  return documentShell(body, opts.fontSize);
}

function renderPreviewHtml(rawMd, opts = {}) {
  configureMarked();
  const tokens = marked.lexer(preprocessMath(rawMd));
  const origLines = topLevelSourceLines(rawMd);
  let body = '';
  let idx = 0;
  for (const tok of tokens) {
    if (tok.type === 'space') { body += marked.parser([tok]); continue; }
    const arr = [tok];
    arr.links = tokens.links || {};
    let piece = marked.parser(arr);
    const line = origLines[idx++];
    if (line != null) {
      piece = piece.replace(/^(\s*)(<[a-zA-Z][\w-]*)/, `$1$2 data-source-line="${line}"`);
    }
    body += piece;
  }
  return documentShell(body, opts.fontSize);
}

module.exports = { renderMarkdownToHtml, renderPreviewHtml, preprocessMath, topLevelSourceLines };

function topLevelSourceLines(rawMd) {
  configureMarked();
  const tokens = marked.lexer(rawMd);
  const lines = [];
  let line = 1;
  for (const t of tokens) {
    if (t.type !== 'space') lines.push(line);
    const raw = t.raw || '';
    line += (raw.match(/\n/g) || []).length;
  }
  return lines;
}