export const managedFAQ = [
  {
    question: 'Do we own the code?',
    answer: 'Yes. Everything we build is yours -- source code, architecture documentation, deployment configurations, test suites. We do not retain licenses, proprietary dependencies, or lock-in mechanisms. You own the IP completely.',
  },
  {
    question: 'How do you handle security and access control?',
    answer: 'Every service ships with two-layer authorization. Layer 1 enforces permission-based access at the API gateway -- who can call what. Layer 2 enforces business-rule policies inside each handler -- what the data allows. Both layers are tested and documented. We can also work within your existing IAM and compliance frameworks.',
  },
  {
    question: 'What does our team need to provide?',
    answer: 'Access to the existing codebase, a domain expert for the discovery phase (typically 4-6 hours of their time in week one), and a technical lead for blueprint review and approval. We handle everything else.',
  },
  {
    question: 'How do you integrate with our existing systems?',
    answer: 'The architecture uses typed service contracts and message-based communication via RabbitMQ. Integration with existing APIs, databases, and third-party services is defined during the discovery phase and built into the service contracts. No hard-coded dependencies.',
  },
  {
    question: 'What if our requirements change during the engagement?',
    answer: 'The blueprint review at the end of week one exists for exactly this reason. We define scope together before code is written. Changes after blueprint approval are scoped as additional work with transparent timelines and costs. No ambiguity.',
  },
  {
    question: 'Do you provide ongoing support after delivery?',
    answer: 'We offer post-delivery support packages, but the goal is full handoff. Your team receives complete documentation, architecture walkthroughs, and deployment guides. The code is written to standard patterns your engineers can read, maintain, and extend without us.',
  },
  {
    question: 'What technology stack do you use?',
    answer: 'TypeScript with strict mode. Node.js 20 runtime. CQRS with event sourcing for domain modeling. RabbitMQ for messaging, PostgreSQL for persistence, Redis for caching. OpenTelemetry for distributed tracing. Docker for deployment. Every choice is intentional and battle-tested.',
  },
];
