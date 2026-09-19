'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  text: string;
  className?: string;
  title?: string;
}

export default function CopyButton({ text, className = '', title = 'Copy' }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (insecure context) — ignore */
    }
  };

  return (
    <button type="button" onClick={copy} title={copied ? 'Copied' : title} aria-label={title} className={className}>
      {copied ? <Check size={15} className="text-[#3b7a57]" /> : <Copy size={15} />}
    </button>
  );
}
