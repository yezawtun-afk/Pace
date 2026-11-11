import { Platform } from 'react-native';

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

/**
 * Saves `content` to a file and either downloads it (web) or opens the share
 * sheet (mobile). Returns the file name that was used.
 */
export async function saveAndShareFile(
  fileName: string,
  content: string,
  mimeType: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return fileName;
  }

  const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!base) throw new Error('No writable directory available.');

  const uri = `${base}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: fileName });
  }

  return fileName;
}
