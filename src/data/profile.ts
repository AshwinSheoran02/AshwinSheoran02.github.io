/*
 * Content source of truth for ashwin.top.
 * Everything a visitor reads lives here; presentation lives in components and the 3D scene.
 * To add a project, append an entry to `projects` (see the Project type).
 */

export type NavTarget = "home" | "about" | "experience" | "projects" | "contact";

export interface NavItem {
  readonly label: string;
  readonly target: NavTarget;
}

export interface TimelineEntry {
  readonly period: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly detail: string;
  readonly status: "SHIPPED" | "INSTALLING";
}

export type InterestId =
  | "cricket"
  | "markets"
  | "gaming"
  | "vibe-coding"
  | "photography";

export interface Interest {
  readonly id: InterestId;
  readonly number: string;
  readonly label: string;
  readonly object: string;
  readonly body: readonly string[];
  readonly callout?: readonly string[];
  readonly note?: string;
}

export type SideQuestId =
  | "atom"
  | "game-design"
  | "sports-council"
  | "ai-healthcare"
  | "hackathons"
  | "volunteering";

export interface SideQuest {
  readonly id: SideQuestId;
  readonly title: string;
  readonly subtitle?: string;
  readonly description: string;
  readonly artifact: string;
}

export interface Strength {
  readonly id: "ambiguity" | "learning" | "persistence" | "translation";
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly meterLabel: string;
  readonly value: number;
}

export interface KnownIssue {
  readonly id: "open-tabs" | "over-polishing" | "quiet-load";
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly currentPatch: string;
  readonly severity: string;
}

export interface Fact {
  readonly label: string;
  readonly value: string;
}

export type ProjectKind = "game" | "app";

/** Built-in 3D exhibits. Projects without one get the generic display case. */
export type ExhibitStyle = "wizarding-board" | "pool-table" | "display-case";

export interface Project {
  readonly id: string;
  readonly kind: ProjectKind;
  /** Full title shown on the exhibit label. */
  readonly title: string;
  /** Short name used in the navigation menu. */
  readonly navLabel: string;
  readonly medium: string;
  readonly url: string;
  readonly summary: string;
  readonly details: readonly string[];
  readonly exhibit: ExhibitStyle;
  /** Optional image in /public used by the generic display case. */
  readonly cover?: string;
}

export const projectKindLabels: Record<ProjectKind, string> = {
  game: "Games",
  app: "Apps",
};

export const site = {
  brand: "ASHWIN.TOP",
  name: "Ashwin Sheoran",
  title: "Ashwin Sheoran · A personal collection",
  description:
    "Ashwin Sheoran: ex-software engineer at NAB, IIIT Delhi CSAM graduate, MBA student at XLRI Delhi-NCR, game builder and cricket obsessive. Walk through the collection.",
} as const;

export const navigation = [
  { label: "HOME", target: "home" },
  { label: "ABOUT", target: "about" },
  { label: "EXPERIENCE", target: "experience" },
  { label: "PROJECTS", target: "projects" },
  { label: "CONTACT", target: "contact" },
] as const satisfies readonly NavItem[];

export const hero = {
  kicker: "A PERSONAL COLLECTION · OPEN DAILY",
  name: "Ashwin Sheoran",
  roles: [
    "Ex-software engineer.",
    "Current MBA student.",
    "Cricket obsessive.",
    "Occasional overthinker.",
  ],
  medium: "Professionally curious. Chronically overcommitted.",
  metadata: [
    { label: "B.Tech CSAM", value: "IIIT Delhi" },
    { label: "Former Associate", value: "NAB" },
    { label: "Business Management", value: "XLRI Delhi-NCR" },
    { label: "Currently exploring", value: "Product × Media × Management" },
  ],
  cta: "Begin the tour",
  ticker: [
    "SYSTEM ONLINE",
    "10 TABS ACTIVE",
    "4 DEADLINES APPROACHING",
    "1 COFFEE REQUIRED",
    "0 GRAND PERSONAL MANIFESTOS",
  ],
} as const;

