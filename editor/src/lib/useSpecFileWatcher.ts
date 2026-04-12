import { useEffect, useRef } from 'react';
import { watch } from '@tauri-apps/plugin-fs';
import { ask } from '@tauri-apps/plugin-dialog';
import { useEditorStore } from '@/store/useEditorStore';

export function useSpecFileWatcher() {
  const currentPath = useEditorStore((state) => state.currentPath);
  const unwatchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (unwatchRef.current) {
      unwatchRef.current();
      unwatchRef.current = null;
    }

    if (!currentPath) {
      return;
    }

    let debounce: number | null = null;
    let disposed = false;
    let justSaved = false;

    const onSaved = () => {
      justSaved = true;
      window.setTimeout(() => {
        justSaved = false;
      }, 600);
    };

    window.addEventListener('textforge:file-saved', onSaved);

    void watch(currentPath, async () => {
      if (justSaved || disposed) {
        return;
      }

      if (debounce) {
        window.clearTimeout(debounce);
      }

      debounce = window.setTimeout(async () => {
        if (disposed) {
          return;
        }

        if (!useEditorStore.getState().isDirty) {
          await useEditorStore.getState().reloadFile();
          return;
        }

        if (
          await ask('The spec file was changed externally. Reload and lose unsaved changes?', {
            title: 'File changed on disk',
            kind: 'warning',
          })
        ) {
          await useEditorStore.getState().reloadFile();
        }
      }, 400);
    }).then((unwatch) => {
      if (disposed) {
        unwatch();
        return;
      }

      unwatchRef.current = unwatch;
    });

    return () => {
      disposed = true;
      window.removeEventListener('textforge:file-saved', onSaved);
      if (debounce) {
        window.clearTimeout(debounce);
      }
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
      }
    };
  }, [currentPath]);
}