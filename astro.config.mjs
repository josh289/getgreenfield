import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://greenfield-labs.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    server: {
      allowedHosts: ['pop-os.tailb95a94.ts.net'],
    },
  },
  integrations: [
    react(),
    tailwind(),
    sitemap(),
    starlight({
      title: 'Greenfield Labs Docs',
      description: 'Documentation for Greenfield Labs software manufacturing services.',
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
          href: 'https://github.com/greenfield-labs',
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
