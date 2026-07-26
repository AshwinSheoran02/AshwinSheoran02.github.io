export type SectionId =
  | "hero"
  | "about"
  | "interests"
  | "side-quests"
  | "strengths"
  | "bugs"
  | "beauty"
  | "product-philosophy"
  | "rapid-fire"
  | "closing";

export type NavigableSectionId =
  | "about"
  | "interests"
  | "side-quests"
  | "strengths"
  | "bugs"
  | "product-philosophy";

export interface NavigationItem {
  readonly label: string;
  readonly target: NavigableSectionId;
}

export interface TimelineEntry {
  readonly period: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly detail: string;
}

export interface InterestTab {
  readonly id: "cricket" | "markets" | "gaming" | "vibe-coding" | "photography";
  readonly tabNumber: `0${1 | 2 | 3 | 4 | 5}`;
  readonly label: string;
  readonly body: readonly string[];
  readonly visualElements: readonly string[];
  readonly diagramLabels?: readonly string[];
  readonly callout?: readonly string[];
  readonly note?: string;
  readonly noteKind?: "line" | "disclaimer";
}

export type SideQuestFormat =
  | "polaroid-contact-sheet"
  | "achievement-stamp"
  | "sports-card"
  | "research-abstract"
  | "terminal-log"
  | "newspaper-clipping";

export interface SideQuest {
  readonly id:
    | "atom"
    | "game-design"
    | "sports-council"
    | "ai-healthcare"
    | "hackathons"
    | "volunteering";
  readonly title: string;
  readonly subtitle?: string;
  readonly description: string;
  readonly format: SideQuestFormat;
}

export interface Strength {
  readonly id: "ambiguity" | "learning" | "persistence" | "translation";
  readonly number: `0${1 | 2 | 3 | 4}`;
  readonly title: string;
  readonly description: string;
  readonly meterLabel: string;
  readonly value: number;
}

export type BugSeverity =
  | "HIGH DURING MBA"
  | "RECURRING"
  | "LOW AFTER FIRST 10 MINUTES";

export interface BugReport {
  readonly id: "open-tabs" | "over-polishing" | "quiet-load";
  readonly number: `0${1 | 2 | 3}`;
  readonly title: string;
  readonly description: string;
  readonly currentPatch: string;
  readonly severity: BugSeverity;
}

export interface RapidFact {
  readonly label: string;
  readonly value: string;
}

export interface ProfileContact {
  readonly linkedInHref: string;
  readonly cvHref: string;
}

export const navigation = [
  { label: "MAIN PLOT", target: "about" },
  { label: "OPEN TABS", target: "interests" },
  { label: "SIDE QUESTS", target: "side-quests" },
  { label: "STATS", target: "strengths" },
  { label: "BUGS", target: "bugs" },
  { label: "PRODUCT DNA", target: "product-philosophy" },
] as const satisfies readonly NavigationItem[];

export const hero = {
  id: "hero",
  sectionNumber: "00",
  title: ["10", "TABS", "OPEN."],
  name: "ASHWIN SHEORAN",
  primaryRoles: [
    "EX-SOFTWARE ENGINEER.",
    "CURRENT MBA STUDENT.",
    "CRICKET OBSESSIVE.",
    "OCCASIONAL OVERTHINKER.",
  ],
  secondaryRoles: [
    "EX-SOFTWARE ENGINEER.",
    "CURRENT MBA STUDENT.",
    "PROFESSIONALLY CURIOUS.",
    "CHRONICALLY OVERCOMMITTED.",
  ],
  metadata: [
    "B.TECH CSAM / IIIT DELHI",
    "FORMER ASSOCIATE / NAB",
    "BUSINESS MANAGEMENT / XLRI DELHI-NCR",
    "CURRENTLY EXPLORING / PRODUCT × MEDIA × MANAGEMENT",
  ],
  systemStatus: [
    "22 MONTHS IN PRODUCTION",
    "MANAGEMENT PATCH CURRENTLY INSTALLING",
    "LOCATION: XLRI DELHI-NCR",
    "STATUS: STILL SHIPPING",
  ],
  cta: {
    label: "ENTER THE BRAIN DUMP",
    displayLabel: "[ ENTER THE BRAIN DUMP ]",
    target: "about",
  },
  statusStrip: [
    "SYSTEM ONLINE",
    "10 TABS ACTIVE",
    "4 DEADLINES APPROACHING",
    "1 COFFEE REQUIRED",
    "0 GRAND PERSONAL MANIFESTOS",
  ],
  video: {
    src: "hero-scroll.mp4",
    poster: "hero-poster.webp",
    opacity: 1,
  },
} as const;

