/*
 * ─────────────────────────────────────────────────────────────────────────
 *  SITE CONTENT — the only file you need to edit to update the site.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Facts below come from Lily's résumé. Anything still wrapped in
 *  [square brackets] is a PLACEHOLDER (search for "[" to find them); bracketed
 *  text is also highlighted on the page with a dotted underline so it cannot
 *  slip through. Remove the brackets when you drop in the real text.
 *
 *  Empty arrays are fine: a section with nothing in it is hidden.
 */

export type Link = { label: string; href: string };

export type Project = {
  title: string;
  summary: string;
  points: string[];
  stack: string[];
  links: Link[];
};

export type Role = {
  role: string;
  org: string;
  dates: string;
  location: string;
  points: string[];
};

export type SkillGroup = { label: string; items: string[] };

export const site = {
  name: 'Lily Liu',
  labelTop: 'Lily',
  labelBottom: 'Liu',
  role: 'Software Engineering · University of Waterloo',
  status: 'Toronto, ON',
  labelRing: 'Lily Liu · Software Engineering · University of Waterloo · Side A',
  heroKicker: 'Now playing',
  heroLine: 'Software engineering student at Waterloo, building things in Toronto.',
  /** PLACEHOLDER — what the record stands for. Shown under the hero line. */
  vinylMeaning: '[What the record means to Lily — to be written]',
};

export const about = {
  title: 'About',
  lede: "Hi, I'm Lily — a software engineering student at the University of Waterloo, based in Toronto.",
  paragraphs: [
    'When I’m not coding, I’m usually cooking, travelling, scrolling through Pinterest or listening to a podcast — and every so often, breaking things just to build them back better.',
  ],
  /** PLACEHOLDER — set to an image path (e.g. '/lily.jpg' in public/) when ready. */
  photo: '',
  photoPlaceholder: '[Photo of Lily]',
  facts: [
    { label: 'School', value: 'University of Waterloo' },
    { label: 'Program', value: 'Honours Bachelor of Software Engineering' },
    { label: 'Since', value: '2024 – present' },
    { label: 'GPA', value: '3.9 / 4.0' },
    { label: 'Based in', value: 'Toronto' },
  ],
};

export const projects: Project[] = [
  {
    title: 'Sync',
    summary: 'A rhythm game on a custom 2D engine, with on-chain randomness.',
    points: [
      'Engineered a 2D game engine in TypeScript with canvas rendering and collision detection, synchronizing 200+ hazard patterns with musical beats.',
      'Integrated ORAO VRF with Solana smart contracts to generate verifiable on-chain randomness, producing deterministic terrain seeds and supporting SOL-staked 1v1 matches.',
    ],
    stack: ['TypeScript', 'Canvas', 'Solana', 'ORAO VRF'],
    links: [{ label: 'Code', href: 'https://github.com/lilyl1u/Sync' }],
  },
  {
    title: 'EmotiBox',
    summary: 'Slack workplace analytics that reads the emotional tone of a team.',
    points: [
      'Built a Slack app analyzing emotional tone across 100K+ messages to surface sentiment trends and communication insights across teams for 220+ users.',
      'Designed REST APIs in Next.js that integrated a Hugging Face sentiment analysis model, storing results in PostgreSQL on AWS EC2 while filtering neutral messages to reduce storage needs.',
    ],
    stack: ['Next.js', 'Hugging Face', 'PostgreSQL', 'AWS EC2', 'Slack API'],
    links: [{ label: 'Code', href: 'https://github.com/lilyl1u/EmotiBox' }],
  },
];

export const experience: Role[] = [
  {
    role: 'Software Engineering Intern',
    org: 'Faire',
    dates: 'Sep 2026 – Present',
    location: 'Toronto, ON',
    points: [
      'Integrated Facebook SSO for retailers, increasing the signup completion rate by 8% — about 780 additional monthly signups.',
      'Developed SEO/AEO indexing controls using a Redis cache of popular keywords refreshed weekly, reducing low-relevance indexed pages by 50%.',
    ],
  },
  {
    role: 'Software Engineering Intern',
    org: 'Faire',
    dates: 'Jan 2026 – Apr 2026',
    location: 'Toronto, ON',
    points: [
      'Enabled $2M in annualized revenue in Canada with a retailer recommendation pipeline that processed 2.3M+ weekly marketplace interactions to identify and rank qualified leads for brands.',
      'Achieved a 60% retailer outreach rate across delivered leads with an asynchronous messaging system that let brands contact multiple retailers at once.',
      'Reduced campaign-builder load latency by 35% and increased email click-through rate by 13% by migrating state management from MobX to React Hooks.',
    ],
  },
  {
    role: 'Backend Developer',
    org: 'Hack the North',
    dates: 'Jan 2026 – Sep 2026',
    location: 'Waterloo, ON',
    points: [
      'Developed a teammate discovery platform for 1,200+ hackers at Canada’s largest hackathon, with searchable profiles and AI-powered personalized recommendations.',
      'Built semantic teammate search with Cohere and ChromaDB, ranking profiles against natural-language queries to prioritize matches by skills and interests.',
      'Engineered Prisma and GraphQL services for a high-traffic backend supporting activity tracking and point-based rewards across 20,000+ transactions.',
    ],
  },
  {
    role: 'Software Engineering Intern',
    org: 'Rocket Mortgage',
    dates: 'May 2025 – Aug 2025',
    location: 'Detroit, MI',
    points: [
      'Developed a bank onboarding platform that automated cross-team setup workflows, cutting manual onboarding from 10 hours to under 5 minutes across 30+ U.S. banks.',
      'Architected an MS SQL Server data layer for frequently accessed bank records, eliminating hard-coded records and reducing database query load by 88%.',
    ],
  },
];

export const skills: SkillGroup[] = [
  { label: 'Languages', items: ['Python', 'JavaScript / TypeScript', 'C', 'C++', 'Go', 'SQL', 'Scala'] },
  { label: 'Frameworks & libraries', items: ['React', 'Next.js', 'Angular', 'Node.js', 'FastAPI', 'Prisma', 'GraphQL'] },
  { label: 'Developer tools', items: ['Docker', 'Kubernetes', 'PostgreSQL', 'MSSQL', 'DynamoDB', 'AWS', 'GCP', 'Git', 'Linux'] },
];

export const contact = {
  title: 'Contact',
  lede: 'The best way to reach me is email — I’d love to hear from you.',
  links: [
    { label: 'Email', value: 'l425liu@uwaterloo.ca', href: 'mailto:l425liu@uwaterloo.ca' },
    { label: 'GitHub', value: 'github.com/lilyl1u', href: 'https://github.com/lilyl1u' },
    { label: 'LinkedIn', value: 'linkedin.com/in/lilyliu438', href: 'https://www.linkedin.com/in/lilyliu438' },
  ],
  footer: `© ${new Date().getFullYear()} Lily Liu`,
};
