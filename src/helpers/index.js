import pdfjs from '@bundled-es-modules/pdfjs-dist';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

import { createPlugin } from './createPlugin';
import { canHandleFileType } from '../plugins/utils';

export {
  createPlugin,
  canHandleFileType,
  pdfjs,
  html2canvas,
  jsPDF,
  autoTable,
  mammoth,
  XLSX,
};
