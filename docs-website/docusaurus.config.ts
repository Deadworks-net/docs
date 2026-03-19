import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Deadworks API',
  tagline: 'Server-side scripting API for Deadlock',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://deadworks.dev',
  baseUrl: '/',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Deadworks API',
      logo: {
        alt: 'Deadworks Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/api-reference/plugin-base',
          label: 'API Reference',
          position: 'left',
        },
        {
          to: '/examples/roll-the-dice',
          label: 'Examples',
          position: 'left',
        },
        {
          href: 'https://store.steampowered.com/app/1422450/Deadlock/',
          label: 'Deadlock on Steam',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting Started', to: '/getting-started/setup' },
            { label: 'API Reference', to: '/api-reference/plugin-base' },
            { label: 'Guides', to: '/guides/plugin-lifecycle' },
          ],
        },
        {
          title: 'Examples',
          items: [
            { label: 'Roll The Dice', to: '/examples/roll-the-dice' },
            { label: 'Item Rotation', to: '/examples/item-rotation' },
            { label: 'Deathmatch', to: '/examples/deathmatch' },
            { label: 'Scourge DOT', to: '/examples/scourge' },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Deadlock on Steam',
              href: 'https://store.steampowered.com/app/1422450/Deadlock/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Deadworks. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['csharp', 'json', 'bash', 'markup'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
