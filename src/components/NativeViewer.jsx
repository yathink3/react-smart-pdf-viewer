import React from 'react';
import { Loader } from './Loader';
import { PdfHeader } from './PdfHeader';

export const NativeViewer = ({
  isLoading,
  internalPdfUrl,
  loaderMessage,
  noRecordMessage,
  viewMode,
  className,
  containerStyle,
  isMobile,
  showSidebar,
  setShowSidebar,
  fileName,
  showDownload,
  handleDownload,
  onClose,
}) => {
  if (viewMode === 'viewer') {
    const isOpenable = !isMobile;
    const navPanesParam = showSidebar ? 1 : 0;

    return (
      <div className={`pdf-viewer-mode pdf-native-view ${className}`.trim()} style={containerStyle}>
        <PdfHeader
          isOpenable={isOpenable}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          fileName={fileName}
          showDownload={showDownload}
          handleDownload={handleDownload}
          onClose={onClose}
        />
        <div className="pdf-native-content">
          {isLoading && <Loader message={loaderMessage} />}
          {!isLoading && !internalPdfUrl && <div className="pdf-no-record">{noRecordMessage}</div>}
          {!isLoading && internalPdfUrl && (
            <embed
              key={`pdf-embed-${navPanesParam}-${isOpenable}`}
              title={fileName}
              src={`${internalPdfUrl}#navpanes=${navPanesParam}`}
              type="application/pdf"
              className="pdf-native-embed"
            />
          )}
        </div>
      </div>
    );
  }

  if (isLoading) return <Loader message={loaderMessage} />;
  if (!internalPdfUrl) return <div className="pdf-no-record">{noRecordMessage}</div>;

  return (
    <embed
      title={fileName}
      src={`${internalPdfUrl}#toolbar=0&navpanes=0`}
      type="application/pdf"
      className="pdf-embed-default"
    />
  );
};
