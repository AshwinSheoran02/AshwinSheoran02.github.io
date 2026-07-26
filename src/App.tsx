import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { AnimatePresence, motion, useInView, useScroll } from "motion/react";
import {
  CodingVisual,
  CricketVisual,
  GamingVisual,
  HandArrow,
  MarketsVisual,
  PhotographyVisual,
  Stamp,
  TechnicalGrid,
} from "./components/EditorialVisuals";
import {
  CricketScorecard,
  ScrollProgress,
  StickyNavigation,
} from "./components/ExperienceChrome";
import { SectionHeading } from "./components/SectionHeading";
import {
  profile,
  type InterestTab,
  type SideQuest,
} from "./data/profile";
import { useActiveSection } from "./hooks/useActiveSection";
import { useKeySequence } from "./hooks/useKeySequence";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useSaveData } from "./hooks/useSaveData";
import { publicAsset } from "./lib/publicAsset";

const observedSections = profile.navigation.map((item) => item.target);

interface HeroViewportProps {
  readonly inView: boolean;
  readonly media: ReactNode;
}

function HeroViewport({ inView, media }: HeroViewportProps) {
  return (
    <div
      className="hero section-shell"
      data-in-view={inView ? "true" : "false"}
      style={
        {
          "--hero-media-opacity": profile.hero.video.opacity,
        } as CSSProperties
      }
    >
      <div className="hero-media" aria-hidden="true">
        {media}
        <div className="hero-media__scrim" />
      </div>

      <div className="hero-topline">
        <span>00 / BOOT SEQUENCE</span>
        <span>ASHWIN_OS v.2026.07</span>
      </div>

      <div className="hero-layout page-grid">
        <div className="hero-title-panel">
          <p className="hero-eyebrow">10 ACTIVE PROCESSES / 0 IDLE</p>
          <h1 id="hero-title">
            {profile.hero.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <div className="hero-secondary">
            {profile.hero.secondaryRoles.slice(2).map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
        </div>

        <div className="hero-profile-panel">
          <p className="hero-name">{profile.hero.name}</p>
          <div className="hero-roles">
            {profile.hero.primaryRoles.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
          <div className="hero-metadata">
            {profile.hero.metadata.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <a
            className="brutal-button brutal-button--acid"
            href={`#${profile.hero.cta.target}`}
          >
            {profile.hero.cta.displayLabel}
            <ArrowDown aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="hero-system-status">
        {profile.hero.systemStatus.map((status) => (
          <span key={status}>{status}</span>
        ))}
      </div>

      <div className="status-strip">
        <p className="sr-only">{profile.hero.statusStrip.join(". ")}</p>
        <div className="status-strip__track" aria-hidden="true">
          {[...profile.hero.statusStrip, ...profile.hero.statusStrip].map(
            (status, index) => (
              <span key={`${status}-${index}`}>
                {status}
                <i>✳</i>
              </span>
            ),
          )}
        </div>
      </div>

      <a className="scroll-cue" href="#about" aria-label="Scroll to the main plot">
        <span>SCROLL TO UNPACK</span>
        <i aria-hidden="true" />
      </a>
    </div>
  );
}

interface StaticHeroProps {
  readonly poster: string;
}

function StaticHero({ poster }: StaticHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const inView = useInView(containerRef, { amount: 0.01 });

  return (
    <header
      ref={containerRef}
      id="hero"
      className="hero-scroll-container hero-scroll-container--static"
      aria-labelledby="hero-title"
    >
      <HeroViewport
        inView={inView}
        media={<img src={poster} alt="" className="hero-media__asset" />}
      />
    </header>
  );
}

interface ScrubbedHeroProps {
  readonly onMediaFailure: () => void;
  readonly poster: string;
  readonly videoSource: string;
}

function ScrubbedHero({
  onMediaFailure,
  poster,
  videoSource,
}: ScrubbedHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef(0);
  const latestProgressRef = useRef(0);
  const targetTimeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const inView = useInView(containerRef, { amount: 0.01 });
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let disposed = false;

    const scheduleSeek = (rawProgress: number) => {
      const progress = Math.min(1, Math.max(0, rawProgress));
      latestProgressRef.current = progress;

      const duration = durationRef.current;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const lastFrameTime = Math.max(0, duration - 1 / 24);
      targetTimeRef.current =
        progress >= 1 ? lastFrameTime : progress * duration;

      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (disposed) return;

        const targetTime = targetTimeRef.current;
        if (Math.abs(video.currentTime - targetTime) < 1 / 48) return;

        try {
          video.currentTime = targetTime;
        } catch {
          onMediaFailure();
        }
      });
    };

    const syncMetadata = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          onMediaFailure();
        }
        return;
      }

      durationRef.current = duration;
      video.pause();
      scheduleSeek(scrollYProgress.get());
    };

    const handleError = () => onMediaFailure();

    video.pause();
    video.addEventListener("loadedmetadata", syncMetadata);
    video.addEventListener("durationchange", syncMetadata);
    video.addEventListener("error", handleError);
    const unsubscribe = scrollYProgress.on("change", scheduleSeek);

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      syncMetadata();
    }

    return () => {
      disposed = true;
      unsubscribe();
      video.removeEventListener("loadedmetadata", syncMetadata);
      video.removeEventListener("durationchange", syncMetadata);
      video.removeEventListener("error", handleError);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [onMediaFailure, scrollYProgress]);

  return (
    <header
      ref={containerRef}
      id="hero"
      className="hero-scroll-container"
      aria-labelledby="hero-title"
    >
      <HeroViewport
        inView={inView}
        media={
          <video
            ref={videoRef}
            className="hero-media__asset"
            muted
            playsInline
            poster={poster}
            preload="auto"
            disablePictureInPicture
            onError={onMediaFailure}
          >
            <source src={videoSource} type="video/mp4" />
          </video>
        }
      />
    </header>
  );
}

