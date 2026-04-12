import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../src/store/useEditorStore';

describe('isDirty', () => {
  beforeEach(() => useEditorStore.setState({ isDirty: false }));

  it('starts false', () => {
    expect(useEditorStore.getState().isDirty).toBe(false);
  });

  it('setDirty → true', () => {
    useEditorStore.getState().setDirty();
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('clearDirty → false', () => {
    useEditorStore.getState().setDirty();
    useEditorStore.getState().clearDirty();
    expect(useEditorStore.getState().isDirty).toBe(false);
  });
});