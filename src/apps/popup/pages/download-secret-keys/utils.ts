export function downloadFile(content: Blob, filename: string): void {
  // allocation
  const url = window.URL.createObjectURL(content);

  const downloadFileLink = document.createElement('a');
  downloadFileLink.href = url;
  downloadFileLink.setAttribute('download', filename);
  downloadFileLink.click();
  downloadFileLink.remove();

  // cleanup
  window.URL.revokeObjectURL(url);
}
