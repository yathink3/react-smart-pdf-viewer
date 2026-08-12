import React from 'react';
import pdfjs from '@bundled-es-modules/pdfjs-dist';
import { usePdfConversion } from './hooks/usePdfConversion';
import { useWindowResize } from './hooks/useWindowResize';
import { usePdfMetadata } from './hooks/usePdfMetadata';
import { downloadFile } from './utils/downloadFile';
import { NativeViewer } from './components/NativeViewer';
import { CanvasViewer } from './components/CanvasViewer';
import embeddedStyles from './styles.css?inline';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const ReactSmartPdfViewer = ({
  fileUrl,
  viewMode = 'canvas',
  renderPlugins = [],
  scale = 1.5,
  maxPages = 20,
  nativeView = false,
  clarityFactor = 2,
  padding = 20,
  className = '',
  containerStyle = {},
  onClose,
  showDownload = false,
  downloadFileName = '',
  noRecordMessage = 'No Record Found',
  trimSpace = false,
}) => {
  const { isMobile, showSidebar, setShowSidebar } = useWindowResize();
  const { internalPdfUrl, isConverting } = usePdfConversion(fileUrl, renderPlugins);
  const { pdfTitle, setPdfTitle } = usePdfMetadata(internalPdfUrl, nativeView);

  // Prevent background scrolling in full viewer mode
  React.useEffect(() => {
    if (viewMode === 'viewer') {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [viewMode]);

  const handleDownload = () => downloadFile(fileUrl, pdfTitle, downloadFileName);

  const loaderMessage = isConverting ? 'Converting document...' : 'Preparing PDF viewer...';
  const fileName = pdfTitle || (fileUrl?.includes('/') ? decodeURIComponent(fileUrl.split('/').pop().split('?')[0]) : 'Document');

  return (
    <>
      <style>{embeddedStyles}</style>
      {nativeView ? (
        <NativeViewer
          isLoading={isConverting}
          internalPdfUrl={internalPdfUrl}
          loaderMessage={loaderMessage}
          noRecordMessage={noRecordMessage}
          viewMode={viewMode}
          className={className}
          containerStyle={containerStyle}
          isMobile={isMobile}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          fileName={fileName}
          showDownload={showDownload}
          handleDownload={handleDownload}
          onClose={onClose}
        />
      ) : (
        <CanvasViewer
          internalPdfUrl={internalPdfUrl}
          scale={scale}
          maxPages={maxPages}
          clarityFactor={clarityFactor}
          padding={padding}
          trimSpace={trimSpace}
          viewMode={viewMode}
          isMobile={isMobile}
          className={className}
          containerStyle={containerStyle}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          fileName={fileName}
          showDownload={showDownload}
          handleDownload={handleDownload}
          onClose={onClose}
          noRecordMessage={noRecordMessage}
          loaderMessage={loaderMessage}
          isConverting={isConverting}
          setPdfTitle={setPdfTitle}
        />
      )}
    </>
  );
};

export default ReactSmartPdfViewer;
