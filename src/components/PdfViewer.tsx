import React, { useState, useRef, useEffect } from 'react';
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  MessageSquare,
  Wand2,
  Highlighter,
  MousePointerSquare,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';

// Configure worker to use local file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PdfViewerProps {
  url: string;
  scale: number;
  onScaleChange: (scale: number) => void;
  onTextSelect?: (text: string) => void;
  onAreaSelect?: (imageData: string) => void;
}

interface SelectionRect {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export default function PdfViewer({
  url,
  scale,
  onScaleChange,
  onTextSelect,
  onAreaSelect,
}: PdfViewerProps) {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfData, setPdfData] = useState<Blob | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isAreaSelectionMode, setIsAreaSelectionMode] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showChatButton, setShowChatButton] = useState(false);
  const [chatButtonPosition, setChatButtonPosition] = useState({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [touchStartPoint, setTouchStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isTouchDevice] = useState(() => 'ontouchstart' in window);
  const [isAreaSelectionActive, setIsAreaSelectionActive] = useState(false);

  const [selectionStyles, setSelectionStyles] = useState({
    border: '2px solid rgba(99, 102, 241, 0.8)',
    background: 'rgba(99, 102, 241, 0.1)',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease-in-out',
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  // Retry logic for loading PDF
  const loadPdfWithRetry = async (url: string, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.blob();
      } catch (error) {
        if (i === maxRetries - 1) {
          console.error('Failed to load PDF:', error);
          setLoadError('Failed to load PDF. Please try refreshing the page.');
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  };

  useEffect(() => {
    if (url) {
      setIsLoading(true);
      setLoadError(null);
      loadPdfWithRetry(url)
        .then((blob) => {
          if (blob) {
            setPdfData(blob);
          }
        })
        .catch((error) => {
          console.error('Error loading PDF:', error);
          setLoadError('Failed to load PDF. Please try refreshing the page.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [url]);

  // Zoom handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.5, Math.min(2, scale + delta));
        onScaleChange(newScale);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [scale, onScaleChange]);

  // Handle area selection activation on touch devices
  useEffect(() => {
    if (isAreaSelectionMode && isTouchDevice) {
      setIsAreaSelectionActive(true);
      if (containerRef.current) {
        containerRef.current.style.overflow = 'hidden';
        containerRef.current.style.touchAction = 'none';
      }
    } else {
      setIsAreaSelectionActive(false);
      if (containerRef.current) {
        containerRef.current.style.overflow = 'auto';
        containerRef.current.style.touchAction = 'auto';
      }
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.style.overflow = 'auto';
        containerRef.current.style.touchAction = 'auto';
      }
    };
  }, [isAreaSelectionMode, isTouchDevice]);

  // Handle touch start for area selection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAreaSelectionMode || !isAreaSelectionActive) return;

    e.preventDefault(); // Prevent scrolling while selecting
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top + container.scrollTop;

    setTouchStartPoint({ x, y });
    setStartPoint({ x, y });
    setIsDrawing(true);
    setSelectionRect({
      startX: x,
      startY: y,
      width: 0,
      height: 0,
    });
  };

  // Handle touch move for area selection
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing || !isAreaSelectionMode || !touchStartPoint || !isAreaSelectionActive) return;

    e.preventDefault(); // Prevent scrolling while selecting
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top + container.scrollTop;

    setSelectionRect({
      startX: Math.min(touchStartPoint.x, x),
      startY: Math.min(touchStartPoint.y, y),
      width: Math.abs(x - touchStartPoint.x),
      height: Math.abs(y - touchStartPoint.y),
    });
  };

  // Handle touch end for area selection
  const handleTouchEnd = async () => {
    if (!isDrawing || !isAreaSelectionMode || !selectionRect) return;
    setIsDrawing(false);
    setTouchStartPoint(null);

    if (selectionRect.width < 20 || selectionRect.height < 20) {
      setSelectionRect(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    try {
      const canvas = await html2canvas(container, {
        x: selectionRect.startX,
        y: selectionRect.startY,
        width: selectionRect.width,
        height: selectionRect.height,
        scrollX: 0,
        scrollY: -container.scrollTop,
        scale: window.devicePixelRatio,
      });

      const imageData = canvas.toDataURL('image/png');
      setSelectedArea(imageData);

      // Position chat button for mobile
      const buttonX = window.innerWidth / 2;
      const buttonY = selectionRect.startY + selectionRect.height + 20;

      setChatButtonPosition({ x: buttonX, y: buttonY });
      setShowChatButton(true);
    } catch (error) {
      console.error('Error capturing area:', error);
    }
  };

  // Handle text selection for mobile
  useEffect(() => {
    const handleMobileTextSelection = () => {
      if (!isSelectionMode || isAreaSelectionMode) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text) {
        setSelectedText(text);
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const scrollTop = containerRef.current.scrollTop;

          // Position chat button for mobile
          const buttonX = window.innerWidth / 2;
          const buttonY = rect.bottom - containerRect.top + scrollTop + 20;

          setChatButtonPosition({ x: buttonX, y: buttonY });
          setShowChatButton(true);
        }
      } else {
        setShowChatButton(false);
      }
    };

    document.addEventListener('selectionchange', handleMobileTextSelection);
    return () => document.removeEventListener('selectionchange', handleMobileTextSelection);
  }, [isSelectionMode, isAreaSelectionMode]);

  // Handle mouse up for text selection
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (!isSelectionMode || isAreaSelectionMode) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text) {
        setSelectedText(text);
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const scrollTop = containerRef.current.scrollTop;

          let x = rect.right - containerRect.left;
          let y = rect.bottom - containerRect.top + scrollTop;

          const buttonWidth = 100;
          const buttonHeight = 32;
          const containerWidth = containerRef.current.clientWidth;

          if (x + buttonWidth > containerWidth) {
            x = containerWidth - buttonWidth - 20;
          }
          x = Math.max(20, x);

          if (y + buttonHeight > containerRef.current.clientHeight + scrollTop) {
            y = rect.top - containerRect.top + scrollTop - buttonHeight - 10;
          }
          y = Math.max(scrollTop + 20, y);

          setChatButtonPosition({ x, y });
          setShowChatButton(true);
        }
      } else {
        setShowChatButton(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isSelectionMode, isAreaSelectionMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAreaSelectionMode) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + container.scrollTop;

    setStartPoint({ x, y });
    setIsDrawing(true);
    setSelectionRect({
      startX: x,
      startY: y,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !isAreaSelectionMode) return;

    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top + container.scrollTop;

      setSelectionRect({
        startX: Math.min(startPoint.x, x),
        startY: Math.min(startPoint.y, y),
        width: Math.abs(x - startPoint.x),
        height: Math.abs(y - startPoint.y),
      });

      const size = Math.abs(x - startPoint.x) * Math.abs(y - startPoint.y);
      const opacity = Math.min(0.2, Math.max(0.05, size / 100000));

      setSelectionStyles({
        border: '2px solid rgba(99, 102, 241, 0.8)',
        background: `rgba(99, 102, 241, ${opacity})`,
        boxShadow: `0 0 0 9999px rgba(0, 0, 0, ${0.3 + opacity})`,
        transition: 'none',
      });
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMovePassive = (e: MouseEvent) => {
      if (!isDrawing || !isAreaSelectionMode) return;
      handleMouseMove(e as unknown as React.MouseEvent);
    };

    container.addEventListener('mousemove', handleMouseMovePassive, {
      passive: true,
    });
    return () => container.removeEventListener('mousemove', handleMouseMovePassive);
  }, [isDrawing, isAreaSelectionMode, startPoint]);

  const handleMouseUp = async () => {
    if (!isDrawing || !isAreaSelectionMode || !selectionRect) return;
    setIsDrawing(false);

    if (selectionRect.width < 20 || selectionRect.height < 20) {
      setSelectionRect(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    try {
      const canvas = await html2canvas(container, {
        x: selectionRect.startX,
        y: selectionRect.startY,
        width: selectionRect.width,
        height: selectionRect.height,
        scrollX: 0,
        scrollY: -container.scrollTop,
        scale: window.devicePixelRatio,
      });

      const imageData = canvas.toDataURL('image/png');
      setSelectedArea(imageData);

      const buttonX = isMobileDevice
        ? window.innerWidth / 2
        : selectionRect.startX + selectionRect.width + 10;

      const buttonY = isMobileDevice
        ? selectionRect.startY + selectionRect.height + 20
        : selectionRect.startY + selectionRect.height / 2 - 16;

      setChatButtonPosition({ x: buttonX, y: buttonY });
      setShowChatButton(true);
    } catch (error) {
      console.error('Error capturing area:', error);
    }
  };

  const handleChatClick = () => {
    if (selectedArea && onAreaSelect) {
      onAreaSelect(selectedArea);
      setSelectionRect(null);
      setShowChatButton(false);
    } else if (selectedText && onTextSelect) {
      onTextSelect(selectedText);
      setShowChatButton(false);
    }
  };

  // Set initial scale for mobile
  useEffect(() => {
    if (isMobileDevice && scale === 1) {
      onScaleChange(0.5);
    }
  }, [isMobileDevice]);

  const toggleFullscreen = async () => {
    try {
      const pdfContainer = containerRef.current?.querySelector('.pdf-container') as HTMLElement;
      if (!document.fullscreenElement && pdfContainer) {
        await pdfContainer.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md text-center">
          <p className="text-red-600 font-medium mb-2">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`h-[calc(100vh-4rem)] bg-gray-100 dark:bg-black overflow-hidden relative ${
        isAreaSelectionActive ? 'touch-none' : ''
      }`}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Toolbar */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg dark:shadow-gray-900/50 p-2 animate-fadeIn">
        <button
          onClick={() => onScaleChange(Math.max(0.5, scale - 0.1))}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
          disabled={scale <= 0.5}
          title="Zoom Out (Ctrl + Scroll Down)"
        >
          <ZoomOut className="h-4 w-4 dark:text-gray-300" />
        </button>
        <span className="text-sm font-medium min-w-[3rem] text-center dark:text-gray-300">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => onScaleChange(Math.min(2, scale + 0.1))}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
          disabled={scale >= 2}
          title="Zoom In (Ctrl + Scroll Up)"
        >
          <ZoomIn className="h-4 w-4 dark:text-gray-300" />
        </button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {!isMobileDevice && (
          <>
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setIsAreaSelectionMode(false);
                setSelectionRect(null);
                setShowChatButton(false);
                setSelectedArea(null);
              }}
              className={`p-2 rounded-md transition-all duration-300 ${
                isSelectionMode
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              } group relative`}
              title={
                isSelectionMode ? 'Disable Text Selection' : 'Enable Smart Text Selection'
              }
            >
              <Highlighter className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
            <button
              onClick={() => {
                setIsAreaSelectionMode(!isAreaSelectionMode);
                setIsSelectionMode(false);
                setSelectionRect(null);
                setShowChatButton(false);
                setSelectedArea(null);
              }}
              className={`p-2 rounded-md transition-all duration-300 ${
                isAreaSelectionMode
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              } group relative`}
              title={
                isAreaSelectionMode ? 'Disable Area Selection' : 'Enable Smart Area Selection'
              }
            >
              <MousePointerSquare className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Chat Button */}
      {showChatButton && (
        <div
          style={{
            position: 'absolute',
            left: `${chatButtonPosition.x}px`,
            top: `${chatButtonPosition.y}px`,
            zIndex: 50,
            transform: isMobileDevice ? 'translateX(-50%)' : 'none',
          }}
          className="animate-fadeIn"
        >
          <button
            onClick={handleChatClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-lg transform transition-all duration-200 hover:scale-105 hover:bg-indigo-500"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
        </div>
      )}

      {/* Selection Rectangle */}
      {selectionRect && (
        <div
          className="absolute pointer-events-none animate-fadeIn will-change-transform"
          style={{
            transform: `translate(${selectionRect.startX}px, ${selectionRect.startY}px)`,
            width: selectionRect.width,
            height: selectionRect.height,
            border: selectionStyles.border,
            background: selectionStyles.background,
            boxShadow: selectionStyles.boxShadow,
            transition: selectionStyles.transition,
            zIndex: 40,
            borderRadius: '4px',
          }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-indigo-500 rounded-full" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-indigo-500 rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full" />
        </div>
      )}

      {/* Mode Indicators */}
      {(isSelectionMode || isAreaSelectionMode) && (
        <div className="absolute top-20 left-6 z-10 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-full text-sm font-medium animate-fadeIn">
          {isSelectionMode ? t('documentView.selectionMode.textActive') : t('documentView.selectionMode.areaActive')}
        </div>
      )}

      {/* PDF Content */}
      <div
        className={`absolute inset-0 overflow-y-auto pdf-container ${
          isSelectionMode
            ? 'cursor-text'
            : isAreaSelectionMode
            ? 'cursor-crosshair'
            : ''
        }`}
        style={{ height: '100%', maxHeight: '100%' }}
      >
        {isLoading || !pdfData ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <PDFDocument
            file={pdfData}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-full text-red-500 dark:text-red-400">
                <p className="font-medium">Failed to load PDF</p>
                <p className="text-sm mt-2">Please try again later</p>
              </div>
            }
            className="min-h-full"
          >
            {Array.from(new Array(numPages || 0), (_, index) => (
              <div key={`page_${index + 1}`} className="flex justify-center p-4">
                <div className="bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-900/50 rounded-lg">
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={isSelectionMode}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="w-full aspect-[1/1.4] bg-white/50 dark:bg-gray-900/50 animate-pulse rounded-lg" />
                    }
                  />
                </div>
              </div>
            ))}
          </PDFDocument>
        )}
      </div>
    </div>
  );
}
