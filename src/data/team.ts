export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export const team: TeamMember[] = [
  {
    name: 'Josh Whitlock',
    role: 'Founder',
    bio: 'Former engineering leader with a decade of experience building and scaling software teams. Founded Greenfield Labs to bring manufacturing discipline to software development.',
    social: {
      linkedin: 'https://linkedin.com/in/joshwhitlock',
      github: 'https://github.com/joshwhitlock',
    },
  },
];
