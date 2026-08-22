const sample = `# Maximum Likelihood: Simple Linear Regression

A short worked example — the same document exercises **math**, **code**, and
**tables**, all describing one estimator.

## The idea

Assume $y_i = \\beta_0 + \\beta_1 x_i + \\varepsilon_i$ with
$\\varepsilon_i \\sim \\mathcal{N}(0, \\sigma^2)$ i.i.d. The likelihood of
the data is:

$$L(\\beta_0, \\beta_1, \\sigma^2) = \\prod_{i=1}^n \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{(y_i - \\beta_0 - \\beta_1 x_i)^2}{2\\sigma^2}\\right)$$

Taking logs turns the product into a sum:

$$\\ell(\\beta_0, \\beta_1, \\sigma^2) = -\\frac{n}{2}\\log(2\\pi\\sigma^2) - \\frac{1}{2\\sigma^2}\\sum_{i=1}^n (y_i - \\beta_0 - \\beta_1 x_i)^2$$

Maximizing $\\ell$ over $\\beta_0, \\beta_1$ is the same as minimizing the
sum of squared residuals — the MLE estimates coincide with ordinary least
squares:

$$\\hat\\beta_1 = \\frac{\\sum_i (x_i - \\bar x)(y_i - \\bar y)}{\\sum_i (x_i - \\bar x)^2}, \\qquad \\hat\\beta_0 = \\bar y - \\hat\\beta_1 \\bar x$$

## The code

\`\`\`python
import numpy as np

def mle_linear_regression(x, y):
    x_bar, y_bar = x.mean(), y.mean()
    beta1 = np.sum((x - x_bar) * (y - y_bar)) / np.sum((x - x_bar) ** 2)
    beta0 = y_bar - beta1 * x_bar
    resid = y - (beta0 + beta1 * x)
    sigma2 = np.sum(resid ** 2) / len(x)   # MLE variance (biased, /n not /(n-2))
    return beta0, beta1, sigma2
\`\`\`

## Convergence

As sample size grows, the MLE estimates concentrate around the true
parameters $\\beta_0 = 2$, $\\beta_1 = 3$:

| $n$    | $\\hat\\beta_0$ | $\\hat\\beta_1$ | $\\hat\\sigma^2$ |
| ------ | ---------------- | ---------------- | ------------------ |
| 10     | 2.41             | 2.78             | 0.92               |
| 100    | 2.07             | 2.95             | 1.01               |
| 1,000  | 1.99             | 3.01             | 0.99               |
| 10,000 | 2.00             | 3.00             | 1.00               |

> The MLE is consistent: as $n \\to \\infty$, $\\hat\\beta_0 \\to \\beta_0$
> and $\\hat\\beta_1 \\to \\beta_1$. Prices in prose like $5 or $10 stay
> literal — they are not mistaken for math.
`;
editor.value = sample;

function inlineHi(s) {
  const codes = [];
  s = s.replace(/(`+)([^`]*?)\1/g, (m) => {
    codes.push(m);
    return "\u0000C" + (codes.length - 1) + "\u0000";
  });
  s = s.replace(
    /(\$\$[^$]+\$\$|\$[^$\n]+\$)/g,
    '<span class="tok-math">$1</span>',
  );
  s = s.replace(/(\*\*|__)(.+?)\1/g, '<span class="tok-strong">$1$2$1</span>');
  s = s.replace(
    /(^|[^*_])([*_])([^*_\s][^*_]*?)\2/g,
    '$1<span class="tok-em">$2$3$2</span>',
  );
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="tok-punct">[</span><span class="tok-link">$1</span><span class="tok-punct">](</span><span class="tok-url">$2</span><span class="tok-punct">)</span>',
  );
  s = s.replace(
    /\u0000C(\d+)\u0000/g,
    (_, i) => '<span class="tok-code">' + codes[Number(i)] + "</span>",
  );
  return s;
}
function highlightMd(src) {
  const lines = src.split("\n");
  let inFence = false;
  const out = lines.map((line) => {
    const raw = esc(line);
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return '<span class="tok-fence">' + raw + "</span>";
    }
    if (inFence) return '<span class="tok-code">' + raw + "</span>";
    if (/^\s*#{1,6}\s/.test(line))
      return '<span class="tok-head">' + raw + "</span>";
    if (/^\s*>/.test(line))
      return '<span class="tok-quote">' + inlineHi(raw) + "</span>";
    if (/^\s*([-*+]|\d+\.)\s/.test(line))
      return raw
        .replace(
          /^(\s*)([-*+]|\d+\.)(\s)/,
          '$1<span class="tok-list">$2</span>$3',
        )
        .replace(
          /(<\/span>\s)([\s\S]*)$/,
          (m, p1, rest) => p1 + inlineHi(rest),
        );
    if (/^\s*([-*_])\1{2,}\s*$/.test(line))
      return '<span class="tok-hr">' + raw + "</span>";
    return inlineHi(raw);
  });
  return out.join("\n") + "\n";
}
function renderHighlight() {
  highlight.innerHTML = highlightMd(editor.value);
  highlight.scrollTop = editor.scrollTop;
  highlight.scrollLeft = editor.scrollLeft;
}

editor.addEventListener("scroll", () => {
  highlight.scrollTop = editor.scrollTop;
  highlight.scrollLeft = editor.scrollLeft;
});

editor.addEventListener("input", () => {
  renderHighlight();
  schedulePreview();
  refreshCloudState();
});
