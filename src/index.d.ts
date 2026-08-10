import { RendererPlugin } from './plugins';

declare module '@bundled-es-modules/pdfjs-dist' {
  const pdfjs: any;
  export default pdfjs;
}

export type ReactSmartPdfViewerProps = {
  /** The URL, Blob, or Base64 string of the PDF file. */
  fileUrl: string | Blob;
  /** Layout mode: 'canvas' for list, 'viewer' for IDE-style UI. */
  viewMode?: 'canvas' | 'viewer';
  /** Optional plugins for handling non-PDF formats (e.g. excelRenderer). */
  renderPlugins?: RendererPlugin[];
  /** The zoom level of the rendered PDF. @default 1.5 */
  scale?: number;
  /** Maximum pages to render. @default 20 */
  maxPages?: number;
  /** If true, uses the browser's built-in PDF iframe. */
  nativeView?: boolean;
  /** Upscale multiplier for high-DPI displays. @default 2 */
  clarityFactor?: number;
  /** Padding (px) for the vertical auto-crop logic. */
  padding?: number;
  /** Optional CSS class for the wrapper. */
  className?: string;
  /** Inline styles for the root container. */
  containerStyle?: React.CSSProperties;
  /** Callback triggered when the close icon is clicked. */
  onClose?: () => void;
  /** Whether to show the download button. */
  showDownload?: boolean;
  /** Custom name for the downloaded file. */
  downloadFileName?: string;
  /** Message to display when no file is provided. */
  noRecordMessage?: string;
  /** Whether to trim whitespace from the PDF. */
  trimSpace?: boolean;
};

declare const ReactSmartPdfViewer: React.FC<ReactSmartPdfViewerProps>;

export default ReactSmartPdfViewer;
