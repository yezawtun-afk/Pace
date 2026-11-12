import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export const PROOF_BUCKET = 'proofs';
export const MAX_PROOF_BYTES = 2 * 1024 * 1024; // 2 MB after compression
export const MAX_PROOF_DIMENSION = 1080;

export type PickedProof = {
  /** Local uri of the compressed JPEG. */
  uri: string;
  width: number;
  height: number;
  size: number;
};

/**
 * Opens the camera or gallery, depending on `source`. Returns null when the
 * user cancels.
 */
export async function pickProofImage(
  source: 'camera' | 'gallery',
): Promise<ImagePicker.ImagePickerResult> {
  if (source === 'camera') {
    return ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });
  }

  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    allowsEditing: false,
  });
}

/**
 * Resizes to MAX_PROOF_DIMENSION on the long side and re-encodes as JPEG.
 * Re-encoding drops EXIF (including GPS) because the new file is written from
 * raw pixels.
 */
export async function compressProof(uri: string): Promise<PickedProof> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_PROOF_DIMENSION } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );

  const info = await FileSystem.getInfoAsync(result.uri);
  const size = info.exists && !info.isDirectory ? (info.size ?? 0) : 0;

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    size,
  };
}

export async function uploadProof(path: string, localUri: string): Promise<void> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (error) throw error;
}

export async function getProofSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function deleteProof(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PROOF_BUCKET).remove([path]);
  if (error) throw error;
}

/** Delete every proof object under a user's folder (used on account deletion). */
export async function deleteAllProofsForUser(userId: string): Promise<void> {
  const { data, error } = await supabase.storage.from(PROOF_BUCKET).list(userId, { limit: 1000 });
  if (error || !data) return;

  // Recurse one level (month folders).
  const paths: string[] = [];
  for (const entry of data) {
    if (entry.id === null) {
      // folder
      const { data: inner } = await supabase.storage
        .from(PROOF_BUCKET)
        .list(`${userId}/${entry.name}`, { limit: 1000 });
      for (const file of inner ?? []) {
        paths.push(`${userId}/${entry.name}/${file.name}`);
      }
    } else {
      paths.push(`${userId}/${entry.name}`);
    }
  }

  if (paths.length > 0) {
    await supabase.storage.from(PROOF_BUCKET).remove(paths);
  }
}