function Hero({ reducedMotion }: { reducedMotion: boolean }) {
  const narrowLayout = useMediaQuery("(max-width: 900px)");
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const saveData = useSaveData();
  const [mediaFailed, setMediaFailed] = useState(false);
  const handleMediaFailure = useCallback(() => setMediaFailed(true), []);
  const poster = publicAsset(profile.hero.video.poster);
  const videoSource = publicAsset(profile.hero.video.src);
  const scrubEnabled =
    !reducedMotion &&
    !narrowLayout &&
    finePointer &&
    !saveData &&
    !mediaFailed;

  return scrubEnabled ? (
    <ScrubbedHero
      onMediaFailure={handleMediaFailure}
      poster={poster}
      videoSource={videoSource}
    />
  ) : (
    <StaticHero poster={poster} />
  );
}

function AboutSection() {
  return (
    <section
      id="about"
      className="section-shell about-section"
      aria-labelledby="about-heading"
    >
      <SectionHeading
        label={profile.about.sectionLabel}
        headline={profile.about.headline}
        id="about-heading"
      />

      <div className="about-intro page-grid">
        <div className="about-intro__marker" aria-hidden="true">
          <span>THE</span>
          <strong>PLOT</strong>
          <HandArrow direction="right" />
        </div>
        <blockquote>
          {profile.about.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </blockquote>
      </div>

      <ol className="timeline">
        {profile.about.timeline.map((entry, index) => (
          <li key={entry.period}>
            <div className="timeline__date">
              <span>{entry.period}</span>
              <small>{String(index + 1).padStart(2, "0")}</small>
            </div>
            <div className="timeline__content">
              <h3>{entry.title}</h3>
              {entry.subtitle ? <strong>{entry.subtitle}</strong> : null}
              <p>{entry.detail}</p>
            </div>
            <Stamp
              className="timeline__stamp"
              label={index === 4 ? "INSTALLING" : "SHIPPED"}
              sublabel={entry.period}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

function InterestArtwork({ id }: { id: InterestTab["id"] }) {
  switch (id) {
    case "cricket":
      return <CricketVisual className="interest-artwork" />;
    case "markets":
      return <MarketsVisual className="interest-artwork" />;
    case "gaming":
      return <GamingVisual className="interest-artwork" />;
    case "vibe-coding":
      return <CodingVisual className="interest-artwork" />;
    case "photography":
      return <PhotographyVisual className="interest-artwork" />;
  }
}

function InterestsSection() {
  const tabs = profile.interests.tabs;
  const [activeId, setActiveId] = useState<InterestTab["id"]>(tabs[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  const selectTab = (index: number) => {
    const wrappedIndex = (index + tabs.length) % tabs.length;
    setActiveId(tabs[wrappedIndex].id);
    tabRefs.current[wrappedIndex]?.focus();
    tabRefs.current[wrappedIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const handleTabKey = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectTab(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab(tabs.length - 1);
    }
  };

  return (
    <section
      id="interests"
      className="section-shell interests-section"
      aria-labelledby="interests-heading"
    >
      <SectionHeading
        label={profile.interests.sectionLabel}
        headline={profile.interests.headline}
        id="interests-heading"
      />

      <div className="browser-frame">
        <div className="browser-chrome" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>ashwin://open-tabs</span>
          <b>×</b>
        </div>
        <div className="interest-tablist" role="tablist" aria-label="Open interests">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`interest-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeId === tab.id}
              aria-controls={`interest-panel-${tab.id}`}
              tabIndex={activeId === tab.id ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={(event) => handleTabKey(event, index)}
            >
              <span>{tab.tabNumber}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab.id}
            id={`interest-panel-${activeTab.id}`}
            className="interest-panel"
            role="tabpanel"
            aria-labelledby={`interest-tab-${activeTab.id}`}
            tabIndex={0}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="interest-copy">
              <p className="interest-path">
                TAB_{activeTab.tabNumber} / {activeTab.label}
              </p>
              <h3>{activeTab.label}</h3>
              {activeTab.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {activeTab.callout ? (
                <div className="interest-callout">
                  {activeTab.callout.map((line) => (
                    <strong key={line}>{line}</strong>
                  ))}
                </div>
              ) : null}
              {activeTab.note ? (
                <p className={`interest-note interest-note--${activeTab.noteKind}`}>
                  {activeTab.note}
                </p>
              ) : null}
            </div>
            <div className="interest-visual">
              <InterestArtwork id={activeTab.id} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function SideQuestPiece({ quest }: { quest: SideQuest }) {
  const commonCopy = (
    <div className="side-quest__copy">
      <p>{quest.subtitle}</p>
      <h3>{quest.title}</h3>
      <span>{quest.description}</span>
    </div>
  );

  switch (quest.format) {
    case "polaroid-contact-sheet":
      return (
        <article className="side-quest side-quest--polaroid">
          <div className="side-quest__frames" aria-hidden="true">
            <i>FRAME / 01</i>
            <i>FRAME / 02</i>
            <i>REAL PHOTO PENDING</i>
          </div>
          {commonCopy}
        </article>
      );
    case "achievement-stamp":
      return (
        <article className="side-quest side-quest--achievement">
          <Stamp label="RANKED 1ST" sublabel="THEN TA" shape="circle" />
          {commonCopy}
        </article>
      );
    case "sports-card":
      return (
        <article className="side-quest side-quest--sports">
          <div className="sports-score" aria-hidden="true">
            <span>FIXTURES</span>
            <strong>XI</strong>
            <span>OPERATIONS</span>
          </div>
          {commonCopy}
        </article>
      );
    case "research-abstract":
      return (
        <article className="side-quest side-quest--research">
          <header>RESEARCH ABSTRACT / 2024</header>
          {commonCopy}
          <footer>KEYWORDS: ICU / VITALS / PREDICTION</footer>
        </article>
      );
    case "terminal-log":
      return (
        <article className="side-quest side-quest--terminal">
          <pre aria-hidden="true">
            <code>{`> prototype --fast\nBUILDING...\nRESULT: SHIPPED_`}</code>
          </pre>
          {commonCopy}
        </article>
      );
    case "newspaper-clipping":
      return (
        <article className="side-quest side-quest--newspaper">
          <header>
            THE SIDE QUEST DAILY <span>COMMUNITY EDITION</span>
          </header>
          {commonCopy}
          <footer>80 HOURS / EDUCATION + WELFARE + SUPPORT</footer>
        </article>
      );
  }
}

function SideQuestsSection() {
  return (
    <section
      id="side-quests"
      className="section-shell side-quests-section"
      aria-labelledby="side-quests-heading"
    >
      <SectionHeading
        label={profile.sideQuests.sectionLabel}
        headline={profile.sideQuests.headline}
        id="side-quests-heading"
        align="right"
      />
      <div className="quest-ticket" aria-hidden="true">
        <span>ADMIT ONE</span>
        <strong>SIDE QUEST ACCESS</strong>
        <b>04</b>
      </div>
      <div className="side-quest-collage">
        {profile.sideQuests.entries.map((quest) => (
          <SideQuestPiece key={quest.id} quest={quest} />
        ))}
      </div>
    </section>
  );
}

function StrengthsSection() {
  return (
    <section
      id="strengths"
      className="section-shell strengths-section"
      aria-labelledby="strengths-heading"
    >
      <TechnicalGrid className="strengths-grid-art" />
      <div className="strengths-foreground">
        <SectionHeading
          label={profile.characterStats.sectionLabel}
          headline={profile.characterStats.headline}
          id="strengths-heading"
        />
        <div className="strength-list">
          {profile.characterStats.strengths.map((strength) => (
            <article className="strength-row" key={strength.id}>
              <span className="strength-number">{strength.number}</span>
              <div className="strength-copy">
                <h3>{strength.title}</h3>
                <p>{strength.description}</p>
              </div>
              <div
                className="strength-meter"
                role="progressbar"
                aria-label={strength.meterLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={strength.value}
                style={
                  {
                    "--meter-value": `${strength.value}%`,
                  } as CSSProperties
                }
              >
                <span>{strength.meterLabel}</span>
                <div aria-hidden="true">
                  <i />
                </div>
                <strong>{strength.value}</strong>
              </div>
            </article>
          ))}
        </div>
        <p className="audit-note">
          {profile.characterStats.note.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>
    </section>
  );
}

function BugControls() {
  const [message, setMessage] = useState("");
  const messages = [
    "BUG ACKNOWLEDGED. STILL REPRODUCIBLE.",
    "PATCH QUEUED. ETA: OPTIMISTIC.",
    "ETA REMOVED FROM ROADMAP.",
  ] as const;

  return (
    <div className="bug-controls">
      <div className="bug-controls__buttons">
        {profile.knownIssues.controls.map((control, index) => (
          <button
            key={control}
            type="button"
            className="brutal-button"
            onClick={() => setMessage(messages[index])}
          >
            [ {control} ]
          </button>
        ))}
      </div>
      <p className="bug-response" role="status" aria-live="polite">
        {message || "AWAITING USER INPUT_"}
      </p>
    </div>
  );
}

function BugsSection() {
  return (
    <section
      id="bugs"
      className="section-shell bugs-section"
      aria-labelledby="bugs-heading"
    >
      <SectionHeading
        label={profile.knownIssues.sectionLabel}
        headline={profile.knownIssues.headline}
        id="bugs-heading"
      />
      <div className="bug-list">
        {profile.knownIssues.bugs.map((bug) => (
          <article className="bug-report" key={bug.id}>
            <header>
              <span>BUG_{bug.number}</span>
              <strong>{bug.severity}</strong>
            </header>
            <h3>{bug.title}</h3>
            <div className="bug-report__body">
              <div>
                <span>DESCRIPTION</span>
                <p>{bug.description}</p>
              </div>
              <div>
                <span>CURRENT PATCH</span>
                <p>{bug.currentPatch}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <BugControls />
    </section>
  );
}

function BeautySection() {
  return (
    <section
      id="beauty"
      className="section-shell beauty-section"
      aria-labelledby="beauty-heading"
    >
      <SectionHeading
        label={profile.beauty.sectionLabel}
        headline={profile.beauty.headline}
        id="beauty-heading"
      />
      <blockquote>
        {profile.beauty.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </blockquote>
      <p className="beauty-annotation">
        <HandArrow direction="up" />
        {profile.beauty.annotation}
      </p>
    </section>
  );
}

function ProductPhilosophySection() {
  return (
    <section
      id="product-philosophy"
      className="section-shell product-philosophy-section"
      aria-labelledby="product-philosophy-heading"
    >
      <SectionHeading
        label={profile.productPhilosophy.sectionLabel}
        headline={profile.productPhilosophy.headline}
        id="product-philosophy-heading"
      />
      <div className="spec-sheet">
        <header>
          <span>OPERATING PRINCIPLE</span>
          <strong>{profile.productPhilosophy.brand}</strong>
          <b>SPEC / 08</b>
        </header>
        <div className="spec-sheet__body">
          <div className="spec-copy">
            {profile.productPhilosophy.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <dl>
            {profile.productPhilosophy.principles.map((principle, index) => (
              <div key={principle}>
                <dt>PRINCIPLE_{String(index + 1).padStart(2, "0")}</dt>
                <dd>{principle}</dd>
              </div>
            ))}
          </dl>
        </div>
        <footer tabIndex={0} aria-label="Product philosophy specification status">
          <span>SCIENCE-LED</span>
          <span>PRACTICAL</span>
          <span>USER-FACING OUTPUT: CLEAR</span>
        </footer>
      </div>
    </section>
  );
}

function RapidFireSection({ reducedMotion }: { reducedMotion: boolean }) {
  const [clicked, setClicked] = useState(false);

  return (
    <section
      id="rapid-fire"
      className="section-shell rapid-section"
      aria-labelledby="rapid-heading"
    >
      <SectionHeading
        label={profile.rapidFire.sectionLabel}
        id="rapid-heading"
      />
      <h2 id="rapid-heading" className="sr-only">
        Rapid-fire personal data
      </h2>
      <div className="fact-wall">
        {profile.rapidFire.facts.map((fact, index) => (
          <motion.article
            key={fact.label}
            className={`fact fact--${(index % 5) + 1}`}
            initial={reducedMotion ? false : { x: index % 2 ? 18 : -18 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35 }}
          >
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
          </motion.article>
        ))}
      </div>
      <div className="curiosity-test">
        <button
          type="button"
          className="brutal-button brutal-button--red"
          onClick={() => setClicked(true)}
        >
          [ {profile.interactions.doNotClick.label} ]
        </button>
        <AnimatePresence>
          {clicked ? (
            <motion.p
              role="status"
              initial={{ opacity: 0, rotate: -3, scale: 0.8 }}
              animate={{ opacity: 1, rotate: -1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {profile.interactions.doNotClick.response.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <footer
      id="closing"
      className="section-shell closing-section"
      aria-labelledby="closing-heading"
    >
      <div className="closing-marque" aria-hidden="true">
        10 / 10 / 10 / 10 / 10
      </div>
      <h2 id="closing-heading">
        {profile.closing.statement.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h2>
      <div className="closing-grid">
        <div className="closing-identity">
          {profile.closing.identity.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className="closing-actions">
          <a
            href={publicAsset(profile.contact.cvHref)}
            target="_blank"
            rel="noreferrer"
            className="brutal-button brutal-button--acid"
          >
            <FileText aria-hidden="true" />
            {profile.closing.actions.cv.displayLabel}
            <ArrowUpRight aria-hidden="true" />
          </a>
          <a
            href={profile.contact.linkedInHref}
            target="_blank"
            rel="noreferrer"
            className="brutal-button"
          >
            <span className="social-glyph" aria-hidden="true">
              in
            </span>
            {profile.closing.actions.linkedIn.displayLabel}
          </a>
        </div>
      </div>
      <div className="end-line">
        {profile.closing.systemLine.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </footer>
  );
}

export default function App() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const activeSection = useActiveSection(observedSections, "about");
  const [scorecardVisible, setScorecardVisible] = useState(false);
  const showScorecard = useCallback(() => setScorecardVisible(true), []);
  const hideScorecard = useCallback(() => setScorecardVisible(false), []);

  useKeySequence(
    profile.interactions.keyboardEasterEgg.sequence,
    showScorecard,
  );

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to profile content
      </a>
      <ScrollProgress />
      <CricketScorecard
        visible={scorecardVisible}
        onDismiss={hideScorecard}
      />

      <Hero reducedMotion={reducedMotion} />
      <StickyNavigation
        items={profile.navigation}
        activeSection={activeSection}
      />

      <main id="main-content">
        <AboutSection />
        <InterestsSection />
        <SideQuestsSection />
        <StrengthsSection />
        <BugsSection />
        <BeautySection />
        <ProductPhilosophySection />
        <RapidFireSection reducedMotion={reducedMotion} />
      </main>

      <ClosingSection />
    </>
  );
}
