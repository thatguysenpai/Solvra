'use client';

import { Children, isValidElement, memo, type ReactElement, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CopyButton from './CopyButton';

function CodeBlock({ language, code }: { language?: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#3a3632] bg-code text-[#e7e5e4]">
      <div className="flex items-center justify-between border-b border-[#34302c] px-3.5 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#a8a29e]">{language || 'text'}</span>
        <CopyButton
          text={code}
          title="Copy code"
          className="rounded-md p-1 text-[#a8a29e] transition-colors hover:bg-white/10 hover:text-white"
        />
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  pre({ children }) {
    // react-markdown renders fenced blocks as <pre><code class="language-x">…</code></pre>
    const child = Children.toArray(children)[0];
    if (isValidElement(child)) {
      const el = child as ReactElement<{ className?: string; children?: ReactNode }>;
      const language = /language-([\w-]+)/.exec(el.props.className ?? '')?.[1];
      const code = String(el.props.children ?? '').replace(/\n$/, '');
      return <CodeBlock language={language} code={code} />;
    }
    return <pre>{children}</pre>;
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table>{children}</table>
      </div>
    );
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

function Markdown({ content }: { content: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
