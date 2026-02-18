export const seoDefaults = {
  siteName: 'Greenfield Labs',
  domain: 'https://greenfield-labs.com',
  defaultOgImage: '/og-image.png',
};

export const pageSEO: Record<string, { title: string; description: string; ogImage?: string }> = {
  home: {
    title: 'Greenfield Labs - We Manufacture Production Software',
    description: 'Greenfield Labs manufactures production microservices from existing codebases and prototypes. 75% cost reduction. 4x faster. 90%+ test coverage enforced.',
  },
  'managed-services': {
    title: 'Managed Services - Greenfield Labs',
    description: 'Production microservices for engineering teams. Greenfield Labs delivers architected, tested, deployment-ready TypeScript services in 3 weeks. 75% less than in-house.',
  },
  startups: {
    title: 'Startup Partnerships - Greenfield Labs',
    description: 'Turn your prototype into production microservices. Greenfield Labs builds investor-ready architecture for startups. Weeks, not months. Fully owned.',
  },
  'how-it-works': {
    title: 'How It Works - Greenfield Labs',
    description: 'The Greenfield Labs software manufacturing process: Discovery, Architecture, Build, Quality. Standardized process. Automated quality gates. Predictable results.',
  },
  'case-studies': {
    title: 'Case Studies - Greenfield Labs',
    description: 'See what Greenfield Labs has built. 13 production microservices, 385 handlers, 469 tests, 90%+ coverage -- real results from real engagements.',
  },
  evergreen: {
    title: 'Evergreen Platform - Greenfield Labs',
    description: 'Evergreen is the software assembly line from Greenfield Labs. AI-assisted code generation with deterministic quality enforcement. Coming soon.',
  },
  about: {
    title: 'About - Greenfield Labs',
    description: 'Greenfield Labs is a software manufacturing company founded to make production software predictable, affordable, and repeatable.',
  },
  contact: {
    title: 'Contact - Greenfield Labs',
    description: 'Start a conversation with Greenfield Labs. Tell us about your project and get a free technical assessment with scope, timeline, and cost.',
  },
};
