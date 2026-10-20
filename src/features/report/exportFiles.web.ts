// Web exports: expo-print can't print arbitrary HTML on web, so the report opens in its own window and
// the browser's print dialog offers "Save as PDF". Data exports download through a Blob link.

export async function exportReportPdf(html: string, _title: string): Promise<void> {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('popup_blocked');
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  // Let fonts and layout settle before printing; whichever fires first wins, the other is a no-op.
  let printed = false;
  const printOnce = () => {
    if (printed) return;
    printed = true;
    popup.print();
  };
  popup.addEventListener('load', printOnce);
  setTimeout(printOnce, 500);
}

export async function exportJsonFile(json: string, fileName: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
