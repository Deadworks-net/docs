---
title: "Use admin tools"
sidebar_label: "4. Use admin tools"
---

# Use admin tools

**Step 4 of 4** in [Getting started for server admins](/getting-started/server-admins). The Admin plugin ships with Deadworks and adds commands to kick, ban, gag and mute players, and to run the server.

## Type a command

Every admin command works three ways:

| Where | Type | Example |
|-------|------|---------|
| Chat | `!` or `/`, then the command | `!kick lapka` |
| Your game console | `dw_`, then the command | `dw_kick lapka` |
| The server console | `dw_`, then the command | `dw_kick lapka` |

Admin commands never show in public chat. `dw_help` lists the commands you can use.

## Pick a player

| Type | Picks |
|------|-------|
| `lapka` | The player with that name, or part of it |
| `"Big Dave"` | A name with spaces |
| `#3` | The player in slot 3. `who` lists the slots. |
| `76561197960287931` | A player by SteamID, even after they've left |
| `@me`, `@team`, `@enemy`, `@all` | Yourself, your team, the other team, everyone |

## Common commands

Times are in minutes. `0` is permanent.

| Command | Does |
|---------|------|
| `who` | Lists players, with their slot and SteamID |
| `kick <player> [reason]` | Kicks a player. They can rejoin. |
| `ban <player> <minutes> [reason]` | Bans a player |
| `unban <steamid>` | Lifts a ban |
| `gag <player> <minutes> [reason]` | Stops a player typing in chat |
| `mute <player> <minutes> [reason]` | Stops a player talking on voice chat |
| `ungag <player>`, `unmute <player>` | Lifts a gag or mute |
| `slay <player>` | Kills a player's hero |
| `map <name>` | Changes map. `map` on its own lists the maps. |
| `penalties [player]` | Shows a player's bans, gags and mutes, past and present |

```text
!gag lapka 30 spamming chat
!ban lapka 1440 cheating
!map dl_midtown
```

The time comes before the reason: `!gag lapka spamming` doesn't work.

Deadworks enforces bans, gags and mutes. They're saved in `configs\penalties\penalties.jsonc` and last across restarts and map changes.

## See what admins did

Every admin action is written to `game\bin\win64\logs\admin\`, one file per day. Players see `ADMIN: kicked lapka: <reason>` in chat. Admins see who did it.

## Next

- [Admin commands](../../guides/admin-commands): every command, its permission and the Admin plugin's settings
- [Setting up staff roles](../../guides/staff-roles): moderators and trial moderators with fewer commands
- [Upgrading to permissions](../../guides/upgrading-permissions): coming from an older Deadworks version
