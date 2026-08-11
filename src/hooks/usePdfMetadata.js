import { useState, useEffect } from 'react';
import pdfjs from '@bundled-es-modules/pdfjs-dist';

export const usePdfMetadata = (internalPdfUrl, shouldFetch) => {
  const [pdfTitle, setPdfTitle] = useState('');

  useEffect(() => {
    if (shouldFetch && internalPdfUrl) {
      const fetchTitle = async () => {
        try {
          const loadingTask = pdfjs.getDocument(internalPdfUrl);
          const pdf = await loadingTask.promise;
          const metadata = await pdf.getMetadata();
          setPdfTitle(metadata.info?.Title || '');
        } catch (err) {
          console.error('Error loading PDF metadata:', err);
        }
      };
      fetchTitle();
    }
  }, [shouldFetch, internalPdfUrl]);

  return { pdfTitle, setPdfTitle };
};
