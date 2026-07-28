import React, { useState, useEffect, useRef } from 'react';

interface Props {
  text: string;
  speed?: number;
  /** If true, renders text immediately without animation (used during live streaming) */
  live?: boolean;
}

/**
 * TypewriterText — animates text character-by-character when `live` is false.
 * When `live` is true (streaming in progress), displays text as-is to avoid
 * fighting with the real incoming stream.
 */
export function TypewriterText({ text, speed = 20, live = false }: Props) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const prevTextRef = useRef('');

  useEffect(() => {
    if (live) {
      // During live streaming just show the text directly
      setDisplayedText(text);
      setIsTyping(false);
      prevTextRef.current = text;
      return;
    }

    // After streaming is done, animate any newly arrived characters
    const prevText = prevTextRef.current;
    if (text === prevText) return;

    // If text has grown (common), animate only the new portion
    if (text.startsWith(prevText)) {
      let i = prevText.length;
      setIsTyping(true);
      const timer = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
        } else {
          setIsTyping(false);
          prevTextRef.current = text;
          clearInterval(timer);
        }
      }, speed);
      return () => clearInterval(timer);
    }

    // Text changed entirely — restart from scratch
    prevTextRef.current = '';
    let i = 0;
    setDisplayedText('');
    setIsTyping(true);
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        prevTextRef.current = text;
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, live]);

  return (
    <span className="relative" style={{ whiteSpace: 'pre-wrap' }}>
      {displayedText}
      {isTyping && (
        <span className="animate-pulse opacity-60 bg-current w-[2px] h-[1em] inline-block ml-[2px] align-middle" />
      )}
    </span>
  );
}
