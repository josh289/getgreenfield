import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    react(),
    tailwind(),
    starlight({
      title: 'Greenfield Platform',
      description: 'Framework built for AI. Agents trained to build on it. Ship in days, not months.',
      logo: {
        src: './src/assets/greenfield-logo.png',
        replacesTitle: true,
      },
      customCss: [
        './src/styles/starlight-custom.css',
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/banyanai/banyan-core',
        },
      ],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      disable404Route: true,
      sidebar: [
        {
          label: 'Getting Started',
          autogenerate: { directory: '00-getting-started' },
        },
        {
          label: 'Tutorials',
          autogenerate: { directory: '01-tutorials' },
        },
        {
          label: 'Concepts',
          autogenerate: { directory: '02-concepts' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: '03-guides' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: '04-reference' },
        },
        {
          label: 'Troubleshooting',
          autogenerate: { directory: '05-troubleshooting' },
        },
      ],
    }),
  ],
});