export const about = {
  label: "GALLERY 01 · THE MAIN PLOT",
  headline: [
    "I started with code.",
    "Then I got curious about everything around it.",
  ],
  body: [
    "I studied Computer Science and Applied Mathematics at IIIT Delhi, spent a summer analysing IPL-scale digital journeys at Jio, and then spent 22 months building banking and investment products at NAB.",
    "Eventually, I realised that I was as interested in why something should be built, who would use it and how it would create value as I was in writing the code itself.",
    "That curiosity brought me to XLRI Delhi.",
    "The plan now is not to abandon technology. It is to understand the product, business and people around it better.",
  ],
  prism: {
    input: "CODE",
    outputs: ["WHY BUILD IT", "WHO USES IT", "HOW IT CREATES VALUE"],
  },
  status: [
    "22 MONTHS IN PRODUCTION",
    "MANAGEMENT PATCH CURRENTLY INSTALLING",
    "LOCATION: XLRI DELHI-NCR",
    "STATUS: STILL SHIPPING",
  ],
} as const;

export const interests = {
  label: "GALLERY 02 · OPEN TABS",
  headline: [
    "I do not have one passion.",
    "I have a resource-allocation problem.",
  ],
  items: [
    {
      id: "cricket",
      number: "01",
      label: "Cricket",
      object: "Leather ball and stumps",
      body: [
        "I enjoy cricket for the same reason I enjoy products and markets: the visible result is only the surface.",
        "Field placements, match-ups, momentum, risk, patience and decision-making are constantly interacting underneath the score.",
      ],
      note: "I will absolutely explain why a Test match draw can be interesting.",
    },
    {
      id: "markets",
      number: "02",
      label: "Markets",
      object: "Candlestick study in brass and glass",
      body: [
        "I enjoy understanding businesses, price behaviour and the gap between perception and value.",
        "The interesting part is not watching a number move. It is figuring out what everyone else thinks that number means.",
      ],
      note: "Equity markets. No F&O heroics.",
    },
    {
      id: "gaming",
      number: "03",
      label: "Gaming",
      object: "Dice, recently rolled",
      body: [
        "Games are systems made visible.",
        "Rules, incentives, feedback loops and difficulty curves combine to produce behaviour. That is why studying game design made me think differently about products.",
      ],
      callout: [
        "Ranked 1st in Game Design and Development",
        "Later selected as Teaching Assistant",
      ],
    },
    {
      id: "vibe-coding",
      number: "04",
      label: "Vibe coding",
      object: "Keycaps, mid-deploy",
      body: [
        "I like the point where an idea stops being a sentence and becomes something people can click.",
        "AI-assisted development has made prototyping faster, but the difficult part remains the same: deciding what deserves to be built.",
      ],
      note: "Build first. Overthink immediately after.",
    },
    {
      id: "photography",
      number: "05",
      label: "Photography",
      object: "Lens, still learning",
      body: [
        "I joined ATOM at XLRI without pretending to be an experienced photographer.",
        "That is exactly why it interested me.",
        "Technology taught me to build systems. Photography is teaching me to notice moments.",
      ],
    },
  ] satisfies readonly Interest[],
} as const;

export const statement = {
  label: "GALLERY 03 · CURATOR'S STATEMENT",
  beauty: {
    title: "The required beauty question",
    headline: ["No grand philosophy.", "Just good execution."],
    body: [
      "I do not spend much time trying to define beauty in abstract terms.",
      "To me, something is beautiful when it feels intentional and well put together: a clean interface, a perfectly timed cricket shot, a photograph that captures the right moment or a solution that removes unnecessary effort.",
      "I appreciate clarity, proportion and execution more than conventional perfection.",
    ],
    annotation: "Yes, this is the entire philosophy.",
  },
  product: {
    title: "Product DNA",
    headline: ["Science first.", "Function first.", "No unnecessary drama."],
    body: [
      "The product philosophy I relate to most is simple: science first, function first.",
      "I am drawn to products that feel practical, evidence-led and focused on solving a real problem consistently rather than creating unnecessary complexity around it.",
      "That approach is close to how I think about products and work: the system behind an experience can be sophisticated, but what reaches the user should feel clear, reliable and easy to understand.",
    ],
    principles: ["FUNCTION > FUSS", "CONSISTENCY > HYPE", "CLARITY > COMPLEXITY"],
  },
} as const;

export const facts = {
  label: "VISITOR INFORMATION",
  headline: "Unsolicited information.",
  items: [
    { label: "From", value: "Delhi" },
    { label: "Diet", value: "Vegetarian" },
    { label: "Sport", value: "Cricket" },
    { label: "Market style", value: "Swing investing" },
    { label: "Derivatives", value: "No thanks" },
    { label: "Favourite work mode", value: "Building something real" },
    { label: "Social battery", value: "Takes a few minutes to boot" },
    { label: "Current organisation", value: "XLRI Delhi-NCR" },
    { label: "Current club", value: "ATOM" },
    { label: "Most dangerous sentence", value: "“This should only take an hour”" },
    { label: "Ideal role direction", value: "Product management" },
    { label: "Number of interests", value: "Unnecessary" },
    { label: "Number of open browser tabs", value: "Classified" },
  ] satisfies readonly Fact[],
  doNotClick: {
    label: "DO NOT CLICK",
    response: ["You clicked it.", "Curiosity confirmed."],
  },
} as const;

