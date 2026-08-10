import type { RendererPlugin } from './plugins';
import * as pdfjsModule from '@bundled-es-modules/pdfjs-dist';

declare module '@bundled-es-modules/pdfjs-dist' {
  const pdfjs: typeof pdfjsModule;
  export default pdfjs;
}

export interface CreatePluginOptions {
  name: string;
  canHandle: ((url: string | Blob) => boolean) | string[] | string;
  render: (url: string | Blob) => Promise<void | HTMLElement | string>;
}

export function createPlugin(options: CreatePluginOptions): RendererPlugin;

export function canHandleFileType(url?: string, supportedTypes?: string[]): boolean;

export const pdfjs: typeof pdfjsModule;
export { default as html2canvas } from 'html2canvas';
export { jsPDF } from 'jspdf';
export { default as autoTable } from 'jspdf-autotable';
export * as mammoth from 'mammoth';
export * as XLSX from 'xlsx';
