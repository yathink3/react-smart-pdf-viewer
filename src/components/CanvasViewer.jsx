import React, { useRef } from 'react';
import { Loader } from './Loader';
import { PdfHeader } from './PdfHeader';
import { PdfSidebar } from './PdfSidebar';
import { usePdfRenderer } from '../hooks/usePdfRenderer';
import { usePdfScrollObserver } from '../hooks/usePdfScrollObserver';

export const CanvasViewer = ({
  internalPdfUrl,
  scale,
  maxPages,
  clarityFactor,
  padding,
  trimSpace,
  viewMode,
  isMobile,
  className,
  containerStyle,
  showSidebar,
  setShowSidebar,
  fileName,
  showDownload,
  handleDownload,
  onClose,
  noRecordMessage,
  loaderMessage,
  isConverting,
  setPdfTitle,
}) => {
  const { pageCount, linkOverlays, isRendering, mainRefs, thumbRefs } = usePdfRenderer({
    internalPdfUrl,
    scale,
    maxPages,
    clarityFactor,
    padding,
    trimSpace,
    viewMode,
    isMobile,
    setPdfTitle,
  });

  const mainContainerRef = useRef(null);

  const { activePageIndex, scrollToPage } = usePdfScrollObserver(
    pageCount,
    viewMode,
    mainContainerRef,
    mainRefs,
    isMobile,
    setShowSidebar
  );

  const isLoading = isConverting || isRendering;

  if (viewMode === 'viewer') {
    const isOpenable = !isMobile && pageCount !== 0;
    const isShowSidebar = showSidebar && pageCount !== 0;

    return (
      <div className={`pdf-viewer-mode pdf-canvas-viewer ${className}`.trim()} style={containerStyle}>
        <PdfSidebar
          pageCount={pageCount}
          isShowSidebar={isShowSidebar}
          activePageIndex={activePageIndex}
          scrollToPage={scrollToPage}
          thumbRefs={thumbRefs}
        />

        <div className="pdf-main-container">
          <PdfHeader
            isOpenable={isOpenable}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            fileName={fileName}
            showDownload={showDownload}
            handleDownload={handleDownload}
            onClose={onClose}
          />
          <div ref={mainContainerRef} className={`pdf-main-scroll ${isOpenable ? 'openable' : ''}`.trim()}>
            {isLoading && <Loader message={loaderMessage} />}
            {!isLoading && (!internalPdfUrl || pageCount === 0) && <div className="pdf-no-record">{noRecordMessage}</div>}
            <div className={`pdf-pages-container ${isLoading ? 'hidden' : ''}`.trim()}>
              {Array.from({ length: pageCount }, (_, i) => (
                <div key={`p-${i}`} data-page-index={i} className={`pdf-page-wrapper ${isOpenable ? 'openable' : ''}`.trim()}>
                  <canvas ref={el => (mainRefs.current[i] = { current: el })} className="pdf-page-canvas" />
                  <div className="pdf-link-overlay-container">
                    {linkOverlays[i]?.map(link => (
                      <a key={link.key} href={link.url} title={link.url} target="_blank" rel="noopener noreferrer" className="pdf-link-overlay" style={link.style} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-canvas-mode ${className}`.trim()} style={{ width: '100%', ...containerStyle }} title={fileName}>
      {isLoading && (
        <div className="pdf-center-container">
          <Loader message={loaderMessage} />
        </div>
      )}
      {!isLoading && (!internalPdfUrl || pageCount === 0) && (
        <div className="pdf-center-container">
          <div className="pdf-no-record">{noRecordMessage}</div>
        </div>
      )}
      <div className={`pdf-canvas-mode-pages ${isLoading ? 'hidden' : ''}`.trim()}>
        {Array.from({ length: pageCount }, (_, i) => (
          <div key={`canvas-p-${i}`} className="pdf-canvas-mode-wrapper">
            <canvas ref={el => (mainRefs.current[i] = { current: el })} className="pdf-canvas-mode-canvas" />
            <div className="pdf-link-overlay-container">
              {linkOverlays[i]?.map(link => (
                <a key={link.key} href={link.url} title={link.url} target="_blank" rel="noopener noreferrer" className="pdf-link-overlay" style={link.style} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
