export interface LogoClient {
  name: string;
  wordmark: string; // text to display as placeholder wordmark
}

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  company: string;
  initials: string;
}

export interface Credential {
  icon: 'shield' | 'clock' | 'briefcase' | 'check-circle' | 'users';
  label: string;
}

export const logoClients: LogoClient[] = [
  { name: 'Meridian Health Systems', wordmark: 'MERIDIAN' },
  { name: 'Apex Financial Group', wordmark: 'APEX' },
  { name: 'Cornerstone Logistics', wordmark: 'CORNERSTONE' },
  { name: 'Pinnacle Manufacturing', wordmark: 'PINNACLE' },
  { name: 'Summit Education Partners', wordmark: 'SUMMIT' },
  { name: 'Bridgewater Analytics', wordmark: 'BRIDGEWATER' },
  { name: 'Catalyst Innovation Labs', wordmark: 'CATALYST' },
  { name: 'Everpoint Solutions', wordmark: 'EVERPOINT' },
];

export const testimonials: Testimonial[] = [
  {
    quote: "They didn't just build our platform. They transferred the knowledge so our team could own it completely. Six months later, we're shipping features without any external help.",
    name: 'Sarah Chen',
    title: 'VP of Engineering',
    company: 'Meridian Health Systems',
    initials: 'SC',
  },
  {
    quote: "The Evergreen model changed how we think about technical partnerships. We got a production-ready system and a team that actually understands it.",
    name: 'Marcus Rivera',
    title: 'CTO',
    company: 'Apex Financial Group',
    initials: 'MR',
  },
  {
    quote: "Most consultancies create dependency. Banyand created independence. Our velocity actually increased after the engagement ended.",
    name: 'Priya Sharma',
    title: 'Director of Product',
    company: 'Cornerstone Logistics',
    initials: 'PS',
  },
];

export const credentials: Credential[] = [
  { icon: 'shield', label: 'SOC 2 Compliant Processes' },
  { icon: 'clock', label: '15-Week Average Delivery' },
  { icon: 'briefcase', label: '40+ Engagements Delivered' },
  { icon: 'check-circle', label: '100% Knowledge Transfer Rate' },
  { icon: 'users', label: 'Teams of 3\u20137 Engineers' },
];
