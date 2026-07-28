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
    <div className="relative w-full">
      {/* Invisible full text to reserve layout space */}
      <div className="opacity-0 pointer-events-none select-none" aria-hidden="true">
        {text}
      </div>
      {/* Absolute positioned typing text */}
      <div className="absolute top-0 left-0 w-full h-full">
        {displayedText}
        {isTyping && (
          <span className="animate-pulse opacity-50 bg-primary w-[8px] h-[1em] inline-block ml-1 align-middle translate-y-[-1px]" />
        )}
      </div>
    </div>
  );
}