export const about = {
  id: "about",
  sectionLabel: "01 / THE MAIN PLOT",
  headline: [
    "I STARTED WITH CODE.",
    "THEN I GOT CURIOUS ABOUT EVERYTHING AROUND IT.",
  ],
  body: [
    "I studied Computer Science and Applied Mathematics at IIIT Delhi, spent a summer analysing IPL-scale digital journeys at Jio, and then spent 22 months building banking and investment products at NAB.",
    "Eventually, I realised that I was as interested in why something should be built, who would use it and how it would create value as I was in writing the code itself.",
    "That curiosity brought me to XLRI Delhi.",
    "The plan now is not to abandon technology. It is to understand the product, business and people around it better.",
  ],
  timeline: [
    {
      period: "2020",
      title: "FINISHED SCHOOL",
      subtitle: "94.6% IN CLASS XII",
      detail: "Still had no idea what a sprint retrospective was.",
    },
    {
      period: "2020–2024",
      title: "IIIT DELHI",
      subtitle: "B.Tech in Computer Science and Applied Mathematics",
      detail:
        "Learned algorithms, mathematics, game design and the art of surviving group projects.",
    },
    {
      period: "2023",
      title: "JIO",
      detail:
        "Analysed large-scale IPL performance and payment data. Discovered that even a simple recharge journey has more ways to fail than expected.",
    },
    {
      period: "2024–2026",
      title: "NAB",
      detail:
        "Built customer-facing banking, investment and onboarding journeys. Worked across India, Australia and Vietnam.",
    },
    {
      period: "2026–NOW",
      title: "XLRI DELHI-NCR",
      subtitle: "Business Management",
      detail:
        "Learning why “technically possible” is not the same as “commercially sensible.”",
    },
  ] satisfies readonly TimelineEntry[],
} as const;

export const interests = {
  id: "interests",
  sectionLabel: "02 / OPEN TABS",
  headline: [
    "I DO NOT HAVE ONE PASSION.",
    "I HAVE A RESOURCE-ALLOCATION PROBLEM.",
  ],
  tabs: [
    {
      id: "cricket",
      tabNumber: "01",
      label: "CRICKET",
      body: [
        "I enjoy cricket for the same reason I enjoy products and markets: the visible result is only the surface.",
        "Field placements, match-ups, momentum, risk, patience and decision-making are constantly interacting underneath the score.",
      ],
      visualElements: [
        "Hand-drawn cricket field",
        "Scorecard fragments",
        "Wagon-wheel-style lines",
      ],
      diagramLabels: ["RISK", "TIMING", "CONTEXT", "MOMENTUM"],
      note: "I WILL ABSOLUTELY EXPLAIN WHY A TEST MATCH DRAW CAN BE INTERESTING.",
      noteKind: "line",
    },
    {
      id: "markets",
      tabNumber: "02",
      label: "MARKETS",
      body: [
        "I enjoy understanding businesses, price behaviour and the gap between perception and value.",
        "The interesting part is not watching a number move. It is figuring out what everyone else thinks that number means.",
      ],
      visualElements: [
        "Abstract candlestick chart",
        "Newspaper snippets",
        "Watchlist interface",
        "Bull and bear labels used sparingly",
      ],
      note: "EQUITY MARKETS. NO F&O HEROICS.",
      noteKind: "disclaimer",
    },
    {
      id: "gaming",
      tabNumber: "03",
      label: "GAMING",
      body: [
        "Games are systems made visible.",
        "Rules, incentives, feedback loops and difficulty curves combine to produce behaviour. That is why studying game design made me think differently about products.",
      ],
      callout: [
        "RANKED 1ST IN GAME DESIGN AND DEVELOPMENT",
        "LATER SELECTED AS TEACHING ASSISTANT",
      ],
      visualElements: [
        "Pixel-art cursor",
        "Progress bar",
        "Mission-complete stamp",
        "Simple game HUD",
      ],
    },
    {
      id: "vibe-coding",
      tabNumber: "04",
      label: "VIBE CODING",
      body: [
        "I like the point where an idea stops being a sentence and becomes something people can click.",
        "AI-assisted development has made prototyping faster, but the difficult part remains the same: deciding what deserves to be built.",
      ],
      visualElements: [
        "Code fragments",
        "Cursor movement",
        "Component boxes",
        "Deploy button",
        "Error corrected into success",
      ],
      note: "BUILD FIRST. OVERTHINK IMMEDIATELY AFTER.",
      noteKind: "line",
    },
    {
      id: "photography",
      tabNumber: "05",
      label: "PHOTOGRAPHY",
      body: [
        "I joined ATOM at XLRI without pretending to be an experienced photographer.",
        "That is exactly why it interested me.",
        "Technology taught me to build systems. Photography is teaching me to notice moments.",
      ],
      visualElements: [
        "Contact sheet",
        "Crop marks",
        "Camera metadata",
        "Blank frames where real photographs can later be inserted",
      ],
    },
  ] satisfies readonly InterestTab[],
} as const;

