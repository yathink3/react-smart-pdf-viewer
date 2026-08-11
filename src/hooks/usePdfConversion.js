import { useState, useEffect } from 'react';

export const usePdfConversion = (fileUrl, renderPlugins) => {
  const [internalPdfUrl, setInternalPdfUrl] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (!fileUrl) return;

    const processFile = async () => {
      setIsConverting(true);
      const plugin = Array.isArray(renderPlugins) && renderPlugins.find(p => p.canHandle(fileUrl));

      try {
        if (plugin) {
          const convertedUrl = await plugin.render(fileUrl);
          setInternalPdfUrl(convertedUrl);
        } else {
          setInternalPdfUrl(fileUrl);
        }
      } catch (err) {
        console.error(`Conversion failed in plugin: ${plugin?.name || 'unknown'}`, err);
        setInternalPdfUrl(fileUrl);
      } finally {
        setIsConverting(false);
      }
    };

    processFile();

    return () => {
      if (internalPdfUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(internalPdfUrl);
      }
    };
  }, [fileUrl, renderPlugins]);

  return { internalPdfUrl, isConverting };
};
