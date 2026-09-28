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
        'api-reference/commands',
        'api-reference/convars',
        'api-reference/timers',
        'api-reference/entities',
        'api-reference/players',
        'api-reference/networking',
        'api-reference/particles',
        'api-reference/sound',
        'api-reference/modifiers',
        'api-reference/damage',
        'api-reference/game-events',
        'api-reference/entity-io',
        'api-reference/configuration',
        'api-reference/heroes',
        'api-reference/precaching',
        'api-reference/tracing',
        'api-reference/world-text',
        'api-reference/ui',
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
          'Not released yet: these features are coming in an upcoming Deadworks release. Who can use which commands on your server. Read these in order: each guide builds on the one before, from making yourself admin to writing your own permission-aware plugins.',
      },
      items: [
        'guides/making-yourself-admin',
        'guides/administering-your-server',
        'guides/admin-plugin',
        'guides/staff-roles',
        'guides/overriding-command-permissions',
        'guides/admins-and-permissions',
        'guides/role-only-commands',
        'api-reference/permissions',
        'api-reference/admin-api',
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
