import React from 'react';
import { CodeBlock } from './CodeBlock';
import { TypewriterText } from './TypewriterText';

interface MarkdownContentProps {
  content: string;
  live?: boolean;
  onSuggest?: (prompt: string) => void;
}

export function MarkdownContent({ content, live = false, onSuggest }: MarkdownContentProps) {
  // Regex to match code blocks ```lang\ncode```
  const codeBlockRegex = /```([a-zA-Z0-9_+#-]*)\n([\s\S]*?)```/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      elements.push(
        <TypewriterText key={`text-${lastIndex}`} text={textBefore} speed={8} live={live} />
      );
    }

    const language = match[1]?.trim() || 'code';
    const code = match[2]?.trimEnd() || '';

    elements.push(
      <CodeBlock
        key={`code-${match.index}`}
        language={language}
        code={code}
        onSuggest={onSuggest}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    elements.push(
      <TypewriterText key={`text-${lastIndex}`} text={remainingText} speed={8} live={live} />
    );
  }

  return <div className="space-y-2">{elements}</div>;
}
