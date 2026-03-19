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
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'Deadworks Logo',
        src: 'https://deadworks.net/assets/deadworks-logo.png',
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
          href: 'https://deadworks.net/database',
          label: 'Database',
          position: 'right',
          className: 'navbar-icon-database',
        },
        {
          href: 'https://github.com/Deadworks-net/deadworks',
          label: 'GitHub',
          position: 'right',
          className: 'navbar-icon-github',
        },
        {
          href: 'https://discord.gg/d3JHnVGA26',
          label: 'Discord',
          position: 'right',
          className: 'navbar-icon-discord',
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
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['csharp', 'json', 'bash', 'markup'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
