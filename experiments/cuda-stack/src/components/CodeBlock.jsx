import './CodeBlock.css';

const KEYWORDS = new Set([
  'struct', 'class', 'void', 'int', 'float', 'bool', 'const', 'return', 'if',
  'else', 'throw', 'new', 'auto', 'static', 'virtual', 'override', 'def',
  'import', 'from', 'self', 'True', 'False', 'None', 'size_t', 'int64_t',
]);

// A small, dependency-free highlighter for the fixed set of code samples in
// data/layers.js. Not a general-purpose tokenizer — just enough structure
// (comments, strings, numbers, a keyword list) to make the samples scannable
// without pulling in a syntax-highlighting library.
function tokenize(line) {
  const tokens = [];
  let rest = line;

  const pattern = /(\/\/.*$|#.*$|"[^"]*"|'[^']*'|\b\d[\w.]*\b|\b[A-Za-z_]\w*\b)/;

  while (rest.length) {
    const match = pattern.exec(rest);
    if (!match) {
      tokens.push({ text: rest, type: 'plain' });
      break;
    }
    if (match.index > 0) {
      tokens.push({ text: rest.slice(0, match.index), type: 'plain' });
    }
    const word = match[0];
    let type = 'plain';
    if (word.startsWith('//') || word.startsWith('#')) type = 'comment';
    else if (word.startsWith('"') || word.startsWith("'")) type = 'string';
    else if (/^\d/.test(word)) type = 'number';
    else if (KEYWORDS.has(word)) type = 'keyword';
    tokens.push({ text: word, type });
    rest = rest.slice(match.index + word.length);
    if (type === 'comment') {
      break;
    }
  }
  return tokens;
}

export default function CodeBlock({ code, label }) {
  const lines = code.split('\n');

  return (
    <div className="code-block">
      {label && <div className="code-block__label">{label}</div>}
      <pre className="code-block__pre">
        <code>
          {lines.map((line, i) => (
            <span className="code-block__line" key={`${i}-${line}`}>
              <span className="code-block__gutter">{i + 1}</span>
              <span className="code-block__content">
                {tokenize(line).map((token, j) => (
                  <span key={`${j}-${token.text}`} className={`code-tok code-tok--${token.type}`}>
                    {token.text}
                  </span>
                ))}
                {line.length === 0 ? ' ' : null}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
