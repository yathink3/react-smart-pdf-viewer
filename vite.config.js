import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const fixDynamicEvalRequire = {
  name: 'fix-dynamic-eval-require',
  transform(code) {
    const regex = /eval\(['"]require['"]\)\(([^)]+)\)/g;
    if (regex.test(code)) {
      return {
        code: code.replace(regex, '(typeof commonjsRequire === "function" ? commonjsRequire($1) : require($1))'),
        map: null
      };
    }
  }
};

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.jsx"),
        plugins: resolve(__dirname, "src/plugins/index.js"),
        helpers: resolve(__dirname, "src/helpers/index.js"),
      },
      name: "ReactSmartPdfViewer",
      formats: ["es"],
    },
    rolldownOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime"
      ],
     output: {
        // Provide global variables for UMD to use when finding external dependencies
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
        exports: "named",
      },
    },
  },
  plugins: [
    fixDynamicEvalRequire,
  ],
});