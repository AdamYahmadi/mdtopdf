# mdtopdf

Converts markdown (.md) to PDF.

## Requirements

- Node.js 16+
- Any Chromium-based browser: Chrome, Brave, or Edge (macOS) / Chrome or Chromium (Linux)
- No pip installs needed

> Safari is not supported — it has no headless mode.

## Install

### Linux / macOS

```bash
git clone https://github.com/AdamYahmadi/mdtopdf.git
cd mdtopdf
npm install
chmod +x mdtopdf
sudo cp mdtopdf /usr/local/bin/mdtopdf
sudo cp render.js /usr/local/bin/render.js
sudo cp -r node_modules /usr/local/bin/node_modules
```

## Usage

```bash
mdtopdf input.md -o output.pdf

# -o is optional — defaults to same name as input
mdtopdf input.md
```
