# mdtopdf

Converts Markdown to PDF, including LaTeX math equations.

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
sudo rm -rf /usr/local/bin/node_modules
sudo cp -r node_modules /usr/local/bin/node_modules
```

## Usage

```bash
mdtopdf input.md -o output.pdf

# -o is optional — defaults to same name as input
mdtopdf input.md
```

## Math

LaTeX math is rendered with [KaTeX](https://katex.org) at build time, so the
PDF needs no internet connection and the fonts are embedded directly in the
output. Four delimiter styles are supported:

| Style        | Inline      | Display       |
| ------------ | ----------- | ------------- |
| Dollar signs | `$ ... $`   | `$$ ... $$`   |
| LaTeX native | `\( ... \)` | `\[ ... \]`   |

```markdown
The relation $E = mc^2$ appears inline, as does \(a^2 + b^2 = c^2\).

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

\[
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
\]
```

Math inside code blocks and inline code spans is left untouched, and ordinary
prose with dollar amounts (e.g. "it costs $5 and then $10") is not mistaken for
math.