import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Maximize, Minimize, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, title }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset state when PDF URL changes
    setIsLoading(true);
    setError(null);
  }, [pdfUrl]);

  const handleFullscreen = () => {
    const viewerElement = document.getElementById('pdf-viewer-container');
    
    if (!viewerElement) return;
    
    if (!isFullscreen) {
      if (viewerElement.requestFullscreen) {
        viewerElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf` : 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const increaseZoom = () => setZoom(prev => Math.min(prev + 0.25, 3));
  
  const decreaseZoom = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div className="flex flex-col w-full h-full bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center p-2 bg-white border-b">
        <div className="text-lg font-medium truncate">
          {title || 'PDF Document'}
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={decreaseZoom} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={increaseZoom} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div id="pdf-viewer-container" className="flex-grow relative overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Skeleton className="h-8 w-32 mx-auto mb-4" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Error loading PDF</p>
              <p className="text-sm">{error}</p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        )}
        
        <iframe 
          src={`${pdfUrl}#zoom=${zoom * 100}%`}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load PDF. The file may be corrupt or not accessible.");
          }}
          title="PDF Viewer"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <div className="flex justify-between px-4 py-2 bg-gray-50 border-t">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button variant="outline" size="sm">
          Next <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default PDFViewer; 