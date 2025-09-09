import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAutoSave } from './hooks';

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves after debounce and sets savedAt', async () => {
    const onSave = vi.fn(async () => {});
    const { result } = renderHook(() => useAutoSave<string>('', onSave));
    act(() => {
      result.current.setValue('hello');
    });
    // advance debounce 600ms
    await act(async () => {
      vi.advanceTimersByTime(650);
    });
    expect(onSave).toHaveBeenCalledWith('hello');
    expect(result.current.saving).toBe(false);
    expect(result.current.savedAt).toBeInstanceOf(Date);
    expect(result.current.error).toBeNull();
  });

  it('captures error from onSave', async () => {
    const onSave = vi.fn(async () => {
      throw new Error('boom');
    });
    const { result } = renderHook(() => useAutoSave<string>('', onSave));
    act(() => {
      result.current.setValue('x');
    });
    await act(async () => {
      vi.advanceTimersByTime(650);
    });
    expect(onSave).toHaveBeenCalled();
    expect(result.current.error).toMatch(/boom|保存に失敗/);
  });
});

