import * as mammoth from "mammoth";
import { jsPDF } from "jspdf";
import { createPlugin } from "../helpers/createPlugin";

export const docRenderer = createPlugin({
  name: "docRenderer",
  canHandle: [".docx", ".doc"],
  render: async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const htmlContent = result.value;

    const tempCont = document.createElement("div");
    tempCont.style.cssText = `
      position: fixed; left: 0; top: 0; width: 595pt; padding: 50pt;
      background: white; z-index: -1000; visibility: visible;
    `;
    tempCont.innerHTML = `
      <style>
        .docx-render { font-family: 'Helvetica', 'Arial', sans-serif; color: #000; line-height: 1.4; }
        .docx-render p { margin-bottom: 12pt; white-space: pre-wrap; }
        .docx-render strong { font-weight: bold; color: #1a1a1a; }
        .docx-render h1, .docx-render h2 { margin-top: 15pt; border-bottom: 1px solid #eee; }
      </style>
      <div class="docx-render">${htmlContent}</div>
    `;
    document.body.appendChild(tempCont);

    return new Promise((resolve) => {
      setTimeout(async () => {
        const doc = new jsPDF("p", "pt", "a4");
        await doc.html(tempCont, {
          x: 0,
          y: 0,
          width: 595,
          windowWidth: 595,
          autoPaging: "text",
          margin: [40, 40, 40, 40],
        });
        const blob = doc.output("blob");
        document.body.removeChild(tempCont);
        resolve(URL.createObjectURL(blob));
      }, 300);
    });
  },
});
