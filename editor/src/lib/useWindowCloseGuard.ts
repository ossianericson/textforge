import { useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ask } from '@tauri-apps/plugin-dialog';
import { useEditorStore } from '@/store/useEditorStore';

export function useWindowCloseGuard() {
  const allowCloseRef = useRef(false);

  useEffect(() => {
    const win = getCurrentWindow();
    let listenerRemoved = false;

    const removeInterceptor = async () => {
      if (listenerRemoved) {
        return;
      }
      listenerRemoved = true;
      const unlisten = await listenerPromise;
      unlisten();
    };

    const exitWindow = async () => {
      allowCloseRef.current = true;
      await removeInterceptor();
      await win.destroy().catch(async () => {
        await win.close().catch(() => {});
      });
    };

    const listenerPromise = win.onCloseRequested(async (event) => {
      if (allowCloseRef.current) {
        return;
      }

      event.preventDefault();
      useEditorStore.getState().flushPendingEditorChanges();

      if (!useEditorStore.getState().isDirty) {
        await exitWindow();
        return;
      }

      if (
        await ask('You have unsaved changes. Close without saving?', {
          title: 'Unsaved changes',
          kind: 'warning',
        })
      ) {
        await exitWindow();
      }
    });

    return () => {
      void removeInterceptor();
    };
  }, []);
}