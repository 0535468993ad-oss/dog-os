import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Native (iOS/Android) exports. The web implementation is exportFiles.web.ts.

/** Renders the HTML to a PDF and opens the share sheet (email, WhatsApp, save to files…). */
export async function exportReportPdf(html: string, title: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
}

/** Writes JSON to a cache file and opens the share sheet. */
export async function exportJsonFile(json: string, fileName: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: fileName });
}