export const journey = {
  label: "GALLERY 04 · THE JOURNEY",
  headline: ["Four releases shipped.", "The fifth is installing."],
  entries: [
    {
      period: "2020",
      title: "Finished school",
      subtitle: "94.6% in Class XII",
      detail: "Still had no idea what a sprint retrospective was.",
      status: "SHIPPED",
    },
    {
      period: "2020–2024",
      title: "IIIT Delhi",
      subtitle: "B.Tech in Computer Science and Applied Mathematics",
      detail:
        "Learned algorithms, mathematics, game design and the art of surviving group projects.",
      status: "SHIPPED",
    },
    {
      period: "2023",
      title: "Jio",
      subtitle: "Internship",
      detail:
        "Analysed large-scale IPL performance and payment data. Discovered that even a simple recharge journey has more ways to fail than expected.",
      status: "SHIPPED",
    },
    {
      period: "2024–2026",
      title: "NAB",
      subtitle: "Associate · 22 months",
      detail:
        "Built customer-facing banking, investment and onboarding journeys. Worked across India, Australia and Vietnam.",
      status: "SHIPPED",
    },
    {
      period: "2026–NOW",
      title: "XLRI Delhi-NCR",
      subtitle: "Business Management",
      detail:
        "Learning why “technically possible” is not the same as “commercially sensible.”",
      status: "INSTALLING",
    },
  ] satisfies readonly TimelineEntry[],
} as const;

export const sideQuests = {
  label: "GALLERY 05 · SIDE QUESTS",
  headline: "The side quests usually explain the main character better.",
  entries: [
    {
      id: "atom",
      title: "ATOM, XLRI Delhi",
      subtitle: "Junior Executive Member",
      description: "Media, photography, social platforms and event coverage.",
      artifact: "Camera",
    },
    {
      id: "game-design",
      title: "Game Design, IIIT Delhi",
      subtitle: "Ranked 1st, then Teaching Assistant",
      description:
        "Ranked first in the course. Later conducted labs and mentored student teams as Teaching Assistant.",
      artifact: "Medal",
    },
    {
      id: "sports-council",
      title: "Sports Council, IIIT Delhi",
      description:
        "Supported cricket operations, fixtures, participating teams and fantasy-cricket competitions.",
      artifact: "Scoreboard",
    },
    {
      id: "ai-healthcare",
      title: "AI in Healthcare",
      subtitle: "Research project",
      description:
        "Worked on shock-risk prediction using ICU vital-sign data across thousands of ICU stays.",
      artifact: "Vital-sign trace",
    },
    {
      id: "hackathons",
      title: "Hackathons",
      description:
        "Built rapid prototypes across AI, web, Android, games and product challenges.",
      artifact: "Laptop",
    },
    {
      id: "volunteering",
      title: "Volunteering",
      description:
        "Completed 80 hours across education, welfare, animal support and plantation work.",
      artifact: "Seedling",
    },
  ] satisfies readonly SideQuest[],
} as const;

export const strengths = {
  label: "GALLERY 06 · CHARACTER BUILD",
  headline: [
    "Some skills were installed.",
    "Others were learned the hard way.",
  ],
  items: [
    {
      id: "ambiguity",
      number: "01",
      title: "Turning ambiguity into action",
      description:
        "I am comfortable taking a vaguely defined problem, identifying its moving parts and converting it into something executable.",
      meterLabel: "Ambiguity to action",
      value: 91,
    },
    {
      id: "learning",
      number: "02",
      title: "Learning through building",
      description:
        "I understand unfamiliar tools fastest when I have a real output to create.",
      meterLabel: "Learning velocity",
      value: 88,
    },
    {
      id: "persistence",
      number: "03",
      title: "Staying with difficult problems",
      description: "I do not lose interest simply because the first version fails.",
      meterLabel: "Persistence",
      value: 93,
    },
    {
      id: "translation",
      number: "04",
      title: "Connecting technical and non-technical context",
      description:
        "Working with engineers, product owners, architects, analysts, designers and business stakeholders taught me that good work often depends on translation.",
      meterLabel: "Cross-functional translation",
      value: 84,
    },
  ] satisfies readonly Strength[],
  note: ["Numbers are entirely self-reported.", "Audit pending."],
} as const;

