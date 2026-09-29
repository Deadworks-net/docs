---
title: "Admin Commands"
sidebar_label: "2. Admin Commands"
---

# Admin Commands

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

**Step 2 of 6** in [Admins & Permissions](/permissions). Before this: [make yourself admin](making-yourself-admin).

These commands come with Deadworks' built-in **Admin** plugin. Every command can be typed three ways:

| Where | Type | Example |
|-------|------|---------|
| Chat | `!` or `/` then the command | `!kick lapka` |
| Your game console | `dw_` then the command | `dw_kick lapka` |
| The server console | `dw_` then the command | `dw_kick lapka` |

Admin commands never show up in public chat, even with `!`. Commands that print a list (`who`, `bans`, `gags`, `mutes`, `penalties`, `map` on its own) print it in your console. `dw_help` lists the commands you're allowed to use.

## How to Target

| Target | Meaning |
|--------|---------|
| `lapka` | The player whose name matches, in full or in part. If several match, you're shown them and nothing happens. |
| `"Big Dave"` | Names with spaces go in quotes |
| `#3` | The player in slot 3 (see `who`) |
| `76561197960287931` | That SteamID. `STEAM_0:1:11101` and `[U:1:22203]` work too. |
| `@me` | Yourself |
| `@team` | Everyone on your team |
| `@enemy` | Everyone on the other team |
| `@all` | Everyone on the server |

- Groups (`@team`, `@enemy`, `@all`) only work for `kick`, `slay` and `who`. A group `kick` leaves you out.
- You can't target anyone with higher [immunity](admins-and-permissions#immunity) than yours. Groups skip them.
- `ban`, `gag`, `mute` and their `un` commands also take the SteamID of someone who has left.
- Bots can be kicked and slain, but not banned, gagged or muted.
- A player who has just joined can't be banned, gagged or muted until Steam confirms them, a few seconds later. The server console can anyway.

## Moderation Commands

Durations are in minutes: `60` is an hour, `1440` a day, `10080` a week, `0` is permanent.

| Command | Permission | Format | Description |
|---------|------------|--------|-------------|
| `kick` | `admin.moderation.kick` | `<target> [reason]` | Kicks a player. They can rejoin. |
| `ban` | `admin.moderation.ban` | `<target\|steamid> <minutes\|0> [reason]` | Bans a player, on the server or not. Also called `addban`. |
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
| `penalties` | anyone, for themselves | `[target\|steamid]` | Shows bans, gags and mutes, past and present, with who gave them and how they ended. Looking up someone else needs `admin.moderation.who`. |

```text
!gag lapka 30 spamming chat
!ban lapka 0 cheating
!ban 76561197960287931 1440 ban evasion
!slay @enemy
```

- **The time comes before the reason.** `!gag lapka spamming` doesn't work.
- **Penalizing someone again replaces** what they had. Replacing a ban with a shorter one also needs `admin.moderation.unban`.
- **Nobody can penalize themselves.**
- **Deadworks enforces penalties**, not the plugin: banned players are turned away, gagged players' chat and muted players' voice are dropped, and they're told why. They're saved in `configs/penalties/penalties.jsonc` and survive restarts and map changes. After editing that file by hand, run `dw_penalties_reload`.

## Server Commands

| Command | Permission | Format | Description |
|---------|------------|--------|-------------|
| `map` | `admin.server.map` | `[name\|cancel]` | Changes map after a 3-second warning. On its own it lists the maps; `cancel` calls off a pending change. |
| `cvar` | `admin.server.cvar` | `<name> [value]` | Shows or changes a server setting, including `sv_cheats` and `sv_password` |
| `resetcvar` | `admin.server.cvar` | `<name>` | Puts a setting back to its default |
| `execcfg` | `admin.server.config` | `<file>` | Runs a config file from the server's `cfg/` folder |
| `rcon` | `admin.server.rcon` | `<command>` | Runs any server console command and shows its output |

`cvar` can't touch `rcon_password`.

## Next

**[3. Setting Up Staff Roles](staff-roles)**: give other people some of these commands.
