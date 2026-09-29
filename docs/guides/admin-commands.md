---
title: "Admin Commands"
sidebar_label: "Admin Commands"
---

# Admin Commands

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

Deadworks ships with an **Admin** plugin for running a match: kick, ban, gag, mute, change map and so on. It's on by default and does nothing for players without its permissions. To give yourself access, see [Setting Up Admins](setting-up-admins).

## Typing Commands

Every command works as `!kick` or `/kick` in chat, or `dw_kick` in your game console or the server console. Admin commands never show in public chat. Commands that print a list (`who`, `bans`, `penalties`, `map` on its own) print it in your console.

`dw_help` lists the commands you're allowed to use.

## Picking Players

| You type | It means |
|----------|----------|
| `lapka`, `lap` | The player whose name matches. If several do, you're shown them and nothing happens. |
| `"Big Dave"` | Names with spaces go in quotes |
| `#3` | The player in slot 3 (from `who`) |
| `76561197960287931` | That SteamID. `STEAM_0:1:11101` and `[U:1:22203]` work too. |
| `@me`, `@team`, `@enemy`, `@all` | Yourself, or a group. Only `kick` and `slay` take groups. |

You can't act on anyone with higher [immunity](permissions#immunity) than yours, and groups skip them. Nobody can ban, gag or mute themselves, and bots can be kicked and slain but not penalized.

## Moderation

| Command | Permission | |
|---------|------------|---|
| `kick <player> [reason]` | `admin.moderation.kick` | Disconnects them with the reason. They can rejoin. |
| `ban <player\|steamid> <minutes> [reason]` | `admin.moderation.ban` | Kicks them and keeps them out. Also called `addban`. |
| `unban <steamid> [reason]` | `admin.moderation.unban` | Lifts a ban |
| `bans` | `admin.moderation.ban` | Lists active bans |
| `gag <player\|steamid> <minutes> [reason]` | `admin.moderation.gag` | Stops them typing in chat |
| `ungag <player\|steamid> [reason]` | `admin.moderation.gag` | |
| `gags` | `admin.moderation.gag` | |
| `mute <player\|steamid> <minutes> [reason]` | `admin.moderation.mute` | Stops them talking on voice chat |
| `unmute <player\|steamid> [reason]` | `admin.moderation.mute` | |
| `mutes` | `admin.moderation.mute` | |
| `slay <player>` | `admin.moderation.slay` | Kills their hero |
| `who [player]` | `admin.moderation.who` | Slot, SteamID, team, roles, and whether they're gagged, muted or not yet verified by Steam |
| `penalties [player\|steamid]` | anyone, for themselves | Bans, gags and mutes, past and present, with who gave them and how they ended. Looking up someone else needs `admin.moderation.who`. |

```text
!gag lapka 30 spamming chat        30 minutes
!ban lapka 1440 cheating           one day (60 = an hour, 10080 = a week)
!ban lapka 0 cheating              0 = permanent
!ban 76561197960287931 60 evading  works when they've already left
!kick @enemy                       groups work for kick and slay
```

- **The time comes before the reason**, and is required. `!gag lapka spamming` doesn't work.
- **Banning someone again replaces their ban.** Replacing it with a shorter one needs `admin.moderation.unban` as well, since it partly lifts it.
- **Penalties apply wherever they're from.** Deadworks itself turns banned players away and drops gagged players' chat and muted players' voice, and tells them why and for how long. Disabling the Admin plugin doesn't lift them.
- **Someone who's already left**: `ban`, `gag` and `mute` take a SteamID. Find it in the admin log, which names every target's SteamID, or run `who` next time while they're still here.

## Server

| Command | Permission | |
|---------|------------|---|
| `map [name]` | `admin.server.map` | Changes map after a 3-second warning. On its own it lists the maps; `map cancel` calls off a change. |
| `cvar <name> [value]` | `admin.server.cvar` | Shows or changes a setting |
| `resetcvar <name>` | `admin.server.cvar` | Puts a setting back to its default |
| `execcfg <file>` | `admin.server.config` | Runs a file from the server's `cfg/` folder |
| `rcon <command...>` | `admin.server.rcon` | Runs any server console command and shows its output |

Roles, bans and gags carry over a map change. `rcon_password` can't be read or changed from `cvar`, and password cvars like `sv_password` are changed without announcing the value.

:::danger `rcon` is full control of the server
Console commands skip every permission check, so someone with `admin.server.rcon` can make themselves an owner. Only give it to people you'd give `*` to.
:::

## What Everyone Sees

- **Players** see what happened, not who did it: `ADMIN: banned lapka for 1 hour: griefing`.
- **Staff** with `deadworks.admin.notify` see who: `wisp: banned lapka for 1 hour: griefing`.
- `rcon`, `unban`, password cvars and actions on a SteamID that isn't on the server are logged but not announced.

Every action, announced or not, goes in `logs/admin/admin-YYYY-MM-DD.log` with the admin, the target's SteamID and the reason, as do changes to staff roles and commands staff were refused:

```text
2026-09-26T14:02:11Z wisp (76561197960287930) banned lapka for 1 hour: griefing [target=76561197960287931 penalty=...]
```

## Settings

In `configs/deadworks.jsonc`:

```jsonc
"admin": {
  "show_activity": {
    "players": "anonymous",   // named | anonymous | none
    "notified": "named"
  },
  "log_dir": "logs/admin"
},
"penalties": {
  "history_days": 90          // how long lifted and expired penalties are kept; 0 = forever
}
```

In `configs/AdminPlugin/AdminPlugin.jsonc` (reload with `dw_reloadconfig AdminPlugin`):

```jsonc
{
  "default_kick_reason": "Kicked by an admin",
  "default_ban_reason": "Banned by an admin",
  "default_gag_reason": "Gagged by an admin",
  "default_mute_reason": "Muted by an admin",
  "require_reason": false,        // true: ban, gag and mute refuse to run without a reason
  "map_change_delay_seconds": 3
}
```

Bans, gags and mutes are saved in `configs/penalties/penalties.jsonc`. If you edit it by hand, run `dw_penalties_reload`.

## Changing or Removing It

- **Nobody should use a command?** Don't give anyone its permission. The server console still can.
- **Different permission for a command, or open it to everyone?** Use [`overrides.jsonc`](permissions#changing-what-a-command-requires).
- **Don't want the plugin?** `dw_plugin disable AdminPlugin`. Saved penalties are still enforced.
- **Want a modified version?** The plugin lives in `managed/builtin/` and is updated with Deadworks. An `AdminPlugin.dll` in `plugins/` is used instead of it.

Announcements, warnings, votes, fun commands and IP bans aren't part of the Admin plugin; they're left to other plugins.