export const sideQuests = {
  id: "side-quests",
  sectionLabel: "03 / UNRELATED, BUT NOT REALLY",
  headline: "THE SIDE QUESTS USUALLY EXPLAIN THE MAIN CHARACTER BETTER.",
  entries: [
    {
      id: "atom",
      title: "ATOM, XLRI DELHI",
      subtitle: "Junior Executive Member",
      description: "Media, photography, social platforms and event coverage.",
      format: "polaroid-contact-sheet",
    },
    {
      id: "game-design",
      title: "GAME DESIGN, IIIT DELHI",
      description:
        "Ranked first in the course. Later conducted labs and mentored student teams as Teaching Assistant.",
      format: "achievement-stamp",
    },
    {
      id: "sports-council",
      title: "SPORTS COUNCIL, IIIT DELHI",
      description:
        "Supported cricket operations, fixtures, participating teams and fantasy-cricket competitions.",
      format: "sports-card",
    },
    {
      id: "ai-healthcare",
      title: "AI IN HEALTHCARE",
      description:
        "Worked on shock-risk prediction using ICU vital-sign data across thousands of ICU stays.",
      format: "research-abstract",
    },
    {
      id: "hackathons",
      title: "HACKATHONS",
      description:
        "Built rapid prototypes across AI, web, Android, games and product challenges.",
      format: "terminal-log",
    },
    {
      id: "volunteering",
      title: "VOLUNTEERING",
      description:
        "Completed 80 hours across education, welfare, animal support and plantation work.",
      format: "newspaper-clipping",
    },
  ] satisfies readonly SideQuest[],
} as const;

export const characterStats = {
  id: "strengths",
  sectionLabel: "04 / CHARACTER BUILD",
  headline: [
    "SOME SKILLS WERE INSTALLED.",
    "OTHERS WERE LEARNED THE HARD WAY.",
  ],
  strengths: [
    {
      id: "ambiguity",
      number: "01",
      title: "TURNING AMBIGUITY INTO ACTION",
      description:
        "I am comfortable taking a vaguely defined problem, identifying its moving parts and converting it into something executable.",
      meterLabel: "Ambiguity to action",
      value: 91,
    },
    {
      id: "learning",
      number: "02",
      title: "LEARNING THROUGH BUILDING",
      description:
        "I understand unfamiliar tools fastest when I have a real output to create.",
      meterLabel: "Learning velocity",
      value: 88,
    },
    {
      id: "persistence",
      number: "03",
      title: "STAYING WITH DIFFICULT PROBLEMS",
      description:
        "I do not lose interest simply because the first version fails.",
      meterLabel: "Persistence",
      value: 93,
    },
    {
      id: "translation",
      number: "04",
      title: "CONNECTING TECHNICAL AND NON-TECHNICAL CONTEXT",
      description:
        "Working with engineers, product owners, architects, analysts, designers and business stakeholders taught me that good work often depends on translation.",
      meterLabel: "Cross-functional translation",
      value: 84,
    },
  ] satisfies readonly Strength[],
  note: ["NUMBERS ARE ENTIRELY SELF-REPORTED.", "AUDIT PENDING."],
} as const;

export const knownIssues = {
  id: "bugs",
  sectionLabel: "05 / BUG REPORT",
  headline: ["THE CURRENT VERSION IS STABLE.", "NOT BUG-FREE."],
  bugs: [
    {
      id: "open-tabs",
      number: "01",
      title: "TOO MANY OPEN TABS",
      description:
        "I am easily interested in new projects and can take on more work than the calendar supports.",
      currentPatch:
        "Choosing based on impact and ownership instead of treating every interesting opportunity as mandatory.",
      severity: "HIGH DURING MBA",
    },
    {
      id: "over-polishing",
      number: "02",
      title: "OVER-POLISHING",
      description:
        "I can spend disproportionate time improving the final 10% of an output.",
      currentPatch:
        "Defining the decision deadline and the required quality level before starting.",
      severity: "RECURRING",
    },
    {
      id: "quiet-load",
      number: "03",
      title: "QUIET INITIAL LOAD",
      description:
        "In unfamiliar groups, I often observe before speaking and can enter the conversation later than I should.",
      currentPatch:
        "Contributing one useful question or observation early instead of waiting for a perfectly formed point.",
      severity: "LOW AFTER FIRST 10 MINUTES",
    },
  ] satisfies readonly BugReport[],
  controls: ["ACKNOWLEDGE", "PATCH IN PROGRESS", "DO NOT ASK FOR ETA"],
} as const;

