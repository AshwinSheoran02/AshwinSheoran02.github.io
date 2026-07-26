import { useEffect, useRef } from "react";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function useKeySequence(
  sequence: string,
  onMatch: () => void,
  enabled = true,
) {
  const callbackRef = useRef(onMatch);
  const bufferRef = useRef("");

  useEffect(() => {
    callbackRef.current = onMatch;
  }, [onMatch]);

  useEffect(() => {
    if (!enabled) return;

    const targetSequence = sequence.toUpperCase();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.length !== 1 ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      bufferRef.current = `${bufferRef.current}${event.key.toUpperCase()}`.slice(
        -targetSequence.length,
      );

      if (bufferRef.current === targetSequence) {
        bufferRef.current = "";
        callbackRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, sequence]);
}
