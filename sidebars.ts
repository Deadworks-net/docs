import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';
// Written by scripts/gen-api.ts along with the pages in docs/api-reference.
import apiSidebar from './api/sidebar.json';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Getting started for server admins',
      collapsed: false,
      link: {
        type: 'generated-index',
        title: 'Getting started for server admins',
        slug: '/getting-started/server-admins',
        description:
          'Run a Deadworks server, install plugins, set up admins and use the admin tools. Read the four pages in order.',
      },
      items: [
        'getting-started/server-admins/run-a-server',
        'getting-started/server-admins/install-plugins',
        'getting-started/server-admins/set-up-admins',
        'getting-started/server-admins/use-admin-tools',
      ],
    },
    {
      type: 'category',
      label: 'Getting started for developers',
      collapsed: false,
      link: {
        type: 'generated-index',
        title: 'Getting started for developers',
        slug: '/getting-started/developers',
        description: 'Set up a plugin project and write your first Deadworks plugin.',
      },
      items: [
        'getting-started/developers/setup',
        'getting-started/developers/first-plugin',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      collapsed: false,
      items: [
        // The basics: most plugins use these
        'features/commands',
        'features/chat',
        'features/players',
        'features/heroes',
        'features/abilities',
        'features/timers',
        'features/configuration',
        // Reacting to and changing the match
        'features/game-state',
        'features/game-events',
        'features/server',
        'features/convars',
        'features/damage',
        'features/modifiers',
        // Things in the world
        'features/entities',
        'features/sound',
        'features/particles',
        'features/precaching',
        'features/world-text',
        'features/zones',
        // Advanced
        'features/tracing',
        'features/entity-io',
        'features/networking',
        'features/ui',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/upgrading-permissions',
        'guides/how-deadworks-works',
        'guides/plugin-lifecycle',
        'guides/server-hosting',
        'guides/linux-docker',
        'guides/uploading-content',
      ],
    },
    {
      type: 'category',
      label: 'Admins & Permissions',
      collapsed: false,
      link: {
        type: 'generated-index',
        title: 'Admins & Permissions',
        slug: '/permissions',
        description:
          'Who can use which commands on your server. Server owners: read the four numbered guides in order. Plugin developers: see Plugin Commands for a Role and the API pages.',
      },
      items: [
        'guides/making-yourself-admin',
        'guides/admin-commands',
        'guides/admins-and-permissions',
        'guides/staff-roles',
        'guides/role-only-commands',
        'features/permissions',
        'features/admin-api',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: true,
      link: {type: 'doc', id: 'api-reference/index'},
      items: (apiSidebar as any[]).slice(1),
    },
  ],
};

export default sidebars;
