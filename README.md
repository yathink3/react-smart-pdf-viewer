# 📄 react-smart-pdf-viewer

A lightweight, versatile React component to render PDF files into high-quality HTML5 Canvases, with an extensible plugin system for **Word (.doc/.docx)** and **Excel (.xls/.xlsx)** support.

---

## 📦 Installation

```bash
npm install react-smart-pdf-viewer

```

---

## ⚙️ Usage

### Basic Example (PDF)

```jsx
import ReactSmartPdfViewer from 'react-smart-pdf-viewer';

function App() {
  return (
    <ReactSmartPdfViewer
      fileUrl="https://example.com/sample.pdf"
      viewMode="viewer"
    />
  );
}

```

### Advanced Example (Excel & Doc Support)

To support spreadsheet and document, import and pass the corresponding plugins.

```jsx
import ReactSmartPdfViewer from 'react-smart-pdf-viewer';
import { excelRenderer, docRenderer } from 'react-smart-pdf-viewer/plugins';

function App() {
  return (
    <ReactSmartPdfViewer
      fileUrl="https://example.com/data.xlsx"
      renderPlugins={[excelRenderer, docRenderer]}
    />
  );
}

```

---

## 🛠 Props API

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `fileUrl` | `string` | **Required** | The URL, Blob, or Base64 string of the file. |
| `renderPlugins` | `Array` | `[]` | List of plugins to handle non-PDF formats (e.g., `excelRenderer`). |
| `nativeView` | `boolean` | `false` | If `false`, the component uses plugins to render files. If `true`, it defaults to the browser's native PDF viewer. |
| `noRecordMessage` | `string` | `'No Record Found'` | Message to display when no file is available. |
| `viewMode` | `'canvas' | 'viewer'` | `'canvas'` | `'canvas'` for a vertical list; `'viewer'` for a UI with a toolbar. |
| `scale` | `number` | `1.5` | The zoom level/scale. (it works when nativeView is false) |
| `maxPages` | `number` | `20` | Maximum pages or sheets to render. (it works when nativeView is false) |
| `onClose` | `Function` | `undefined` | Callback triggered when the 'X' (cross) icon is clicked. (it works when nativeView is false) |
| `showDownload` | `boolean` | `false` | Whether to display the download button. (it works when nativeView is false) |
| `trimSpace` | `boolean` | `false` | Whether to trim whitespace from the PDF. (it works when nativeView is false) |
---

## 🧠 Behavior Overview

### 📊 Excel Support (`.xls`, `.xlsx`)

The component intercepts Excel files and transforms them into interactive, accessible HTML tables. Each sheet in the workbook is rendered as a separate section.

### 🎨 Rendering Modes

* **Canvas Mode (`viewMode="canvas"`)**: Best for embedding documents directly into a page layout.
* **Viewer Mode (`viewMode="viewer"`)**: Best for full-screen or modal previews. Includes a UI overlay with actions.

### ⚡ Performance

* **Lazy Loading**: Plugins are only invoked when the file extension matches the plugin's capability.
* **Memory Safety**: Use `maxPages` to ensure large spreadsheets or documents don't exceed browser memory limits.

---

## 🧩 Plugin Configuration

```jsx
<ReactSmartPdfViewer
  fileUrl={myExcelBlob}
  renderPlugins={[excelRenderer]}
  downloadFileName="Monthly_Report.xlsx"
/>

```

---

## 📜 License

MIT