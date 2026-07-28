import React, { useState, useEffect } from 'react';

export function TypewriterText({ text, speed = 20 }: { text: string, speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    setIsTyping(true);
    
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className="relative">
      {displayedText}
      {isTyping && (
        <span className="animate-pulse opacity-60 bg-current w-[2px] h-[1em] inline-block ml-[2px] align-middle" />
      )}
    </span>
  );
}
