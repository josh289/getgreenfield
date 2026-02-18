export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  industry: string;
  service: 'managed' | 'startup';
  challenge: string;
  approach: string;
  solution: string;
  results: { metric: string; description: string }[];
  technicalDetails: string[];
  outcome: string;
  featured?: boolean;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'prototype-to-production',
    title: 'From prototype to 13 production microservices in 15 weeks.',
    client: 'Early-Stage Platform',
    industry: 'Technology',
    service: 'startup',
    challenge: 'An early-stage platform had a working prototype but no production architecture. The codebase needed to be decomposed into microservices with enterprise-grade security, observability, and testing before it could handle real users and pass technical due diligence. The timeline was aggressive. The budget was fixed.',
    approach: 'Greenfield Labs ran the full manufacturing process. Week one produced a complete architecture blueprint with typed service contracts and domain models. The blueprint was reviewed, refined, and approved before any implementation began. The build phase used the Greenfield platform to construct each microservice: CQRS with event sourcing, zero infrastructure code, two-layer authorization, typed contracts between every service. Evergreen automated test generation, contract validation, and coverage enforcement.',
    solution: 'Quality gates were non-negotiable. Every service had to pass strict TypeScript compilation, 90%+ test coverage, authorization verification, and distributed tracing validation before it was considered complete.',
    results: [
      { metric: '13 services', description: 'Production microservices delivered' },
      { metric: '385 handlers', description: 'Command, query, and event handlers' },
      { metric: 'Due diligence ready', description: 'Passed technical review on delivery' },
      { metric: '90%+ coverage', description: 'On every service' },
      { metric: '15 weeks', description: 'Single developer timeline' },
      { metric: '75% reduction', description: 'Cost vs. in-house team' },
    ],
    technicalDetails: [
      'TypeScript with strict mode across all services',
      'CQRS + event sourcing for every domain',
      'RabbitMQ for all inter-service communication',
      'PostgreSQL for event storage, Redis for caching',
      'OpenTelemetry + Jaeger for distributed tracing',
      'Prometheus + Grafana for metrics and dashboards',
      'Docker containerization for every service',
      'Biome for linting and formatting enforcement',
    ],
    outcome: 'The platform moved from prototype to production-ready architecture in fifteen weeks. The delivered system included complete documentation, deployment configurations, and architecture walkthroughs. The codebase was designed for the client\'s future engineering hires to read, maintain, and extend from day one.',
    featured: true,
  },
];
