export const downloadFile = (fileUrl, pdfTitle, downloadFileName) => {
  const link = document.createElement('a');
  link.href = fileUrl;
  const finalName = downloadFileName || pdfTitle || 'document.pdf';
  link.download = finalName.endsWith('.pdf') ? finalName : `${finalName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
