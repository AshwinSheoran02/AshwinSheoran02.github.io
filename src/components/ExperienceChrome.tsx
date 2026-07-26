import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
} from "motion/react";
import type { NavigationItem } from "../data/profile";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="progress-shell" aria-hidden="true">
      <span>PROFILE LOADING</span>
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          style={{ scaleX: scrollYProgress }}
        />
      </div>
    </div>
  );
}

interface StickyNavigationProps {
  items: readonly NavigationItem[];
  activeSection: string;
}

export function StickyNavigation({
  items,
  activeSection,
}: StickyNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.target === activeSection),
  );
  const activeItem = items[activeIndex] ?? items[0];

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      toggleRef.current?.focus();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  return (
    <nav
      className="tab-navigation"
      aria-label="Profile sections"
      data-menu-open={mobileMenuOpen ? "true" : "false"}
    >
      <button
        ref={toggleRef}
        type="button"
        className="mobile-nav-toggle"
        aria-expanded={mobileMenuOpen}
        aria-controls="profile-section-links"
        aria-label={
          mobileMenuOpen ? "Close section menu" : "Open section menu"
        }
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        <span className="mobile-nav-current">
          <b aria-hidden="true">{String(activeIndex + 1).padStart(2, "0")}</b>
          {activeItem.label}
        </span>
        <span aria-hidden="true">{mobileMenuOpen ? "CLOSE ×" : "MENU +"}</span>
      </button>
      <div id="profile-section-links" className="tab-navigation__track">
        {items.map((item, index) => (
          <a
            key={item.target}
            href={`#${item.target}`}
            aria-current={activeSection === item.target ? "location" : undefined}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

interface CricketScorecardProps {
  visible: boolean;
  onDismiss: () => void;
}

export function CricketScorecard({
  visible,
  onDismiss,
}: CricketScorecardProps) {
  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(onDismiss, 3600);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, visible]);

  useEffect(() => {
    if (!visible) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onDismiss, visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          className="cricket-scorecard"
          role="status"
          aria-label="Cricket scorecard easter egg"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
        >
          <div className="scorecard-title">
            <span>CURIOUS XI</span>
            <button type="button" onClick={onDismiss} aria-label="Close scorecard">
              ×
            </button>
          </div>
          <strong>10 / 0</strong>
          <div className="scorecard-row">
            <span>TABS</span>
            <span>10*</span>
            <span>OFF 10</span>
          </div>
          <p>CURIOSITY CONFIRMED · NO REVIEW REQUIRED</p>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
