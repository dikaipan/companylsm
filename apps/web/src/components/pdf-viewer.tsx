"use client";

import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, BookOpen, ScrollText, Maximize, Minimize } from "lucide-react";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker source to CDN to avoid local build issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
    url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState(1.0);
    const [viewMode, setViewMode] = useState<'scroll' | 'book'>('book');
    const [pageNumber, setPageNumber] = useState(1);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const goToPrevPage = () => setPageNumber(p => Math.max(1, p - 2));
    const goToNextPage = () => setPageNumber(p => Math.min(numPages, p + 2));

    // Measure container width for auto-fit using ResizeObserver
    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });

        observer.observe(node);
        return () => observer.disconnect();
    }, [containerRef.current]); // Re-run if ref changes (unlikely)

    // Handle Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Listen for fullscreen changes to update state
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Calculate generic page width based on mode
    const getPageWidth = () => {
        if (containerWidth === 0) return undefined;
        const effectiveContainerWidth = containerWidth - 40;
        // If fullscreen, we might want slightly different ratios, but responsive logic should handle it.
        const baseWidth = viewMode === 'book' ? (effectiveContainerWidth / 2) - 10 : effectiveContainerWidth;
        return baseWidth * scale;
    };

    return (
        <div
            ref={containerRef}
            className={`flex flex-col items-center w-full transition-all duration-300 ${isFullscreen
                    ? "fixed inset-0 z-50 bg-slate-900 h-screen overflow-hidden p-4"
                    : "bg-slate-100 min-h-[600px] p-4 rounded-lg relative"
                }`}
        >
            {/* Controls */}
            <div className={`sticky top-0 z-10 backdrop-blur-sm p-2 rounded-full border shadow-lg flex items-center gap-4 mb-6 transition-all ${isFullscreen ? "bg-slate-800/90 text-white border-slate-700 mt-4" : "bg-background/95 border-border"
                }`}>
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border-r pr-4 border-slate-200/20">
                    <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.6, s - 0.2))} title="Zoom Out" className={isFullscreen ? "hover:bg-slate-700 text-slate-200" : ""}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-mono font-medium min-w-[3ch] text-center select-none">{Math.round(scale * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(2.5, s + 0.2))} title="Zoom In" className={isFullscreen ? "hover:bg-slate-700 text-slate-200" : ""}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center gap-1 border-r pr-4 border-slate-200/20">
                    <Button
                        variant={viewMode === 'scroll' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('scroll')}
                        className={`text-xs flex gap-2 items-center ${isFullscreen && viewMode !== 'scroll' ? "hover:bg-slate-700 text-slate-200" : ""
                            } ${isFullscreen && viewMode === 'scroll' ? "bg-slate-700 text-white hover:bg-slate-600" : ""
                            }`}
                        title="Scroll View"
                    >
                        <ScrollText className="h-4 w-4" />
                        <span className="hidden sm:inline">Scroll</span>
                    </Button>
                    <Button
                        variant={viewMode === 'book' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('book')}
                        className={`text-xs flex gap-2 items-center ${isFullscreen && viewMode !== 'book' ? "hover:bg-slate-700 text-slate-200" : ""
                            } ${isFullscreen && viewMode === 'book' ? "bg-slate-700 text-white hover:bg-slate-600" : ""
                            }`}
                        title="Book View"
                    >
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Book</span>
                    </Button>
                </div>

                {/* Pagination (Book Mode only) */}
                {viewMode === 'book' && (
                    <div className={`flex items-center gap-2 border-r pr-4 border-slate-200/20 mr-2`}>
                        <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1} className={isFullscreen ? "hover:bg-slate-700 text-slate-200 disabled:opacity-30" : ""}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className={`text-xs whitespace-nowrap min-w-[8ch] text-center select-none ${isFullscreen ? "text-slate-300" : "text-muted-foreground"}`}>
                            {pageNumber} {numPages > 1 && pageNumber + 1 <= numPages ? `- ${pageNumber + 1}` : ''} / {numPages}
                        </span>
                        <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages} className={isFullscreen ? "hover:bg-slate-700 text-slate-200 disabled:opacity-30" : ""}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Fullscreen Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    className={isFullscreen ? "hover:bg-slate-700 text-slate-200" : ""}
                >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
            </div>

            {/* Document Canvas */}
            <div
                className={`flex-1 w-full flex justify-center items-start transition-all overflow-auto ${isFullscreen ? "h-full" : "min-h-[500px]"
                    }`}
            >
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-col items-center"
                    loading={<div className="p-10 flex flex-col items-center gap-2"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="text-muted-foreground">Loading Document...</span></div>}
                    error={<div className="text-red-500 p-8 border border-red-200 bg-red-50 rounded-lg">Failed to load PDF</div>}
                >
                    {viewMode === 'scroll' ? (
                        // Scroll Mode: Render all pages properly spaced
                        <div className="flex flex-col gap-6 py-8">
                            {Array.from(new Array(numPages), (_, index) => (
                                <div key={index} className="shadow-lg relative group transition-transform duration-200">
                                    <Page
                                        pageNumber={index + 1}
                                        width={getPageWidth()}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        className="bg-white"
                                    />
                                    <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        Page {index + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Book Mode: Render 1 or 2 pages side-by-side
                        <div
                            className={`flex flex-wrap justify-center gap-0 shadow-2xl my-4 bg-white transition-all duration-300 ${isFullscreen ? "shadow-black/50" : "border border-slate-200"
                                }`}
                        >
                            {/* Left Page (or single page) */}
                            <div className="border-r border-slate-100 relative group">
                                <Page
                                    pageNumber={pageNumber}
                                    width={getPageWidth()}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="bg-white"
                                />
                                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400 text-xs font-medium">
                                    {pageNumber}
                                </span>
                            </div>

                            {/* Right Page (if exists) */}
                            {pageNumber + 1 <= numPages && (
                                <div className="relative group">
                                    <Page
                                        pageNumber={pageNumber + 1}
                                        width={getPageWidth()}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        className="bg-white"
                                    />
                                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400 text-xs font-medium">
                                        {pageNumber + 1}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </Document>
            </div>
        </div>
    );
}
