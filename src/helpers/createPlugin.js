import { canHandleFileType } from '../plugins/utils';

/**
 * Utility function to create a plugin object for react-smart-pdf-viewer.
 *
 * @param {Object} config - Plugin configuration options.
 * @param {string} config.name - Unique identifier for the plugin.
 * @param {Function|string[]|string} config.canHandle - Function taking (url) returning boolean, or extension string/array (e.g. ['.docx', '.doc']).
 * @param {Function} config.render - Async function that takes fileUrl and returns a Promise resolving to a PDF Blob URL or Object URL.
 * @returns {Object} Plugin object containing { name, canHandle, render }
 */
export function createPlugin(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('createPlugin expects a configuration object');
  }

  const { name, canHandle, render } = config;

  if (!name || typeof name !== 'string') {
    throw new Error('createPlugin: "name" is required and must be a string');
  }

  if (typeof render !== 'function') {
    throw new Error('createPlugin: "render" is required and must be a function');
  }

  let canHandleFn;
  if (typeof canHandle === 'function') {
    canHandleFn = canHandle;
  } else if (Array.isArray(canHandle)) {
    canHandleFn = (url) => canHandleFileType(url, canHandle);
  } else if (typeof canHandle === 'string') {
    canHandleFn = (url) => canHandleFileType(url, [canHandle]);
  } else {
    throw new Error('createPlugin: "canHandle" must be a function, string, or array of file extensions');
  }

  return {
    name,
    canHandle: canHandleFn,
    render,
  };
}
