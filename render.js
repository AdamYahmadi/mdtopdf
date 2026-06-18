#!/usr/bin/env node

const fs = require('fs');
const { marked } = require('marked');

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node render.js input.md output.html');
  process.exit(1);
}

const md = fs.readFileSync(inputFile, 'utf8');

marked.setOptions({ headerIds: false, mangle: false });
const body = marked.parse(md);

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
`;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${GITHUB_CSS}
@page { size: A4; margin: 15mm 12mm; }
body { background: #fff; }
.markdown-body { max-width: 100%; margin: 0; padding: 0; box-sizing: border-box; }
</style>
</head>
<body>
<article class="markdown-body">
${body}
</article>
</body>
</html>`;

fs.writeFileSync(outputFile, html, 'utf8');
