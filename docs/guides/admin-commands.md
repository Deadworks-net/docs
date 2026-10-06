---
title: "Admin commands"
sidebar_label: "2. Admin commands"
---

# Admin commands

**Step 2 of 4** in [Admins & Permissions](/permissions). Before this: [make yourself admin](making-yourself-admin).

These commands come with Deadworks' built-in **Admin** plugin. Each command can be typed in three places:

| Where | Type | Example |
|-------|------|---------|
| Chat | `!` or `/` then the command | `!kick lapka` |
| Your game console | `dw_` then the command | `dw_kick lapka` |
| The server console | `dw_` then the command | `dw_kick lapka` |

Admin commands never show up in public chat, even with `!`. Commands that print a list (`who`, `bans`, `gags`, `mutes`, `penalties`, `map` on its own) print it in your console. `rcon` prints its output there too. `dw_help` lists the commands you're allowed to use.

## How to target

| Target | Meaning |
|--------|---------|
| `lapka` | Picks the player whose name matches. An exact match wins; otherwise part of a name works. If several match, lists them and does nothing. |
| `"Big Dave"` | Picks a player whose name has spaces. The quotes are required. |
| `#3` | Picks the player in slot `3` (see `who`) |
| `76561197960287931` | Picks that SteamID. `STEAM_0:1:11101` and `[U:1:22203]` work too. |
| `@me` | Picks yourself |
| `@team` | Picks everyone on your team |
| `@enemy` | Picks everyone on the other team |
| `@all` | Picks everyone on the server |

- Groups (`@team`, `@enemy`, `@all`) only work for `kick`, `slay` and `who`. A group `kick` leaves you out.
- You can't target anyone with higher [immunity](admins-and-permissions#immunity) than yours. Groups skip them.
- `ban`, `gag`, `mute` and their `un` commands also take the SteamID of someone who has left.
- Bots can be kicked and slain, but not banned, gagged or muted.
- A player who has just joined can't be banned, gagged or muted until Steam confirms them, a few seconds later. The server console can do it anyway.

## Moderation commands

Durations are in minutes: `60` is an hour, `1440` a day, `10080` a week. `0` is permanent.

| Command | Permission | Format | Description |
|---------|------------|--------|-------------|
| `kick` | `admin.moderation.kick` | `<target> [reason]` | Kicks a player. The player can rejoin. |
| `ban` | `admin.moderation.ban` | `<target\|steamid> <minutes\|0> [reason]` | Bans a player, on the server or not. Alias: `addban`. |
| `unban` | `admin.moderation.unban` | `<steamid> [reason]` | Lifts a ban |
| `bans` | `admin.moderation.ban` | | Lists active bans |
| `gag` | `admin.moderation.gag` | `<target\|steamid> <minutes\|0> [reason]` | Stops a player typing in chat |
| `ungag` | `admin.moderation.gag` | `<target\|steamid> [reason]` | Lifts a gag |
| `gags` | `admin.moderation.gag` | | Lists active gags |
| `mute` | `admin.moderation.mute` | `<target\|steamid> <minutes\|0> [reason]` | Stops a player talking on voice chat |
| `unmute` | `admin.moderation.mute` | `<target\|steamid> [reason]` | Lifts a mute |
| `mutes` | `admin.moderation.mute` | | Lists active mutes |
| `slay` | `admin.moderation.slay` | `<target>` | Kills a player's hero |
| `who` | `admin.moderation.who` | `[target]` | Lists players with their slot, SteamID, team, roles, and whether they're gagged, muted or not yet verified by Steam |
| `penalties` | anyone, for themselves | `[target\|steamid]` | Shows bans, gags and mutes, past and present, with who gave them and how they ended. Looking up another player needs `admin.moderation.who`. |

```text
!gag lapka 30 spamming chat
!ban lapka 0 cheating
!ban 76561197960287931 1440 ban evasion
!slay @enemy
```

- **The time comes before the reason.** `!gag lapka spamming` doesn't work.
- **Penalizing someone again replaces** what they had. Replacing a ban with a shorter one also needs `admin.moderation.unban`.
- **Nobody can penalize themselves.**
- **Deadworks enforces penalties**, not the plugin. Banned players are turned away. Gagged players' chat and muted players' voice are dropped, and they're told why.
- Penalties are saved in `configs/penalties/penalties.jsonc`. They survive restarts and map changes. After editing that file by hand, run `dw_penalties_reload`.

## Server commands

| Command | Permission | Format | Description |
|---------|------------|--------|-------------|
| `map` | `admin.server.map` | `[name\|cancel]` | Changes map after a warning (`3` seconds by default). Lists the maps when run on its own. `cancel` calls off a pending change. |
| `cvar` | `admin.server.cvar` | `<name> [value]` | Shows or changes a server setting, including `sv_cheats` and `sv_password` |
| `resetcvar` | `admin.server.cvar` | `<name>` | Puts a setting back to its default |
| `execcfg` | `admin.server.config` | `<file>` | Runs a config file from the server's `cfg/` folder |
| `rcon` | `admin.server.rcon` | `<command>` | Runs any server console command and shows its output |

`cvar` and `resetcvar` can't read or change `rcon_password`. Setting a password cvar such as `sv_password` isn't announced. The log leaves out the value.

:::danger
`rcon` can run anything, including `rcon_password`. Anyone with `admin.server.rcon` controls the whole server. Give it only to people you trust with the server.
:::

## Settings

The Admin plugin's settings are in `configs/AdminPlugin/AdminPlugin.jsonc`. Run `dw_reloadconfig AdminPlugin` after editing.

| Setting | Default | Description |
|---------|---------|-------------|
| `default_kick_reason` | `"Kicked by an admin"` | Sets the reason used when `kick` is given none |
| `default_ban_reason` | `"Banned by an admin"` | Sets the reason used when `ban` is given none |
| `default_gag_reason` | `"Gagged by an admin"` | Sets the reason used when `gag` is given none |
| `default_mute_reason` | `"Muted by an admin"` | Sets the reason used when `mute` is given none |
| `require_reason` | `false` | Makes `ban`, `gag` and `mute` refuse to run without a reason when `true` |
| `map_change_delay_seconds` | `3` | Sets the warning before `map` changes map, in seconds, from `0` to `60` |

To turn the Admin plugin off, run `dw_plugin disable AdminPlugin`.

## Next

**[3. How permissions work](admins-and-permissions)**: the permission files and commands.
