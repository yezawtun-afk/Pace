import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Space } from '@/constants/theme';

import { ProofThumbnail } from './proof-thumbnail';
import { ProofViewer } from './proof-viewer';
import { useProofUrl } from '../queries';

/**
 * A row of proof photos for one day, shown in the journal and the evening
 * review. Each thumbnail is tappable; the viewer opens the one you tapped.
 */
export function ProofStrip({ paths, label = 'Photos' }: { paths: string[]; label?: string }) {
  const [openPath, setOpenPath] = useState<string | null>(null);
  const openUrl = useProofUrl(openPath).data ?? null;

  if (paths.length === 0) return null;

  return (
    <View style={{ gap: Space.sm }}>
      <AppText variant="overline" tone="tertiary">
        {label}
      </AppText>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
        {paths.map((path) => (
          <ProofStripItem key={path} path={path} onPress={() => setOpenPath(path)} />
        ))}
      </View>

      {openPath ? <ProofViewer visible uri={openUrl} onClose={() => setOpenPath(null)} /> : null}
    </View>
  );
}

/** One thumbnail; keeps its own hook so the strip itself stays a plain list. */
function ProofStripItem({ path, onPress }: { path: string; onPress: () => void }) {
  const url = useProofUrl(path).data ?? null;

  return <ProofThumbnail uri={url} size={56} onPress={onPress} />;
}
