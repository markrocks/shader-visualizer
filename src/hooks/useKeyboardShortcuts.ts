import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;

interface ShortcutMap {
  [key: string]: ShortcutHandler;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      
      // Build shortcut key string
      const modifiers = [];
      if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
      if (event.shiftKey) modifiers.push('shift');
      if (event.altKey) modifiers.push('alt');
      
      const shortcutKey = modifiers.length > 0 
        ? [...modifiers, key].join('+')
        : key;
      
      // Only trigger if we have an exact match
      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        event.stopPropagation();
        shortcuts[shortcutKey]();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);
}

export function useEscapeKey(handler: () => void) {
  useKeyboardShortcuts({
    escape: handler,
  });
}
