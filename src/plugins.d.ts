export interface RendererPlugin {
  name: string;
  canHandle: (url: string | Blob) => boolean;
  render: (url: string | Blob) => Promise<void | HTMLElement | string>;
}

export const docRenderer: RendererPlugin;
export const excelRenderer: RendererPlugin;
