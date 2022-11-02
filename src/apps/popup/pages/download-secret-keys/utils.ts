export function downloadFile(content: Blob, filename: string): void {
  const url = window.URL.createObjectURL(content);
  const downloadFileLink = document.createElement('a');

  downloadFileLink.href = url;
  downloadFileLink.setAttribute('download', filename);
  downloadFileLink.click();
  downloadFileLink.remove();
}