export const knownIssues = {
  label: "CONSERVATION REPORT · KNOWN ISSUES",
  headline: ["The current version is stable.", "Not bug-free."],
  items: [
    {
      id: "open-tabs",
      number: "01",
      title: "Too many open tabs",
      description:
        "I am easily interested in new projects and can take on more work than the calendar supports.",
      currentPatch:
        "Choosing based on impact and ownership instead of treating every interesting opportunity as mandatory.",
      severity: "High during MBA",
    },
    {
      id: "over-polishing",
      number: "02",
      title: "Over-polishing",
      description:
        "I can spend disproportionate time improving the final 10% of an output.",
      currentPatch:
        "Defining the decision deadline and the required quality level before starting.",
      severity: "Recurring",
    },
    {
      id: "quiet-load",
      number: "03",
      title: "Quiet initial load",
      description:
        "In unfamiliar groups, I often observe before speaking and can enter the conversation later than I should.",
      currentPatch:
        "Contributing one useful question or observation early instead of waiting for a perfectly formed point.",
      severity: "Low after first 10 minutes",
    },
  ] satisfies readonly KnownIssue[],
  controls: [
    { label: "Acknowledge", response: "Bug acknowledged. Still reproducible." },
    { label: "Patch in progress", response: "Patch queued. ETA: optimistic." },
    { label: "Do not ask for ETA", response: "ETA removed from roadmap." },
  ],
  idle: "Awaiting user input_",
} as const;

export const projects = [
  {
    id: "harry-potter",
    kind: "game",
    title: "The Battle for the Wizarding World",
    navLabel: "Harry Potter Board Game",
    medium: "Browser board game · 2 players or vs computer",
    url: "https://ashwin.top/harry-potter/",
    summary:
      "A digital tabletop edition of the two-player Harry Potter board game I designed with my team, Group 3 (the Pandas), in the Game Design and Development course at IIIT Delhi.",
    details: [
      "Harry races to reach the wand while Voldemort hunts him. Once Harry holds the wand, he has 15 moves to catch Voldemort.",
      "The original printed board: 91 spaces and 116 paths.",
      "Movement dice, Galleons, 17 spell cards and the five-move freeze rule.",
      "Play a computer Voldemort, or two players on one device.",
    ],
    exhibit: "wizarding-board",
  },
  {
    id: "pool-game",
    kind: "game",
    title: "3D Pool Game",
    navLabel: "3D Pool Game",
    medium: "Browser game · built with three.js",
    url: "https://ashwin.top/pool-game/",
    summary:
      "A 3D 8-ball pool game that runs in the browser, with a 9 ft table, six pockets and a computer opponent that does not feel sorry for you.",
    details: [
      "Full 8-ball rules: break, open table, solids or stripes, fouls with ball in hand.",
      "Ball physics with sliding and rolling friction, cushion rebounds, follow, draw and side spin.",
      "Play the computer on Easy, Medium or Hard, or two players on one screen.",
      "Mouse, keyboard and touch controls, three camera views and five cloth colours.",
    ],
    exhibit: "pool-table",
  },
] as const satisfies readonly Project[];

export const projectsSection = {
  label: "GALLERY 07 · THE COLLECTION",
  headline: ["Things I built", "that you can actually play."],
  intro:
    "Each exhibit is a working project. Walk up to one, then press play. The games open on their own pages.",
  playLabel: "PLAY GAME",
  openLabel: "OPEN APP",
} as const;

export const contact = {
  linkedInHref: "https://www.linkedin.com/in/ashwin-sheoran/",
  cvHref: "/Ashwin-Sheoran-CV.pdf",
} as const;

export const closing = {
  label: "EXIT · THROUGH THE GIFT SHOP",
  statement: ["No grand conclusion.", "The next tab is already loading."],
  identity: ["Ashwin Sheoran", "XLRI Delhi-NCR", "Business Management 2026–28"],
  actions: {
    cv: "View traditional CV",
    linkedIn: "LinkedIn",
  },
  systemLine: ["End of page.", "Not end of file."],
} as const;

export const interactions = {
  keyboardEasterEgg: {
    sequence: "CRICKET",
    accessibleLabel: "Cricket scorecard easter egg",
  },
} as const;

export const profile = {
  site,
  navigation,
  hero,
  about,
  interests,
  statement,
  facts,
  journey,
  sideQuests,
  strengths,
  knownIssues,
  projects,
  projectsSection,
  contact,
  closing,
  interactions,
} as const;

export type Profile = typeof profile;