export const beauty = {
  id: "beauty",
  sectionLabel: "06 / THE REQUIRED BEAUTY QUESTION",
  headline: ["NO GRAND PHILOSOPHY.", "JUST GOOD EXECUTION."],
  body: [
    "I do not spend much time trying to define beauty in abstract terms.",
    "To me, something is beautiful when it feels intentional and well put together—a clean interface, a perfectly timed cricket shot, a photograph that captures the right moment or a solution that removes unnecessary effort.",
    "I appreciate clarity, proportion and execution more than conventional perfection.",
  ],
  annotation: "YES, THIS IS THE ENTIRE PHILOSOPHY.",
} as const;

export const productPhilosophy = {
  id: "product-philosophy",
  sectionLabel: "07 / PRODUCT PHILOSOPHY",
  brand: "PRODUCT DNA",
  headline: ["SCIENCE FIRST.", "FUNCTION FIRST.", "NO UNNECESSARY DRAMA."],
  body: [
    "The product philosophy I relate to most is simple: science first, function first.",
    "I am drawn to products that feel practical, evidence-led and focused on solving a real problem consistently rather than creating unnecessary complexity around it.",
    "That approach is close to how I think about products and work: the system behind an experience can be sophisticated, but what reaches the user should feel clear, reliable and easy to understand.",
  ],
  principles: ["FUNCTION > FUSS", "CONSISTENCY > HYPE", "CLARITY > COMPLEXITY"],
} as const;

export const rapidFire = {
  id: "rapid-fire",
  sectionLabel: "08 / UNSOLICITED INFORMATION",
  facts: [
    { label: "FROM", value: "DELHI" },
    { label: "DIET", value: "VEGETARIAN" },
    { label: "SPORT", value: "CRICKET" },
    { label: "MARKET STYLE", value: "SWING INVESTING" },
    { label: "DERIVATIVES", value: "NO THANKS" },
    { label: "FAVOURITE WORK MODE", value: "BUILDING SOMETHING REAL" },
    { label: "SOCIAL BATTERY", value: "TAKES A FEW MINUTES TO BOOT" },
    { label: "CURRENT ORGANISATION", value: "XLRI DELHI-NCR" },
    { label: "CURRENT CLUB", value: "ATOM" },
    {
      label: "MOST DANGEROUS SENTENCE",
      value: "“THIS SHOULD ONLY TAKE AN HOUR”",
    },
    { label: "IDEAL ROLE DIRECTION", value: "PRODUCT MANAGEMENT" },
    { label: "NUMBER OF INTERESTS", value: "UNNECESSARY" },
    { label: "NUMBER OF OPEN BROWSER TABS", value: "CLASSIFIED" },
  ] satisfies readonly RapidFact[],
} as const;

export const contact: ProfileContact = {
  linkedInHref: "https://www.linkedin.com/in/ashwin-sheoran/",
  cvHref: "/Ashwin-Sheoran-CV.pdf",
};

export const closing = {
  id: "closing",
  statement: ["NO GRAND CONCLUSION.", "THE NEXT TAB IS ALREADY LOADING."],
  identity: [
    "ASHWIN SHEORAN",
    "XLRI DELHI-NCR",
    "BUSINESS MANAGEMENT 2026–28",
  ],
  actions: {
    cv: { label: "VIEW TRADITIONAL CV", displayLabel: "[ VIEW TRADITIONAL CV ]" },
    linkedIn: { label: "LINKEDIN", displayLabel: "[ LINKEDIN ]" },
  },
  systemLine: ["END OF PAGE.", "NOT END OF FILE."],
} as const;

export const interactions = {
  progressLabel: "PROFILE LOADING",
  doNotClick: {
    label: "DO NOT CLICK",
    response: ["YOU CLICKED IT.", "CURIOSITY CONFIRMED."],
  },
  keyboardEasterEgg: {
    sequence: "CRICKET",
    accessibleLabel: "Cricket scorecard easter egg",
  },
} as const;

export const profile = {
  navigation,
  hero,
  about,
  interests,
  sideQuests,
  characterStats,
  knownIssues,
  beauty,
  productPhilosophy,
  rapidFire,
  closing,
  contact,
  interactions,
} as const;

export type Profile = typeof profile;
