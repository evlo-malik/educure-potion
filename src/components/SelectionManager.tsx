import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import html2canvas from 'html2canvas';

interface SelectionManagerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  isAreaSelectionMode: boolean;
  isTextSelectionMode: boolean;
  onAreaSelect: (imageData: string) => void;
  onTextSelect: (text: string) => void;
  isMobile: boolean;
}

interface SelectionRect {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export default function SelectionManager({
  containerRef,
  isAreaSelectionMode,
  isTextSelectionMode,
  onAreaSelect,
  onTextSelect,
  isMobile
}: SelectionManagerProps) {
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [showChatButton, setShowChatButton] = useState(false);
  const [chatButtonPosition, setChatButtonPosition] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentSelectionRef = useRef<SelectionRect | null>(null);

  // Clear selection when modes change
  useEffect(() => {
    setSelectionRect(null);
    setShowChatButton(false);
    currentSelectionRef.current = null;
    setIsDrawing(false);
  }, [isAreaSelectionMode, isTextSelectionMode]);

  const captureSelectedArea = async (rect: SelectionRect) => {
    if (!containerRef.current) return null;

    try {
      const container = containerRef.current;
      const pdfPage = container.querySelector('.react-pdf__Page');
      
      if (!pdfPage) return null;

      const canvas = await html2canvas(pdfPage as HTMLElement, {
        x: rect.startX,
        y: rect.startY - container.scrollTop,
        width: rect.width,
        height: rect.height,
        scale: window.devicePixelRatio,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedPage = clonedDoc.querySelector('.react-pdf__Page');
          if (clonedPage) {
            (clonedPage as HTMLElement).style.transform = 'none';
          }
        }
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing area:', error);
      return null;
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!isAreaSelectionMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;

    startPosRef.current = { x, y };
    setIsDrawing(true);
    setShowChatButton(false);
    
    const newRect = {
      startX: x,
      startY: y,
      width: 0,
      height: 0
    };
    setSelectionRect(newRect);
    currentSelectionRef.current = newRect;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !isAreaSelectionMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top + containerRef.current.scrollTop;

    const width = Math.abs(currentX - startPosRef.current.x);
    const height = Math.abs(currentY - startPosRef.current.y);
    const startX = Math.min(startPosRef.current.x, currentX);
    const startY = Math.min(startPosRef.current.y, currentY);

    const newRect = { startX, startY, width, height };
    setSelectionRect(newRect);
    currentSelectionRef.current = newRect;
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !containerRef.current || !currentSelectionRef.current) return;

    setIsDrawing(false);

    const currentRect = currentSelectionRef.current;
    if (currentRect.width < 20 || currentRect.height < 20) {
      setSelectionRect(null);
      currentSelectionRef.current = null;
      return;
    }

    const imageData = await captureSelectedArea(currentRect);
    if (imageData) {
      const buttonX = isMobile
        ? window.innerWidth / 2
        : currentRect.startX + currentRect.width + 20;

      const buttonY = currentRect.startY + currentRect.height / 2;

      setChatButtonPosition({ x: buttonX, y: buttonY });
      setShowChatButton(true);
      onAreaSelect(imageData);
    }
  };

  // Handle text selection
  useEffect(() => {
    const handleTextSelection = () => {
      if (!isTextSelectionMode) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && containerRef.current) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        
        if (rect) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const scrollTop = containerRef.current.scrollTop;

          const buttonX = isMobile
            ? window.innerWidth / 2
            : rect.right - containerRect.left + 20;

          const buttonY = rect.top - containerRect.top + scrollTop + rect.height / 2;

          setChatButtonPosition({ x: buttonX, y: buttonY });
          setShowChatButton(true);
          onTextSelect(text);
        }
      } else {
        setShowChatButton(false);
      }
    };

    document.addEventListener('selectionchange', handleTextSelection);
    return () => document.removeEventListener('selectionchange', handleTextSelection);
  }, [isTextSelectionMode, isMobile, onTextSelect]);

  // Handle area selection events
  useEffect(() => {
    if (!containerRef.current || !isAreaSelectionMode) return;

    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isAreaSelectionMode, isDrawing]);

  return (
    <>
      {selectionRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: selectionRect.startX,
            top: selectionRect.startY,
            width: selectionRect.width,
            height: selectionRect.height,
            border: '2px solid rgba(124, 58, 237, 0.8)',
            background: 'rgba(124, 58, 237, 0.1)',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
            zIndex: 40,
            borderRadius: '4px',
            transition: isDrawing ? 'none' : 'all 0.2s ease-in-out'
          }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
        </div>
      )}

      {showChatButton && (
        <button
          className="fixed z-50 px-4 py-2 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-500 transition-all flex items-center gap-2 animate-fadeIn"
          style={{
            left: chatButtonPosition.x,
            top: chatButtonPosition.y,
            transform: isMobile ? 'translateX(-50%)' : 'none'
          }}
          onClick={() => {
            setShowChatButton(false);
            setSelectionRect(null);
            currentSelectionRef.current = null;
          }}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
      )}
    </>
  );
}