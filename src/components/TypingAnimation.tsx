import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export default function TypingAnimation({ 
  text, 
  speed = 30,
  className = '',
  onComplete 
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousTextRef = useRef(text);
  const isTypingRef = useRef(true);

  const animateTyping = useCallback(() => {
    if (!isTypingRef.current || currentIndexRef.current >= text.length) {
      isTypingRef.current = false;
      if (onComplete) onComplete();
      return;
    }

    // Calculate dynamic speed based on punctuation
    let currentSpeed = speed;
    const char = text[currentIndexRef.current];
    if (['.', '!', '?'].includes(char)) currentSpeed *= 4;
    else if ([',', ';', ':'].includes(char)) currentSpeed *= 2;

    timeoutRef.current = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndexRef.current + 1));
      currentIndexRef.current += 1;
      animateTyping();
    }, currentSpeed);
  }, [text, speed, onComplete]);

  useEffect(() => {
    // If text has changed, reset animation
    if (text !== previousTextRef.current) {
      setDisplayedText('');
      currentIndexRef.current = 0;
      isTypingRef.current = true;
      previousTextRef.current = text;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      animateTyping();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, animateTyping]);

  return (
    <span className={className}>
      {displayedText}
    </span>
  );
}