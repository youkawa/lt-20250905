import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saved = useRef(fn);
  useEffect(() => {
    saved.current = fn;
  }, [fn]);
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saved.current(...args), delayMs);
  }, [delayMs]);
}

export function useAutoSave<T>(initial: T, onSave: (value: T) => Promise<void>) {
  const [value, _setValue] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounced = useDebouncedCallback(async (val: T) => {
    setSaving(true);
    setError(null);
    try {
      await onSave(val);
      setSavedAt(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }, 600);

  const setValue = useCallback(
    (next: T) => {
      _setValue(() => {
        debounced(next);
        return next;
      });
    },
    [debounced],
  );

  const update = useCallback(
    (updater: (prev: T) => T) => {
      _setValue((prev) => {
        const next = updater(prev);
        debounced(next);
        return next;
      });
    },
    [debounced],
  );

  return { value, setValue, update, saving, savedAt, error } as const;
}
