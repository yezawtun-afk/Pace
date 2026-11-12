import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Image, Platform } from 'react-native';

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
 * Asks for camera or photo-library permission, right before the picker opens.
 *
 * The web has no OS permission: the browser's own file dialog is the gate, so
 * this always returns true there. Native returns false when the person said no,
 * which the screen turns into one plain sentence plus a Settings link.
 */
export async function ensureProofPermission(source: 'camera' | 'gallery'): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const result =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  return result.granted;
}

/**
 * Opens the camera or the photo library. On the web both options use the
 * browser's file picker, because a page cannot open the camera app directly.
 * Returns null when the person cancels.
 */
export async function pickProofImage(
  source: 'camera' | 'gallery',
): Promise<ImagePicker.ImagePickerResult> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  };

  if (source === 'camera') {
    if (Platform.OS === 'web') return ImagePicker.launchImageLibraryAsync(options);
    return ImagePicker.launchCameraAsync(options);
  }

  return ImagePicker.launchImageLibraryAsync(options);
}

/**
 * Resizes to MAX_PROOF_DIMENSION on the long side (never upscaling) and writes a
 * new JPEG at quality 0.7.
 *
 * Metadata: the manipulator decodes the source to pixels and `saveAsync` writes
 * a brand-new file, so EXIF, GPS coordinates, device model and the original
 * filename are not carried into the upload. See TESTING.md for the one-minute
 * check with `exiftool` on a real device.
 */
export async function compressProof(uri: string): Promise<PickedProof> {
  const size = await getImageSize(uri);

  const context = ImageManipulator.manipulate(uri);
  if (size && Math.max(size.width, size.height) > MAX_PROOF_DIMENSION) {
    if (size.width >= size.height) {
      context.resize({ width: MAX_PROOF_DIMENSION });
    } else {
      context.resize({ height: MAX_PROOF_DIMENSION });
    }
  }

  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: 0.7,
    format: SaveFormat.JPEG,
  });

  const info = await FileSystem.getInfoAsync(result.uri);
  const bytes = info.exists && !info.isDirectory ? (info.size ?? 0) : 0;

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    size: bytes,
  };
}

/** Reads the source dimensions; null when the platform cannot report them. */
async function getImageSize(uri: string): Promise<{ width: number; height: number } | null> {
  try {
    return await new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error),
      );
    });
  } catch {
    return null;
  }
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

/**
 * Signed URLs last an hour but we cache them for 55 minutes, so scrolling a
 * journal entry does not ask the server for the same photo again.
 */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export async function getProofSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) return null;

  signedUrlCache.set(path, {
    url: data.signedUrl,
    // Refresh five minutes before the link actually expires.
    expiresAt: Date.now() + Math.max(expiresInSeconds - 300, 60) * 1000,
  });

  return data.signedUrl;
}

export async function deleteProof(path: string): Promise<void> {
  signedUrlCache.delete(path);
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

  signedUrlCache.clear();
}
