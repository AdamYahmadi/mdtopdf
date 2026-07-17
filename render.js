#!/usr/bin/env node

const fs = require('fs');
const { renderMarkdownToHtml } = require('./mdtohtml');

const args = process.argv.slice(2);
const positional = [];
const opts = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--theme') opts.theme = args[++i];
  else if (args[i] === '--size') opts.fontSize = Number(args[++i]);
  else positional.push(args[i]);
}

const [inputFile, outputFile] = positional;

if (!inputFile || !outputFile) {
  console.error('Usage: node render.js input.md output.html [--theme NAME] [--size N]');
  process.exit(1);
}

const rawMd = fs.readFileSync(inputFile, 'utf8');
fs.writeFileSync(outputFile, renderMarkdownToHtml(rawMd, opts), 'utf8');