import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/setup',
        'getting-started/first-plugin',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      collapsed: false,
      items: [
        'features/commands',
        'features/convars',
        'features/timers',
        'features/entities',
        'features/players',
        'features/networking',
        'features/particles',
        'features/sound',
        'features/modifiers',
        'features/damage',
        'features/game-events',
        'features/entity-io',
        'features/configuration',
        'features/heroes',
        'features/precaching',
        'features/tracing',
        'features/world-text',
        'features/ui',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/how-deadworks-works',
        'guides/plugin-lifecycle',
        'guides/server-hosting',
        'guides/uploading-content',
        'guides/team-and-hero-management',
        'guides/chat-and-hud',
      ],
    },
    {
      type: 'category',
      label: '(COMING SOON) Admins & Permissions',
      collapsed: true,
      link: {
        type: 'generated-index',
        title: 'Admins & Permissions (Coming Soon)',
        slug: '/permissions',
        description:
          'Not released yet: these features are coming in an upcoming Deadworks release. Who can use which commands on your server. Server owners: read the four numbered guides in order. Plugin developers: see Plugin Commands for a Role and the API pages.',
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
      label: 'Examples',
      collapsed: false,
      items: [
        'examples/roll-the-dice',
        'examples/item-rotation',
        'examples/scourge',
      ],
    },
  ],
};

export default sidebars;
