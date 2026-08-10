export function canHandleFileType(url = '', supportedTypes = ['.xlsx', '.xls']) {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const hasAnyExtension = supportedTypes.some(ext => lowerUrl.includes(ext.toLowerCase()));
  if (!hasAnyExtension) return false;

  const matchesFullUrl = supportedTypes.some(ext => lowerUrl.endsWith(ext.toLowerCase()));
  if (matchesFullUrl) return true;

  const basePath = lowerUrl.split('?')[0];
  return supportedTypes.some(ext => basePath.endsWith(ext.toLowerCase()));
}