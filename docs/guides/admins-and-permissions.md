---
title: "How Permissions Work"
sidebar_label: "6. How Permissions Work"
---

# How Permissions Work

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

**Step 6 of 7** in [Admins & Permissions](/permissions). This is the full reference; the earlier guides cover everything most servers need.

Deadworks decides who can use which plugin commands with **roles** and **permissions**. Plugins say which permission each command needs; you decide who has it. You never need to change a plugin to do this.

Nothing is locked down until you set it up: commands that don't ask for a permission work for everyone, and the server console can always run everything.

## Files at a Glance

Deadworks keeps everything in `game/bin/win64/configs/permissions/`:

```text
roles.jsonc       who can do what
players.jsonc     who has which role
overrides.jsonc   change what a command requires
generated/        every plugin's commands and permissions (read-only)
```

New to this? Start with [1. Make Yourself Admin](making-yourself-admin); this page explains the rules in full.

## Roles

Roles live in `roles.jsonc`. The default file is:

```jsonc
// Roles for the Deadworks permission system. ...
{
  "default": {
    "permissions": []
  },
  "admin": {
    "permissions": [
      "*"
    ],
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
    "permissions": ["admin.moderation.who"]
  },
  "moderator": {
    "inherits": ["vip"],
    "permissions": ["admin.moderation.*", "-admin.moderation.ban"],
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
| `inherits` | Other roles whose permissions this role also gets. See [How a Permission Is Decided](#how-a-permission-is-decided). |
| `immunity` | Protects holders from players with lower immunity. See [Immunity](#immunity). If left out, the role gets the highest immunity of the roles it inherits. |

The `default` role always applies to every player. Leave it empty if you don't want to give everyone anything.

## Writing Permissions

| You write | It means |
|-----------|----------|
| `admin.moderation.ban` | Exactly that permission |
| `admin.moderation.*` | Everything under `admin.moderation.` (`admin.moderation.ban`, `admin.moderation.kick`, …) |
| `admin.*` | Everything from the Admin plugin |
| `*` | Everything |
| `-admin.moderation.ban` | **Not** that permission, even if a wildcard gives it |

Capitalization doesn't matter. Wildcards only work as the whole last part, and they stop at dots: `admin.*` does not match `admintools.nuke`.

Within one list, when several entries match, **the most specific one wins**: an exact permission beats a wildcard, `admin.moderation.*` beats `admin.*`, and `admin.*` beats `*`. If two are equally specific, a deny (`-`) wins. That's how `["*", "-admin.moderation.ban"]` means "everything except banning".

## How a Permission Is Decided

Deadworks answers "does this player have `admin.moderation.slay`?" in this order:

1. **The player's own entry** in `players.jsonc`. If anything in its `permissions` (grants or denies) matches, the most specific match decides, and their roles aren't looked at.
2. **Each of the player's roles, one at a time.** `default` counts as one of them; everyone has it. For each role:
   - The role's own `permissions` come first. If any of them match, the most specific one decides for that role, whatever it inherits.
   - If none match, the roles it `inherits` are checked the same way, nearer ones before farther ones. If it inherits several, it has the permission if any of them gives it.
3. **The player has the permission if any of their roles gives it.** A deny in one role never takes away what a different role gives.
4. If nothing matches anywhere, the answer is no.

In practice, a role can always override what it inherits, and separate roles only ever add to each other:

```jsonc
"moderator": {
  "permissions": ["admin.moderation.*", "-admin.moderation.slay"]
},
"senior": {
  "inherits": ["moderator"],
  "permissions": ["admin.moderation.slay"]   // senior mods CAN slay
},
"admin": {
  "inherits": ["senior"],
  "permissions": ["*"]                       // admins can do everything
}
```

A player with the roles `trial` and `eventhost`, where `eventhost` has `admin.server.map` and `trial` has `-admin.server.map`, **can** change map: `eventhost` gives it, and `trial`'s deny only applies within `trial`. To take something away from one player whatever their roles, put the deny on their player entry:

```text
dw_perm_grant lapka -admin.server.map
```

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
    "permissions": ["admin.moderation.ban"],   // this moderator may also ban
    "immunity": 60                               // replaces what their roles give
  }
}
```

| Field | Description |
|-------|-------------|
| `name` | Optional note. |
| `roles` | Roles this player holds. |
| `permissions` | Extra permissions (or `-denies`) for this player only. These are checked before any of their roles. |
| `immunity` | Replaces the immunity the player's roles would give them. |

A `null` list (`"roles": null`) counts as empty.

