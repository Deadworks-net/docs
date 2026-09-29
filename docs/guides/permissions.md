---
title: "How Permissions Work"
sidebar_label: "How Permissions Work"
---

# How Permissions Work

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

The full reference. For a quick setup, see [Setting Up Admins](setting-up-admins).

Plugins say which **permission** each command needs. You decide who has it, with **roles**. You never need to change a plugin to do this, and nothing is locked down until you do: commands that don't ask for a permission work for everyone, and the server console can run everything.

Everything lives in `game/bin/win64/configs/permissions/`:

| File | |
|------|---|
| `roles.jsonc` | What each role can do |
| `players.jsonc` | Who holds which roles |
| `overrides.jsonc` | Change what a command requires |
| `generated/` | Every plugin's commands and permissions, for reading only |

Run `dw_perm_reload` after editing them.

## Roles

```jsonc
{
  "default": {                      // every player has this role
    "permissions": ["rtd.use"]
  },
  "moderator": {
    "permissions": ["admin.moderation.*", "-admin.moderation.ban"],
    "immunity": 50
  },
  "admin": {
    "inherits": ["moderator"],
    "permissions": ["admin.server.*"],
    "immunity": 90
  }
}
```

| Field | |
|-------|---|
| `permissions` | What the role can do |
| `inherits` | Roles whose permissions this one also gets |
| `immunity` | See [Immunity](#immunity). Left out, it's the highest of the roles it inherits, or 0. |

## Players

```jsonc
{
  "76561197960287930": {
    "name": "wisp",                          // a note for you; never used for matching
    "roles": ["admin"]
  },
  "STEAM_0:1:19999": {
    "roles": ["moderator"],
    "permissions": ["admin.server.map"],   // extras or -denies for this player only
    "immunity": 60                           // replaces what their roles give
  }
}
```

The `dw_role_*` and `dw_perm_*` commands below rewrite this file. Hand edits to entries are kept, but comments other than the header at the top are lost.

## Writing Permissions

| You write | It means |
|-----------|----------|
| `admin.moderation.ban` | That permission |
| `admin.moderation.*` | Everything starting `admin.moderation.` |
| `*` | Everything, including plugins you install later |
| `-admin.moderation.ban` | **Not** that permission |

Capitalization doesn't matter. Wildcards only go at the end and stop at dots: `admin.*` doesn't match `admintools.kick`.

## How a Check Is Decided

1. **The player's own permissions come first.** If any match, the most specific one decides: an exact name beats `a.b.*`, which beats `a.*`, which beats `*`. On a tie, a deny wins.
2. **Otherwise each role decides for itself** the same way, looking at its own permissions first and then the roles it inherits. **If any role allows it, it's allowed.**
3. If nothing matches, it's not allowed.

So a deny in a role only limits that role. `"-admin.moderation.ban"` in `moderator` stops moderators banning, but an admin who inherits `moderator` and also has `admin.moderation.*` still can, and so can a moderator who also holds another role that allows it. To take a permission away from one person whatever their roles, put the deny on their player entry:

```text
dw_perm_grant lapka -admin.moderation.ban
```

## Immunity

Immunity stops staff acting on higher-ranked staff. You can't target a player whose immunity is higher than yours, so a moderator (50) can't kick an admin (90), but two moderators can act on each other. Everyone else has 0, and the server console can target anyone.

A player's immunity is the highest of their roles', unless their player entry sets one. It only matters when a command picks another player, and it never stops a command from running.

Plugins decide which commands respect it. By default, commands that need a permission do and public ones (a `!stats <player>`) don't. Making a command public in `overrides.jsonc` doesn't turn it off.

## Changing What a Command Requires

`overrides.jsonc` changes the permission any plugin's command needs:

```jsonc
{
  "commands": {
    "givesouls":  "itemtest.cheats",   // lock a command the plugin left open
    "ir_start":   "",                  // open a locked command to everyone
    "ban":        "custom.bans",       // require a different permission
    "Admin:kick": "custom.kick"        // only the Admin plugin's kick
  }
}
```

- Use the command's name, without `!`, `/` or `dw_`. One entry covers all its aliases.
- A plain name applies to that command in every plugin. `Plugin:command` picks one, using the `"plugin"` name at the top of its generated file (or its DLL name), and beats a plain entry. Built-in commands belong to `Deadworks`, e.g. `Deadworks:plugin`.
- The permission can be one you've made up. Give it to a role like any other.
- To open a command but still be able to block one player, don't set it to `""`. Give its permission to the `default` role instead, then deny it on that player.
- Commands marked **Server console only** can't be opened to players.
- Delete the line and `dw_perm_reload` to go back to what the plugin chose.

## The `generated` Folder

Each time a plugin loads, Deadworks writes `generated/<Plugin>.jsonc`, listing its commands and every permission it checks. `generated/deadworks.jsonc` covers the built-in commands.

```jsonc
{
  /* !kick / /kick / dw_kick: Kick a player: kick <player> [reason] */
  /* OVERRIDDEN in overrides.jsonc. The plugin asks for "admin.moderation.kick". */
  "name": "kick",
  "aliases": [],
  "description": "Kick a player: kick <player> [reason]",
  "permission": "custom.kick",
  "declaredPermission": "admin.moderation.kick",
  "targetImmunity": "Enforce"
}
```

`permission` is what the command needs on your server, after overrides. An empty one says `Anyone can run it.` Don't edit these files: they're rewritten on every load, and deleted when their plugin is removed.

## Console Commands

| Command | Permission | |
|---------|------------|---|
| `dw_perm_reload` | `deadworks.permissions.reload` | Re-read `roles.jsonc`, `players.jsonc` and `overrides.jsonc` |
| `dw_role_list` | `deadworks.permissions.view` | Every role with its immunity and permissions |
| `dw_perm_list <player>` | `deadworks.permissions.view` | A player's roles, permissions and immunity |
| `dw_perm_check <player> <command\|permission>` | `deadworks.permissions.view` | Whether they can use it, and which entry decided |
| `dw_role_grant <player> <role> [--temp]` | `deadworks.permissions.manage` | Give a role |
| `dw_role_revoke <player> <role> [--temp]` | `deadworks.permissions.manage` | Take a role away |
| `dw_perm_grant <player> <permission> [--temp]` | `deadworks.permissions.manage` | Give a permission, or `-permission` to deny one |
| `dw_perm_revoke <player> <permission> [--temp]` | `deadworks.permissions.manage` | Remove a permission or deny from their entry |
| `dw_penalties_reload` | `deadworks.penalties.reload` | Re-read bans, gags and mutes |
| `dw_plugin <list\|enable\|disable\|commands> [plugin]` | `deadworks.plugins.manage` | Manage plugins |
| `dw_reloadconfig [plugin]` | `deadworks.config.reload` | Reload plugin configs |
| `dw_help` | anyone | The commands you can use |

`<player>` is part of a name, `#slot`, or a SteamID in any format. For someone who isn't on the server, use their SteamID or the name saved in `players.jsonc`. Changes save immediately; `--temp` ones last until the server restarts. `deadworks.admin.notify` isn't a command: it shows [who did an admin action](admin-commands#what-everyone-sees).

When a player rather than the server console uses the grant and revoke commands:

- they can't change themselves, or anyone whose immunity isn't lower than theirs,
- they can only hand out permissions they hold, and roles whose permissions they hold and whose immunity is lower than theirs.

## Steam Validation

A player's roles only apply once Steam has confirmed who they are, a few seconds after they connect. Until then they only have `default`, so nobody can borrow an admin's permissions with a faked SteamID. Their immunity protects them from the start.

On a LAN server, or when testing offline, Steam may never confirm anyone. Turn `sv_lan` on, or turn the check off in `configs/deadworks.jsonc` and restart:

```jsonc
"permissions": {
  "store": "json",             // where roles and players come from; a plugin can add a database store
  "require_steam_auth": false  // never on a server reachable from the internet
}
```

## When a File Has an Error

Deadworks fails safe and tells you where the mistake is, by file, line and column:

- **`roles.jsonc` or `players.jsonc`** on `dw_perm_reload`: the previous settings stay in use.
- **`overrides.jsonc`** at startup: players can't run any commands until it's fixed, since any of them might have been locked there.
- **`deadworks.jsonc`**: nobody has any permissions, new players can't join (the ban list can't be checked) and the server is unlisted, until it's fixed and the server restarted.

The server console works throughout. Keys Deadworks doesn't recognise, usually typos, are reported as warnings.
