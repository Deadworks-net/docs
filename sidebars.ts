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
        'guides/team-and-hero-management',
        'guides/chat-and-hud',
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
