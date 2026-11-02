import { useEffect } from "react";
import { interactions } from "../data/profile";

/** Typing CRICKET anywhere on the page brings this up. */
export function Scorecard({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(onDismiss, 4200);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, onDismiss]);

  if (!visible) return null;
  return (
    <aside className="scorecard" role="status" aria-label={interactions.keyboardEasterEgg.accessibleLabel} data-ui>
      <div className="scorecard__title">
        <span>Curious XI</span>
        <button type="button" onClick={onDismiss} aria-label="Close scorecard">
          ×
        </button>
      </div>
      <strong>10 / 0</strong>
      <div className="scorecard__row">
        <span>Tabs</span>
        <span>10*</span>
        <span>Off 10</span>
      </div>
      <p>Curiosity confirmed · No review required</p>
    </aside>
  );
}
