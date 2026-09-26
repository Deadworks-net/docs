---
title: "Admins & Permissions"
sidebar_label: "Admins & Permissions"
---

# Admins & Permissions

Deadworks decides who can use which plugin commands with **roles** and **permissions**. Plugins say which permission each command needs; you decide who has it. You never need to change a plugin to do this.

Nothing is locked down until you set it up: commands that don't ask for a permission work for everyone, and the server console can always run everything.

## Make Yourself Admin

1. Start the server once. Deadworks creates `configs/permissions/` next to `managed/`:

   ```text
   game/bin/win64/configs/permissions/
     roles.jsonc       who can do what
     players.jsonc     who has which role
     overrides.jsonc   change what a command requires
     generated/        every plugin's commands and permissions (read-only)
   ```

2. Add your SteamID to `players.jsonc`:

   ```jsonc
   {
     "76561197960287930": { "roles": ["admin"] }
   }
   ```

   Any common SteamID format works: `76561197960287930`, `STEAM_0:0:11101` or `[U:1:22202]`. You can find yours with the `status` console command or a site like steamid.io.

3. Run `dw_perm_reload` in the server console, or restart.

The built-in `admin` role has `*`, which is every permission.

You can also do step 2 from the server console instead of editing the file:

```text
dw_role_grant 76561197960287930 admin
```

## Roles

Roles live in `roles.jsonc`. The default file is:

```jsonc
{
  "default": {
    "permissions": []
  },
  "admin": {
    "permissions": ["*"],
    "immunity": 100
  }
}
```

A bigger setup might look like this:

```jsonc
{
  // Everyone, whether they're listed in players.jsonc or not.
  "default": {
    "permissions": ["rtd.use"]
  },
  "vip": {
    "permissions": ["moderation.player.mute"]
  },
  "moderator": {
    "inherits": ["vip"],
    "permissions": ["moderation.player.*", "-moderation.player.ban"],
    "immunity": 50
  },
  "admin": {
    "permissions": ["*"],
    "immunity": 90
  }
}
```

