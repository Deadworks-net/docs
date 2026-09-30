import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
// @ts-ignore — JS module without types
import remarkSourceLines from './scripts/remark-source-lines.mjs';

const isDev = process.env.NODE_ENV === 'development';

// Pages that used to live under /api-reference/ and are now under /features/.
const movedToFeatures = [
  'admin-api', 'chat-commands', 'commands', 'configuration', 'console-commands', 'convars',
  'damage', 'entities', 'entity-io', 'game-events', 'heroes', 'modifiers', 'networking',
  'particles', 'permissions', 'players', 'precaching', 'sound', 'timers', 'tracing', 'ui',
  'world-text',
];

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

  clientModules: isDev ? ['./src/dev-editor/index.ts'] : [],

  customFields: {
    // Must match the port scripts/edit-server.ts listens on.
    editServerPort: Number(process.env.EDIT_SERVER_PORT ?? 3001),
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          beforeDefaultRemarkPlugins: isDev ? [remarkSourceLines] : [],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          ...movedToFeatures.map((page) => ({
            from: `/api-reference/${page}`,
            to: `/features/${page}`,
          })),
          // Guides that were folded into Features pages.
          {from: '/guides/chat-and-hud', to: '/features/chat'},
          {from: '/guides/team-and-hero-management', to: '/features/players'},
        ],
      },
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
          href: 'https://deadworks.net/servers',
          label: 'Servers',
          position: 'right',
          className: 'navbar-icon-servers',
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
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['csharp', 'json', 'bash', 'markup'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
