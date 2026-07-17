# mdtopdf

Converts Markdown to PDF, including LaTeX math equations and syntax-highlighted code.

## Math

LaTeX math is rendered with [KaTeX](https://katex.org) at build time, so the
PDF needs no internet connection and the fonts are embedded directly in the
output. Four delimiter styles are supported:

| Style        | Inline        | Display         |
| ------------ | ------------- | --------------- |
| Dollar signs | `$ ... $`     | `$$ ... $$`     |
| LaTeX native | `\( ... \)`   | `\[ ... \]`     |

```markdown
The relation $E = mc^2$ appears inline.

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

Math inside code blocks and inline code spans is left untouched, and ordinary
prose with dollar amounts (e.g. "it costs $5 and then $10") is not mistaken for
math.

## Code highlighting

Fenced code blocks are syntax-highlighted with [highlight.js](https://highlightjs.org)
(~200 languages, auto-detected when no language is tagged). Choose a theme with
`--theme`:

| Theme          | Style |
| -------------- | ----- |
| `light`        | light (default) |
| `github`       | light |
| `github-dark`  | dark  |
| `one-dark`     | dark  |
| `tokyo-night`  | dark  |

```bash
mdtopdf input.md --theme tokyo-night
```

## Text size

The base text size can be changed with `--size` (8–28 px, default 13). All scale proportionally.

```bash
mdtopdf input.md --size 16
```

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
sudo cp mdtohtml.js /usr/local/bin/mdtohtml.js
sudo rm -rf /usr/local/bin/node_modules
sudo cp -r node_modules /usr/local/bin/node_modules
```

## Usage

```bash
mdtopdf input.md -o output.pdf

# -o is optional — defaults to same name as input
mdtopdf input.md

# choose a code highlighting theme (default: light)
mdtopdf input.md --theme github-dark
mdtopdf input.md -t one-dark

# change the base text size in px (default: 13)
mdtopdf input.md --size 16
mdtopdf input.md -s 11

# options combine
mdtopdf input.md --theme tokyo-night --size 16 -o notes.pdf
```