| Field | Description |
|-------|-------------|
| `permissions` | What the role can do. See [Writing Permissions](#writing-permissions). |
| `inherits` | Other roles whose permissions this role also gets. |
| `immunity` | Protects holders from players with lower immunity. See [Immunity](#immunity). Not inherited. |

The `default` role always applies to every player. Leave it empty if you don't want to give everyone anything.

## Writing Permissions

| You write | It means |
|-----------|----------|
| `moderation.player.ban` | Exactly that permission |
| `moderation.player.*` | Everything under `moderation.player.` (`moderation.player.ban`, `moderation.player.kick`, …) |
| `moderation.*` | Everything from the Moderation plugin |
| `*` | Everything |
| `-moderation.player.ban` | **Not** that permission, even if a wildcard gives it |

Capitalization doesn't matter. Wildcards only work as the whole last part, and they stop at dots: `moderation.*` does not match `moderationtools.nuke`.

When several entries match, **the most specific one wins**:

- An exact permission beats a wildcard, and `moderation.player.*` beats `moderation.*`, which beats `*`.
- If two are equally specific, one given to the player directly beats one from a role.
- If it's still a tie, a deny (`-`) wins.

That's how `["*", "-moderation.player.ban"]` means "everything except banning", and how you can give one moderator a single extra permission.

If nothing matches, the answer is no.

## Players

`players.jsonc` lists players who have anything beyond `default`:

```jsonc
{
  "76561197960287930": {
    "name": "wisp",                              // a note for you; not used for matching
    "roles": ["admin"]
  },
  "STEAM_0:1:19999": {
    "roles": ["moderator"],
    "permissions": ["moderation.player.ban"],   // this moderator may also ban
    "immunity": 60                               // replaces what their roles give
  }
}
```

| Field | Description |
|-------|-------------|
| `name` | Optional note. |
| `roles` | Roles this player holds. |
| `permissions` | Extra permissions (or `-denies`) for this player only. |
| `immunity` | Replaces the immunity the player's roles would give them. |

:::caution The console commands rewrite this file
`dw_role_grant`, `dw_role_revoke`, `dw_perm_grant` and `dw_perm_revoke` save by rewriting `players.jsonc`. Only the comment block at the top of the file is kept. Other comments you added are lost. Use `--temp` if you only want a change until the next restart.
:::

## Immunity

Immunity stops lower-ranked staff from acting on higher-ranked staff. A player can't target someone whose immunity is **higher** than their own. With the roles above, a moderator (50) can't kick an admin (90), but two moderators can act on each other.

A player's immunity is the highest immunity among the roles assigned to them in `players.jsonc`. Roles they only get through `inherits` don't count. An `immunity` on the player entry replaces that. Everyone else has 0.

Immunity only matters when a command picks another player. Plugins choose which commands respect it; by default, commands that need a permission do and public commands (like a `!ping <player>`) don't. The server console ignores immunity.

## Changing What a Command Requires

`overrides.jsonc` changes the permission a command needs, for any plugin:

```jsonc
{
  "commands": {
    "rcon": "server.rcon",   // require a permission the plugin didn't ask for
    "rtd":  "",              // make the command public
    "ban":  "custom.bans"    // require a different permission
  }
}
```

- Use the command's name without `!`, `/` or `dw_`. One entry covers all of the command's aliases.
- This is how you lock down a command whose plugin didn't give it a permission.
- If two plugins register a command with the same name, the override applies to both.

## What Plugins Offer: the `generated` Folder

Each time a plugin loads, Deadworks writes `configs/permissions/generated/<Plugin>.jsonc` listing its commands and permissions:

```jsonc
// ============================================================================
//  AUTO-GENERATED. DO NOT EDIT. This file is rewritten every time the
//  "Moderation" plugin loads. Any changes you make here will be lost.
//  ...
// ============================================================================
{
  "plugin": "Moderation",

  "commands": [
    // !ban / /ban / dw_ban: Ban a player
    {
      "name": "ban",
      "aliases": [],
      "description": "Ban a player",
      "permission": "moderation.player.ban",
      "targetImmunity": "Enforce"
    },
    // !kick / /kick / dw_kick: Kick a player
    // OVERRIDDEN in overrides.jsonc. The plugin asks for "moderation.player.kick".
    {
      "name": "kick",
      "aliases": [],
      "description": "Kick a player",
      "permission": "my.custom.permission",
      "declaredPermission": "moderation.player.kick",
      "targetImmunity": "Enforce"
    }
  ],

  "permissions": [
    // Required by: ban
    { "tag": "moderation.player.ban", "description": "", "declaredBy": ["ban"] },
    // Checked in code. Issue bans with no expiry
    { "tag": "moderation.player.ban.permanent", "description": "Issue bans with no expiry", "declaredBy": ["[DeclarePermission]"] },
    // Required by: kick
    { "tag": "moderation.player.kick", "description": "", "declaredBy": ["kick"] }
  ]
}
```

- `permission` is what the command requires **on your server**, after `overrides.jsonc`.
- `permissions` lists everything the plugin checks, including permissions it checks in code rather than on a command.
- Don't edit these files; make changes in `roles.jsonc`, `players.jsonc` or `overrides.jsonc`. Files for plugins you've removed are deleted on the next start.

`generated/deadworks.jsonc` lists the built-in commands.

## Console Commands

These work from the server console. Players can use them from their own console if they have the permission shown.

| Command | Permission | What it does |
|---------|------------|--------------|
| `dw_perm_reload` | `deadworks.permissions.reload` | Re-read `roles.jsonc`, `players.jsonc` and `overrides.jsonc` |
| `dw_role_list` | `deadworks.permissions.view` | List roles with their immunity and permissions |
| `dw_perm_list <player>` | `deadworks.permissions.view` | Show a player's roles, permissions and immunity |
| `dw_perm_check <player> <permission>` | `deadworks.permissions.view` | Show whether a player has a permission, and which entry decided it |
| `dw_role_grant <player> <role> [--temp]` | `deadworks.permissions.manage` | Give a player a role |
| `dw_role_revoke <player> <role> [--temp]` | `deadworks.permissions.manage` | Take a role away |
| `dw_perm_grant <player> <permission> [--temp]` | `deadworks.permissions.manage` | Give a player a permission. Use `-permission` to deny one. |
| `dw_perm_revoke <player> <permission> [--temp]` | `deadworks.permissions.manage` | Remove a permission (or deny) from a player's entry |
| `dw_plugin ...` | `deadworks.plugins.manage` | List, enable and disable plugins |
| `dw_reloadconfig [plugin]` | `deadworks.config.reload` | Reload plugin configs |

`<player>` is a SteamID in any format, which also works for players who aren't online, or an online player's `#slot` or part of their name.

Changes are saved to `players.jsonc` right away. Add `--temp` to make a change that only lasts until the server restarts.

When a player (not the server console) uses the grant and revoke commands:

- they can't change anyone with higher immunity than their own, and
- they can only give out roles and permissions they hold themselves, so a moderator can't make someone an admin.

`dw_perm_check` is the quickest way to find out why someone can or can't do something:

```text
] dw_perm_check lapka moderation.player.ban
lapka (76561197960287931): moderation.player.ban is denied by "-moderation.player.ban" from role:moderator
```

`dw_help` only lists commands the caller is allowed to run.

## Steam Validation

A player's roles and permissions only apply once Steam has confirmed who they are, a moment after they connect. Until then they only have the `default` role. This stops someone from connecting with a faked SteamID to borrow an admin's permissions.

On a LAN server or when testing locally, Steam may never confirm players. You can turn the check off in `configs/deadworks.jsonc`:

```jsonc
{
  "permissions": {
    "store": "json",
    "require_steam_auth": false
  }
}
```

Leave it on for any server that's reachable from the internet.

`store` picks where roles and players come from. `json` is the files described on this page; a plugin can provide another store, such as a database. See [Custom Stores](../api-reference/permissions#custom-stores).

## See Also

- [Permissions](../api-reference/permissions) — Adding permissions to your own plugin
- [Server Hosting](server-hosting) — Running a server