:::caution The console commands rewrite this file
`dw_role_grant`, `dw_role_revoke`, `dw_perm_grant` and `dw_perm_revoke` re-read `players.jsonc` before saving and only change that one player's entry. Edits you've made by hand since the last reload are kept, and other entries keep their keys as you wrote them (`STEAM_0:…`, `[U:1:…]`). Comments are lost, though, apart from the block at the top of the file.

If the file has an error, nothing is written and the command replies `Failed to save, so nothing changed: players.jsonc has an error, so it wasn't changed. Fix it and run dw_perm_reload. (<reason>)`

Use `--temp` if you only want a change until the next restart.
:::

## Immunity

Immunity stops lower-ranked staff from acting on higher-ranked staff. A player can't target someone whose immunity is **higher** than their own. With the bigger example in [Roles](#roles), a moderator (50) can't kick an admin (90), but two moderators can act on each other.

A player's immunity is the `immunity` on their player entry, if it has one. Otherwise it's the highest immunity among their roles, including `default`. A role without its own `immunity` takes the highest one among the roles it inherits. With nothing set anywhere, it's 0.

Until Steam has confirmed a player (see [Steam Validation](#steam-validation)), they have only the `default` role, so their immunity is `default`'s: 0 unless you give `default` one.

Immunity only matters when a command picks another player. Plugins choose which commands respect it; by default, commands that need a permission do and public commands (like a `!ping <player>`) don't. The server console ignores immunity.

## Changing What a Command Requires

`overrides.jsonc` changes the permission a command needs, for any plugin:

```jsonc
{
  "commands": {
    "givesouls": "itemtest.cheats",   // require a permission the plugin didn't ask for
    "rtd":       "",                  // make the command public
    "ban":       "custom.bans"        // require a different permission
  }
}
```

- Use the command's name without `!`, `/` or `dw_`. One entry covers all of the command's aliases.
- This is how you lock down a command whose plugin didn't give it a permission.
- A bare name like `"ban"` applies to every plugin's command of that name. To change just one plugin's, write `"Plugin:command"`, e.g. `"Admin:ban"`. `Plugin` is the `"plugin"` name at the top of its generated file, or its DLL name (`AdminPlugin`). A plugin-qualified entry beats a bare one.
- The built-in commands (`dw_plugin`, `dw_reloadconfig`, `dw_help` and the `dw_perm_*` and `dw_role_*` commands [below](#console-commands)) can be overridden too, under the plugin name `Deadworks`, e.g. `"Deadworks:plugin": ""`. Think hard before opening up `perm_grant` or `role_grant`: that lets players hand out permissions.
- An entry that matches no command is reported in the server console at startup and on `dw_perm_reload`.
- **If `overrides.jsonc` can't be read at startup, players can't run any command** until you fix it and run `dw_perm_reload`; the server console still can. Players see `Commands are unavailable until the server fixes an error in its permission settings.` If the file breaks later, `dw_perm_reload` fails and the previous overrides stay in use.
- For a step-by-step walkthrough, see [Changing Who Can Use a Plugin's Commands](overriding-command-permissions).

## What Plugins Offer: the `generated` Folder

Each time a plugin loads, Deadworks writes `configs/permissions/generated/<DLL name>.jsonc` listing its commands and permissions. Part of the Admin plugin's file, `generated/AdminPlugin.jsonc`, with `kick` overridden, looks like this:

```jsonc
// ============================================================================
//  AUTO-GENERATED. DO NOT EDIT. This file is rewritten every time the
//  "Admin" plugin loads. Any changes you make here will be lost.
//  ...
// ============================================================================
{
  "plugin": "Admin",
  "commands": [
    {
      /* !ban / /ban / dw_ban: Ban a player: ban <player> <minutes> [reason], 0 = permanent */
      "name": "ban",
      "aliases": [],
      "description": "Ban a player: ban <player> <minutes> [reason], 0 = permanent",
      "permission": "admin.moderation.ban",
      "targetImmunity": "Enforce"
    },
    {
      /* !kick / /kick / dw_kick: Kick a player: kick <player> [reason] */
      /* OVERRIDDEN in overrides.jsonc. The plugin asks for "admin.moderation.kick". */
      "name": "kick",
      "aliases": [],
      "description": "Kick a player: kick <player> [reason]",
      "permission": "my.custom.permission",
      "declaredPermission": "admin.moderation.kick",
      "targetImmunity": "Enforce"
    }
  ],
  "permissions": [
    {
      /* Required by: ban, addban, bans */
      "tag": "admin.moderation.ban",
      "description": "",
      "declaredBy": [
        "ban",
        "addban",
        "bans"
      ]
    },
    {
      /* Required by: kick */
      "tag": "admin.moderation.kick",
      "description": "",
      "declaredBy": [
        "kick"
      ]
    }
  ]
}
```

- `permission` is what the command requires **on your server**, after `overrides.jsonc`.
- `permissions` lists everything the plugin checks, sorted by name, including permissions it only checks in code (those have `"[DeclarePermission]"` under `declaredBy`).
- Don't edit these files; make changes in `roles.jsonc`, `players.jsonc` or `overrides.jsonc`. Files for plugins you've removed are deleted on the next start.

`generated/deadworks.jsonc` lists the built-in commands and their permissions, under the plugin name `Deadworks`, plus `deadworks.admin.notify`, which isn't a command: it lets staff see who did an admin action. (A plugin whose DLL is itself called `deadworks` gets `deadworks-plugin.jsonc`.)

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
| `dw_penalties_reload` | `deadworks.penalties.reload` | Re-read `configs/penalties/penalties.jsonc` after editing it by hand |
| `dw_plugin ...` | `deadworks.plugins.manage` | List, enable and disable plugins. Only installed plugin names are accepted. |
| `dw_reloadconfig [plugin]` | `deadworks.config.reload` | Reload plugin configs |
| `dw_help` | none | List the commands you can run |

`<player>` is a SteamID in any format, which also works for players who aren't online, or an online player's `#slot` or part of their name.

Changes are saved to `players.jsonc` right away. Add `--temp` to make a change that only lasts until the server restarts; `dw_perm_list` then says `Has --temp changes that will be lost on restart.` You can revoke a role even after it's been deleted from `roles.jsonc`, but you can only grant roles that exist.

When a player (not the server console) uses the grant and revoke commands, these rules apply. The quoted text is what they're told when a rule stops them.

| Rule | Message |
|------|---------|
| They can't change their own roles or permissions at all. | `You can't change your own roles or permissions.` |
| They can only change players whose immunity is **lower** than theirs; equal isn't enough. This uses the player's saved entry, even before Steam has confirmed them. | `You can't change <player> (<steamid>): you need higher immunity than theirs (<n>).` |
| To give a role, they must hold everything the role gives, including what it inherits. A role that denies something doesn't give it, so they don't need that. So a moderator can't make someone an admin. | `You can only give out roles whose permissions you hold. You don't hold: <grants>` |
| The role's immunity must be lower than theirs. | `You can't give out <role>: its immunity (<n>) isn't lower than yours (<m>).` |
| To give a permission, they must hold it. For a wildcard, they must hold everything it covers: a broader wildcard counts, and a deny anywhere in that range blocks it. | |
| Removing a deny from someone counts as giving them that permission, so they must hold it. | `Removing -x would give <player> (<steamid>) x, which you don't hold yourself.` |
| With a [custom store](#custom-stores), the player's entry must have finished loading. | `<player>'s permissions are still loading; try again in a moment.` (`That player's permissions are still loading; try again in a moment.` for `--temp`) |

So the players with the highest immunity on your server, usually the owners, can only be managed from the server console.

The reply comes once the change is saved, and only goes to the player who asked. If saving fails, you're told `Failed to save, so nothing changed: <reason>`, and the change isn't applied.

`dw_perm_check` is the quickest way to find out why someone can or can't do something. For an online player it shows what applies right now, so before Steam confirms them it reports only `default`. When the answer comes from an inherited role, it says which role inherits it:

```text
] dw_perm_check lapka admin.moderation.ban
lapka (76561197960287931): admin.moderation.ban is denied by "-admin.moderation.ban" from role:moderator

] dw_perm_check greeny admin.moderation.slay
greeny (76561197960287932): admin.moderation.slay is allowed by "admin.moderation.slay" from role:senior

] dw_perm_check greeny admin.moderation.kick
greeny (76561197960287932): admin.moderation.kick is allowed by "admin.moderation.*" from role:moderator (via senior)
```

`dw_help` only lists commands the caller is allowed to run.

## Warnings in the Console

After startup and on every `dw_perm_reload`, the server console checks your files and prints anything that looks wrong, starting with `[Permissions]`:

| Warning | What it means |
|---------|---------------|
| `role 'x': 'admin..ban' is not a valid permission (use a.b.c, a.b.* or *)` | The entry is **ignored**, so a mistyped deny denies nothing. Also `player <id>: ...` |
| `role 'x' has 'admin.moderation.bna', which no loaded plugin declares (a typo, or a plugin that isn't installed?)` | Nothing uses that permission. Also `player <id> has ...` |
| `role 'x' inherits unknown role 'y'` | `y` isn't in `roles.jsonc` |
| `role 'x' inherits itself; the cycle is ignored` | Roles inherit each other in a loop |
| `role 'x' is defined more than once (role names ignore case); using the last one` | Two roles differ only in capitalization |
| `player <id> has unknown role 'x'` | That role isn't in `roles.jsonc` |
| `players.jsonc: '<key>' is not a SteamID64, Steam2 or Steam3 ID; skipping` | The entry is ignored |
| `players.jsonc: <key> is listed more than once; using the last entry` | Two keys are the same player |
| `overrides.jsonc: '<key>' doesn't match any command. Check the name in generated/<Plugin>.jsonc.` | No loaded plugin has that command |

With the JSON store, every player in `players.jsonc` is checked. With a custom store, players are checked as they load.

Two more warnings are for plugin authors, when a plugin loads: `<Plugin> uses '<perm>'; by convention its permissions start with '<name>.'` and `<Plugin> uses '<perm>'; the deadworks.* namespace is reserved for core`.

A plugin's own typos show up too. The first time a plugin checks a permission that nothing declares, the console prints:

```text
A plugin checked 'medic.heal.other', which no loaded plugin declares. If it isn't a typo, list it with [DeclarePermission] so server owners can find it.
```

## Steam Validation

When a player connects, the engine checks their Steam ticket and refuses the connection if the SteamID doesn't match it. So a made-up SteamID is turned away at the door, as long as your server is logged into Steam. A few seconds later, Steam's servers confirm the ticket is still valid and the player is still signed in. If not, the engine kicks them (straight away, with the default `sv_steamauth_enforce 2`).

A player's roles and permissions only apply once Steam has confirmed them. That happens once per connection: after a map change, players keep their roles straight away, because the engine keeps their confirmation. Until then they have only the `default` role (and its immunity, 0 unless you gave `default` one). This stops someone using a stolen or replayed Steam ticket to act as an admin during those first seconds, or for good on a server with `sv_steamauth_enforce 0`. SourceMod, CounterStrikeSharp and CS2Fixes work the same way.

While a player is waiting:

- Bans still apply. They're checked when the player connects, using the SteamID from their ticket, and again once Steam confirms them.
- Staff can kick or slay them, but not ban, gag or mute them. Trying gives `<name> hasn't been verified by Steam yet. Try again in a moment.` `addban` on a SteamID that isn't on the server works as usual.

The wait is skipped automatically when `sv_lan` is 1. Deadworks reads `sv_lan` once, when the first player connects, and keeps that until the server restarts, so nobody can switch the wait off with `cvar`. The console says `[Permissions] sv_lan is on, so players' roles apply without waiting for Steam. Changing sv_lan needs a restart to take effect here.`

You can also turn the wait off in `configs/deadworks.jsonc`:

```jsonc
{
  "permissions": {
    "store": "json",
    "require_steam_auth": false
  }
}
```

:::danger Only for servers nobody untrusted can reach
A server that isn't logged into Steam doesn't check SteamIDs at all. With the wait turned off, by `require_steam_auth: false` or by `sv_lan 1`, anyone can claim any SteamID, including an admin's, and get their permissions.
:::

If your Deadworks native build is too old to report Steam confirmation, nobody's roles apply and the console prints a warning. Update Deadworks, or set `require_steam_auth` to `false` on a private server only.

## Custom Stores

`store` picks where roles and players come from. `json` is the files described on this page; a plugin can provide another store, such as a database. See [Custom Stores](../api-reference/permissions#custom-stores).

If `store` names a store that no plugin has registered, or its plugin unloads, **nobody has any permissions** until it's registered. Only the server console works, and the console warns about it (`dw_perm_list` shows the same line, starting with `Warning: `):

```text
permissions.store is 'mysql', but no plugin has registered that store. Nobody has any permissions until one does; the server console still works.
```

Deadworks doesn't fall back to the JSON files. If loading one player fails, they have only `default`, and Deadworks tries again at most every 30 seconds. While a player's entry is still loading, staff can't target them or change their roles, and `addban` can't target an offline SteamID whose entry hasn't loaded. When a player leaves, their entry is forgotten, so the store is read again the next time they join and picks up changes made elsewhere. A map change doesn't count as leaving.

## Next

**[7. Commands for One Role](role-only-commands)**: for plugin developers, a plugin whose commands only some players can use.
