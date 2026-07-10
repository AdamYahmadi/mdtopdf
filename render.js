#!/usr/bin/env node

const fs = require('fs');
const { renderMarkdownToHtml } = require('./mdtohtml');

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const theme = process.argv[4];

if (!inputFile || !outputFile) {
  console.error('Usage: node render.js input.md output.html [theme]');
  process.exit(1);
}

const rawMd = fs.readFileSync(inputFile, 'utf8');
fs.writeFileSync(outputFile, renderMarkdownToHtml(rawMd, { theme }), 'utf8');