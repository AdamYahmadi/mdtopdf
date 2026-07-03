#!/usr/bin/env node

const fs = require('fs');
const { renderMarkdownToHtml } = require('./mdtohtml');

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node render.js input.md output.html');
  process.exit(1);
}

const rawMd = fs.readFileSync(inputFile, 'utf8');
fs.writeFileSync(outputFile, renderMarkdownToHtml(rawMd), 'utf8');
