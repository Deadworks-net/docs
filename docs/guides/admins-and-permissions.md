---
title: "How Permissions Work"
sidebar_label: "5. How Permissions Work"
---

# How Permissions Work

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

**Step 5 of 6** in [Admins & Permissions](/permissions). This is the full reference; the earlier guides cover everything most servers need.

Deadworks decides who can use which plugin commands with **roles** and **permissions**. Plugins say which permission each command needs; you decide who has it, without changing the plugin.

Commands that don't ask for a permission work for everyone. The server console can always run every command.

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
| `permissions` | Lists what the role can do. See [Writing Permissions](#writing-permissions). |
| `inherits` | Names other roles whose permissions this role also gets. See [How a Permission Is Decided](#how-a-permission-is-decided). |
| `immunity` | Protects holders from players with lower immunity. See [Immunity](#immunity). If left out, the role gets the highest immunity of the roles it inherits, or 0. |

The `default` role always applies to every player. Leave it empty if you don't want to give everyone anything. Role names ignore capitalization.

## Writing Permissions

| You write | It means |
|-----------|----------|
| `admin.moderation.ban` | Exactly that permission |
| `admin.moderation.*` | Everything under `admin.moderation.` (`admin.moderation.ban`, `admin.moderation.kick`, …) |
| `admin.*` | Everything from the Admin plugin |
| `*` | Everything |
| `-admin.moderation.ban` | **Not** that permission, even if a wildcard gives it |

Capitalization doesn't matter. A wildcard only works as the whole last part, and it stops at dots: `admin.*` does not match `admintools.nuke`.

Within one list, when several entries match, **the most specific one wins**: an exact permission beats a wildcard, `admin.moderation.*` beats `admin.*`, and `admin.*` beats `*`. If two are equally specific, a deny (`-`) wins. That's how `["*", "-admin.moderation.ban"]` means "everything except banning".

## How a Permission Is Decided

Deadworks answers "does this player have `admin.moderation.slay`?" in this order:

1. **The player's own entry** in `players.jsonc`. If anything in its `permissions` (grants or denies) matches, the most specific match decides, and their roles aren't looked at.
2. **Each of the player's roles, one at a time.** `default` counts as one of them; everyone has it. For each role:
   - The role's own `permissions` come first. If any of them match, the most specific one decides for that role, whatever it inherits.
   - If none match, the roles it `inherits` are checked the same way, nearer ones before farther ones. If it inherits several, it has the permission if any of them gives it.
3. **The player has the permission if any of their roles gives it.** A deny in one role never takes away what a different role gives.
4. If nothing matches anywhere, the answer is no.

So a role can always override what it inherits, and separate roles only ever add to each other:

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

`players.jsonc` lists players who have anything beyond `default`. Keys can be SteamID64, Steam2 or Steam3 IDs:

```jsonc
{
  "76561197960287930": {
    "name": "wisp",                              // a note for you
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
| `name` | Records a name for your reference. The [console commands](#console-commands) accept it to pick a player who isn't on the server, and fill it in when they first change an entry. |
| `roles` | Lists the roles this player holds. |
| `permissions` | Adds permissions (or `-denies`) for this player only. These are checked before any of their roles. |
| `immunity` | Replaces the immunity the player's roles would give them. |

A `null` list (`"roles": null`) counts as empty.

:::caution The console commands rewrite this file
`dw_role_grant`, `dw_role_revoke`, `dw_perm_grant` and `dw_perm_revoke` re-read `players.jsonc` before saving and only change that one player's entry. Other entries keep your hand edits and their keys as you wrote them (`STEAM_0:…`, `[U:1:…]`); the changed entry is written under its SteamID64, and removed if it's left with no roles, permissions or immunity. All comments are lost, and the file gets its standard header back.

If the file has an error, nothing is written and the command replies `Failed to save, so nothing changed: players.jsonc has an error. Fix it and run dw_perm_reload. (<reason>)`. If you've edited that player's entry by hand since the last reload, it replies `Failed to save, so nothing changed: players.jsonc was edited for this player since the last reload. Run dw_perm_reload, then try again.`

Use `--temp` if you only want a change until the next restart.
:::

## Immunity

Immunity stops lower-ranked staff from acting on higher-ranked staff. A player can't target someone whose immunity is **higher** than their own. With the bigger example in [Roles](#roles), a moderator (50) can't kick an admin (90), but two moderators can act on each other.

A player's immunity is the `immunity` on their player entry, if it has one. Otherwise it's the highest immunity among their roles, including `default`. A role without its own `immunity` takes the highest one among the roles it inherits. With nothing set anywhere, it's 0.

A player's immunity protects them from the moment they join. Until Steam has confirmed them (see [Steam Validation](#steam-validation)), though, they act with only the `default` role, so they can only target players whose immunity is no higher than `default`'s.

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
- A bare name like `"ban"` applies to every plugin's command of that name. To change one plugin's, write `"Plugin:command"`, e.g. `"Admin:ban"`. `Plugin` is the `"plugin"` name at the top of its generated file, or its DLL name (`AdminPlugin`). A plugin-qualified entry beats a bare one.
- The built-in commands (`dw_plugin`, `dw_reloadconfig`, `dw_help` and the `dw_perm_*`, `dw_role_*` and `dw_penalties_reload` commands [below](#console-commands)) can be overridden too, under the plugin name `Deadworks`, e.g. `"Deadworks:plugin": ""`. Think hard before opening up `perm_grant` or `role_grant`: that lets players hand out permissions.
- An override doesn't change whether a command respects [immunity](#immunity). A moderation command you make public still can't be used on staff with higher immunity.
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
      /* !kick / /kick / dw_kick: Kick a player: kick <player> [reason] */
      /* OVERRIDDEN in overrides.jsonc. The plugin asks for "admin.moderation.kick". */
      "name": "kick",
      "aliases": [],
      "description": "Kick a player: kick <player> [reason]",
      "permission": "my.custom.permission",
      "declaredPermission": "admin.moderation.kick",
      "targetImmunity": "Enforce"
    },
    {
      /* !ban / /ban / dw_ban (aliases: addban): Ban a player, or a SteamID online or not: ban <player|steamid> <minutes> [reason], 0 = permanent */
      "name": "ban",
      "aliases": [
        "addban"
      ],
      "description": "Ban a player, or a SteamID online or not: ban <player|steamid> <minutes> [reason], 0 = permanent",
      "permission": "admin.moderation.ban",
      "targetImmunity": "Enforce"
    }
    // ...
  ],
  "permissions": [
    {
      /* Required by: ban, bans */
      "tag": "admin.moderation.ban",
      "description": "",
      "declaredBy": [
        "ban",
        "bans"
      ]
    },
    // ...
    {
      /* Required by: kick */
      "tag": "admin.moderation.kick",
      "description": "",
      "declaredBy": [
        "kick"
      ]
    }
    // ...
  ]
}
```

- `permission` is what the command requires **on your server**, after `overrides.jsonc`. `""` means anyone can run it.
- `targetImmunity` is `Enforce` if the command respects [immunity](#immunity), `Ignore` if it doesn't.
- `permissions` lists every permission the plugin declares, sorted by name, including ones it only checks in code (those have `"[DeclarePermission]"` under `declaredBy`).
- Don't edit these files; make changes in `roles.jsonc`, `players.jsonc` or `overrides.jsonc`. Files for plugins you've removed are deleted on the next start.

`generated/deadworks.jsonc` lists the built-in commands and their permissions, under the plugin name `Deadworks`, plus `deadworks.admin.notify`, which isn't a command: it lets staff see which admin did something in admin-action announcements.

## Console Commands

These work from the server console. Players can use them from their own console if they have the permission shown.

Wherever a command takes `<player>`, you can give a SteamID in any format (online or not), `#slot` or part of the name of someone on the server, or the exact name saved for them in `players.jsonc` if they're not on. That's how you demote a moderator who's away: `dw_role_revoke greeny moderator`. If several saved players have that name, you're asked for a SteamID. A name with a space in it needs quotes: `dw_role_grant "Big Dave" admin`.

| Command | Permission | What it does |
|---------|------------|--------------|
| `dw_perm_reload` | `deadworks.permissions.reload` | Re-reads `roles.jsonc`, `players.jsonc` and `overrides.jsonc`. |
| `dw_role_list` | `deadworks.permissions.view` | Lists roles with their immunity and permissions. |
| `dw_perm_list <player>` | `deadworks.permissions.view` | Shows a player's roles, permissions and immunity. |
| `dw_perm_check <player> <command\|permission>` | `deadworks.permissions.view` | Shows whether a player can use a command (and which permission it needs) or has a permission, and which entry decided it. |
| `dw_role_grant <player> <role> [--temp]` | `deadworks.permissions.manage` | Gives a player a role. |
| `dw_role_revoke <player> <role> [--temp]` | `deadworks.permissions.manage` | Takes a role away from a player. |
| `dw_perm_grant <player> <permission> [--temp]` | `deadworks.permissions.manage` | Gives a player a permission. Use `-permission` to deny one. |
| `dw_perm_revoke <player> <permission> [--temp]` | `deadworks.permissions.manage` | Removes a permission (or deny) from a player's entry. |
| `dw_penalties_reload` | `deadworks.penalties.reload` | Re-reads bans, gags and mutes, e.g. after you edit `configs/penalties/penalties.jsonc` by hand. |
| `dw_plugin <list\|enable\|disable\|commands> [plugin]` | `deadworks.plugins.manage` | Lists, enables and disables plugins, or lists a plugin's commands. Only installed plugin names are accepted. |
| `dw_reloadconfig [plugin]` | `deadworks.config.reload` | Reloads plugin configs. |
| `dw_help` | none | Lists the commands you can run. |

Changes are saved to `players.jsonc` right away. Add `--temp` to make a change that only lasts until the server restarts; `dw_perm_list` then says `Has --temp changes that will be lost on restart.` A `--temp` revoke only takes away something the player has, saved or temporary. You can revoke a role even after it's been deleted from `roles.jsonc`, but you can only grant roles that exist.

When a player (not the server console) uses the grant and revoke commands, these rules apply. The quoted text is what they're told when a rule stops them.

| Rule | Message |
|------|---------|
| They can't change their own roles or permissions at all. | `You can't change your own roles or permissions.` |
| They can only change players whose immunity is **lower** than theirs; equal isn't enough. This uses the player's saved entry, even before Steam has confirmed them. | `You can't change <player> (<steamid>): you need higher immunity than theirs (<n>).` |
| To give a role, they must hold everything the role gives, including what it inherits. A role that denies something doesn't give it, so they don't need that. So a moderator can't make someone an admin. | `You can only give out roles whose permissions you hold. You don't hold: <grants>` |
| The role's immunity must be lower than theirs. | `You can't give out <role>: its immunity (<n>) isn't lower than yours (<m>).` |
| To give a permission, they must hold it. For a wildcard, they must hold everything it covers: a broader wildcard counts, and a deny anywhere in that range blocks it. Giving a deny (`-x`) needs nothing. | `You can only give out permissions you hold yourself.` |
| Removing a deny from someone counts as giving them that permission, so they must hold it. | `Removing -x would give <player> (<steamid>) x, which you don't hold yourself.` |
| With a [custom store](#custom-stores), the player's entry must have finished loading. | `<player> (<steamid>)'s permissions are still loading; try again in a moment.` |

So the players with the highest immunity on your server, usually the owners, can only be managed from the server console.

The reply comes once the change is saved, and only goes to the player who asked. If saving fails, you're told `Failed to save, so nothing changed: <reason>`, and the change isn't applied.

`dw_perm_check` is the quickest way to find out why someone can or can't do something. Give it a command's name (`dw_perm_check lapka ban`, with or without `!`, `/` or `dw_`) and it tells you which permission that command needs on your server, after [overrides](#changing-what-a-command-requires), and whether they have it. A permission no loaded plugin declares gets `(note: no loaded plugin declares ...; check the spelling)`, usually a typo; `dw_perm_grant` adds the same note when it gives one out.

For a player on the server, `dw_perm_check` shows what applies right now, so before Steam confirms them it reports only `default`. When the answer comes from an inherited role, it says which role inherits it:

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
| `role 'x' inherits unknown role 'y'` | `y` isn't in `roles.jsonc`. |
| `role 'x' inherits itself; the cycle is ignored` | Roles inherit each other in a loop. |
| `role 'x' is defined more than once (role names ignore case); using the last one` | Two roles differ only in capitalization. |
| `player <id> has unknown role 'x'` | That role isn't in `roles.jsonc`. |
| `players.jsonc: '<key>' is not a SteamID64, Steam2 or Steam3 ID; skipping` | The entry is ignored. |
| `players.jsonc: <key> is listed more than once; using the last entry` | Two keys are the same player. |
| `overrides.jsonc: '<key>' doesn't match any command. Check the name in generated/<Plugin>.jsonc.` | No loaded plugin has that command. |

The `player <id>: ...` and `player <id> has unknown role` warnings appear when that player's entry is loaded, which is when they join or a command looks them up. With the JSON store, the `no loaded plugin declares` check covers every player in `players.jsonc`; with a custom store, it covers players as they load.

Every file described here also warns about keys it doesn't know, with the closest real one, so a misspelled setting isn't silently ignored. The rest of the file still loads:

```text
[Permissions] WARNING: roles.jsonc: in 'moderator', 'immunty' (did you mean 'immunity'?) isn't a setting Deadworks knows, so it's ignored.
```

If `dw_perm_reload` or `dw_penalties_reload` fails, the reply says why (the file, and the line and column of the error), so staff without access to the server console can fix it.

Two more warnings are for plugin authors, when a plugin loads: `<Plugin> uses '<perm>'; by convention its permissions start with '<name>.'` and `<Plugin> uses '<perm>'; the deadworks.* namespace is reserved for core`.

A plugin's own typos show up too. The first time a plugin checks a permission that nothing declares, the console prints:

```text
[Permissions] A plugin checked 'medic.heal.other', which no loaded plugin declares. If it isn't a typo, list it with [DeclarePermission] so server owners can find it.
```

## Steam Validation

A player's roles and permissions apply only once Steam has confirmed their account, a few seconds after they join. Until then they have only the `default` role.

When a player connects, the server checks their Steam ticket and refuses the connection if the SteamID doesn't match it, as long as the server is logged into Steam. A few seconds later, Steam confirms that the ticket is still valid and the player is still signed in; if it isn't, the player is kicked (with the default `sv_steamauth_enforce 2`). The wait stops someone using a stolen or replayed Steam ticket to act as an admin before Steam turns it down.

- A map change doesn't reset the confirmation. Players keep their roles straight away on the next map.
- Immunity counts from the start, because it only protects: an admin who has just joined, or every admin while Steam is down, can't be targeted by someone with less.
- A player who tries a command before they're confirmed is told `You don't have permission to use this command yet: your roles apply once Steam has confirmed your account, a few seconds after joining.`
- `dw_perm_list` shows `Not validated by Steam yet: only "default" applies until then.`

While a player is waiting:

- Bans still apply. They're checked when the player connects, using the SteamID from their ticket, and again once Steam confirms them.
- Staff can kick or slay them, but not ban, gag or mute them. Trying gives `<name> hasn't been verified by Steam yet. Try again in a moment; if Steam is down, kick them, or ask someone at the server console.` The server console can ban, gag and mute them regardless, so the owner can still act during a Steam outage. `ban` on a SteamID that isn't on the server works as usual.

The wait is skipped when `sv_lan` is 1. Deadworks reads `sv_lan` once, soon after the server starts, and keeps that value until it restarts, so changing it later (with `cvar`, for example) has no effect. The console says `[Permissions] sv_lan is on, so players' roles apply without waiting for Steam. Changing sv_lan needs a restart to take effect here.`

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
With the wait turned off, a stolen or replayed Steam ticket gets that account's permissions. With `sv_lan 1`, or on a server that isn't logged into Steam, SteamIDs aren't checked at all, so anyone can claim an admin's SteamID and get their permissions.
:::

If your Deadworks native build is too old to report Steam confirmation, nobody's roles apply and the console prints `[Permissions] WARNING: this deadworks native build can't tell when Steam confirms a player, so nobody's roles apply. ...`. Update Deadworks, or set `require_steam_auth` to `false` on a private server only.

## Custom Stores

`store` in `configs/deadworks.jsonc` picks where roles and players come from. `json` is the files described on this page; a plugin can provide another store, such as a database. See [Custom Stores](../api-reference/permissions#custom-stores).

If `store` names a store that no plugin has registered, or its plugin unloads, **nobody has any permissions** until it's registered. Only the server console works, and the console warns about it (`dw_perm_list` and `dw_role_list` show the same line, starting with `Warning: `):

```text
[Permissions] WARNING: permissions.store is 'mysql', but no plugin has registered that store. Nobody has any permissions until one does; the server console still works.
```

The same happens if `configs/deadworks.jsonc` itself has an error (a missing quote, say; trailing commas and comments are fine), because then Deadworks can't tell which store you meant. Until you fix it and restart, nobody has any permissions, new players can't join because the ban list can't be checked, and the server isn't listed. The console says `[DeadworksConfig] ERROR: failed to parse deadworks.jsonc line ...`.

Deadworks doesn't fall back to the JSON files. If loading one player fails, they have only `default`, and Deadworks tries again at most every 30 seconds. While a player's entry is still loading, staff can't target them or change their roles, and `ban` can't target an offline SteamID whose entry hasn't loaded. When a player leaves, their entry is forgotten, so the store is read again the next time they join and picks up changes made elsewhere. A map change doesn't count as leaving.

## Next

**[6. Commands for One Role](role-only-commands)**: for plugin developers, a plugin whose commands only some players can use.
