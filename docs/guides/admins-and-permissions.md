---
title: "How Permissions Work"
sidebar_label: "3. How Permissions Work"
---

# How Permissions Work

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

**Step 3 of 4** in [Admins & Permissions](/permissions). A reference for the permission files and commands.

Plugins say which **permission** each command needs; you decide who has it with **roles**. Commands that don't need a permission work for everyone, and the server console can always run everything.

## Files

Everything is in `game/bin/win64/configs/permissions/`. Run `dw_perm_reload` after editing.

| File | What it's for |
|------|---------------|
| `roles.jsonc` | What each role can do |
| `players.jsonc` | Which players hold which roles |
| `overrides.jsonc` | Changes what a command requires |
| `generated/` | Every plugin's commands and permissions. Read-only: rewritten when the plugin loads. |

## roles.jsonc

```jsonc
{
  "default": {
    "permissions": []
  },
  "moderator": {
    "permissions": ["admin.moderation.*", "-admin.moderation.ban"],
    "immunity": 50
  },
  "admin": {
    "permissions": ["*"],
    "immunity": 100
  }
}
```

| Field | Description |
|-------|-------------|
| `permissions` | What the role can do. See [Writing Permissions](#writing-permissions). |
| `inherits` | Other roles whose permissions this role also gets, e.g. `["moderator"]` |
| `immunity` | See [Immunity](#immunity). Defaults to the highest of the roles it inherits, or 0. |

Every player has the `default` role.

### Writing Permissions

| You write | It means |
|-----------|----------|
| `admin.moderation.ban` | That permission |
| `admin.moderation.*` | Everything starting with `admin.moderation.` |
| `*` | Everything |
| `-admin.moderation.ban` | **Not** that permission |

The most specific entry wins, so `["*", "-admin.moderation.ban"]` means everything except banning.

### Immunity

A player can't target anyone with **higher** immunity than their own, so a moderator (50) can't kick an admin (100). A player's immunity is the highest of their roles'.

## players.jsonc

```jsonc
{
  "76561197960287930": {
    "name": "wisp",
    "roles": ["admin"]
  },
  "76561197960287931": {
    "name": "lapka",
    "roles": ["moderator"],
    "permissions": ["admin.moderation.ban"],
    "immunity": 60
  }
}
```

Each key is a SteamID (SteamID64, `STEAM_0:…` or `[U:1:…]`).

| Field | Description |
|-------|-------------|
| `name` | A note for you. The console commands accept it for players who aren't on the server. |
| `roles` | Roles the player holds |
| `permissions` | Extra permissions, or `-denies`, for this player only. These beat their roles. |
| `immunity` | Replaces the immunity their roles give |

## overrides.jsonc

```jsonc
{
  "commands": {
    "givesouls":  "itemtest.cheats",   // require a permission
    "rtd":        "",                  // anyone can use it
    "Admin:kick": "custom.kick"        // only the Admin plugin's kick
  }
}
```

## deadworks.jsonc

In `configs/deadworks.jsonc`:

```jsonc
"permissions": {
  "store": "json",
  "require_steam_auth": true
}
```

| Field | Description |
|-------|-------------|
| `store` | Where roles and players come from. `json` is the files on this page; a plugin can add another, such as a database. |
| `require_steam_auth` | A player's roles only apply once Steam confirms their account, a few seconds after they join; until then they only have `default`, so nobody can fake an admin's SteamID. On a LAN server, set this to `false` and restart, or set `sv_lan 1`, to skip the wait. Never do either on a server reachable from the internet. |

## Console Commands

These work in the server console, and in a player's console if they have the permission.

`<player>` can be part of a name, `#slot`, a SteamID, or the name saved in `players.jsonc`.

| Command | Permission | What it does |
|---------|------------|--------------|
| `dw_perm_reload` | `deadworks.permissions.reload` | Reloads the permission files |
| `dw_role_list` | `deadworks.permissions.view` | Lists roles |
| `dw_perm_list <player>` | `deadworks.permissions.view` | Shows a player's roles, permissions and immunity |
| `dw_perm_check <player> <command\|permission>` | `deadworks.permissions.view` | Shows whether a player can use a command or has a permission, and why |
| `dw_role_grant <player> <role> [--temp]` | `deadworks.permissions.manage` | Gives a player a role |
| `dw_role_revoke <player> <role> [--temp]` | `deadworks.permissions.manage` | Takes a role away |
| `dw_perm_grant <player> <permission> [--temp]` | `deadworks.permissions.manage` | Gives a player a permission, or `-permission` to deny one |
| `dw_perm_revoke <player> <permission> [--temp]` | `deadworks.permissions.manage` | Removes a permission or deny from a player |
| `dw_penalties_reload` | `deadworks.penalties.reload` | Reloads bans, gags and mutes |
| `dw_plugin <list\|enable\|disable\|commands> [plugin]` | `deadworks.plugins.manage` | Manages plugins |
| `dw_reloadconfig [plugin]` | `deadworks.config.reload` | Reloads plugin configs |
| `dw_help` | none | Lists the commands you can use |

Players using the grant and revoke commands can only change players with lower immunity than theirs, and can only give out roles and permissions they hold themselves.

## Next

**[4. Setting Up Staff Roles](staff-roles)**: give other people some of the admin commands.
