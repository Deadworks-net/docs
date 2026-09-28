---
title: "Administering Your Server"
sidebar_label: "2. Administering Your Server"
---

# Administering Your Server

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

**Step 2 of 7** in [Admins & Permissions](/permissions). Before this: [make yourself admin](making-yourself-admin).

This guide shows you how to use the admin commands that come with Deadworks while a match is running: dealing with a spammer, kicking a griefer, banning a cheater, changing map. Every command here comes from the [Admin plugin](admin-plugin), which the next page covers in full.

## Where to Type Commands

Every admin command works in three places:

| Where | Type | Example |
|-------|------|---------|
| Chat | `!` or `/` then the command | `!kick lapka` |
| Your game console | `dw_` then the command | `dw_kick lapka` |
| The server console | `dw_` then the command | `dw_kick lapka` |

Admin commands never show up in public chat, even with `!`, so players don't see you typing them. They do see the result, such as `ADMIN: kicked lapka: spamming`.

Commands that print a list (`who`, `bans`, `gags`, `mutes`, `penalties`, `map` with no name) print it in your **console**, and chat tells you to look there.

Not sure what you're allowed to run? Type `dw_help` in your console. It lists only the commands you can use.

## Picking Players

Most commands start with a player. You can write that player several ways:

| You type | It means |
|----------|----------|
| `lapka` | The player called lapka |
| `lap` | Any player whose name contains "lap". If more than one does, nothing happens and you're shown the matches. |
| `#3` | The player in slot 3 |
| `76561197960287931` | The player with that SteamID. `STEAM_0:1:11101` and `[U:1:22203]` work too. |
| `@me` | Yourself |
| `@team` | Everyone on your team, including you |
| `@enemy` | Everyone on the other team |
| `@all` | Everyone on the server |

Some examples:

| You type | It does |
|----------|---------|
| `!slay @enemy` | Kills every enemy hero |
| `!kick #4 afk` | Kicks whoever is in slot 4 |
| `!gag "Big Dave" 10` | Names with spaces go in quotes |
| `!who lap` | Looks someone up before you act |

A few rules:

- **Get slot numbers and SteamIDs from `!who`.** It lists everyone with their `#slot`, name, SteamID, team and roles.
- **Use `#slot` when names are similar.** If "lap" matches both "lapka" and "lapdog", you'll get a list back instead of hitting the wrong person.
- **Groups only work for `kick`, `slay` and `who`.** Bans, gags and mutes are too serious to hand out to a whole team by accident, so they always take one player. `!kick @all` and `!kick @team` leave you out, but `!kick @me` or your own name kicks you.
- **You can't act on higher-ranked staff.** A moderator can't kick an admin. With `@all` or `@enemy`, anyone you can't act on is skipped. See [immunity](admins-and-permissions#immunity).
- **Bots can be kicked and slain, but not banned or gagged,** because they have no SteamID.
- **Someone who has just joined can't be banned or gagged for a few seconds,** until Steam confirms who they are. You'll be told to try again in a moment. Kick and slay work straight away.

## Common Situations

### Someone is spamming chat

Gag them. They can still play and talk on voice, but can't type in chat.

| You type | It does |
|----------|---------|
| `!gag lapka 30 spamming chat` | Gags lapka for 30 minutes |
| `!ungag lapka` | Lifts it early |
| `!gags` | Shows who's gagged right now |
| `!mutes` | Shows who's muted right now |

The time comes **before** the reason, and you always need one. `!gag lapka spamming` doesn't work, because "spamming" isn't a number of minutes. Use `0` for a gag with no end: `!gag lapka 0 spamming`.

Gagged players are told they're gagged and for how long whenever they try to chat. Their chat commands like `!penalties` still work.

### Someone is griefing or AFK

Kick them. They can rejoin straight away, so kicking is a warning.

```text
!kick lapka stop feeding
!kick #4 afk
```

The reason is printed in their chat and console and sent with the disconnect.

### Someone is cheating or keeps coming back

Ban them for a set number of minutes. `0` means permanent.

| You type | It does |
|----------|---------|
| `!ban lapka 60 griefing` | Bans for one hour |
| `!ban lapka 1440 cheating` | Bans for one day (`10080` is a week) |
| `!ban lapka 0 cheating` | Bans permanently |

They're kicked, and turned away if they try to reconnect.

### They left before you could ban them

Use `ban` with their SteamID instead of a name. It works whether or not they're on the server.

```text
!ban 76561197960287931 1440 ban evasion
```

To find the SteamID of someone who's already gone, look in the admin log, `logs/admin/`. Every Admin plugin action names the target's SteamID, so a kick you gave earlier shows it. The server console also prints each player's SteamID as they connect. Next time, run `!who` while they're still there.

### Undoing a mistake

| You type | It does |
|----------|---------|
| `!unban 76561197960287931` | Lifts a ban. `unban` takes a SteamID. |
| `!ungag lapka` | Lifts a gag |
| `!bans` | Lists every active ban |

### Checking a player's record

```text
!penalties 76561197960287931
```

This shows their bans, gags and mutes: active, lifted and expired, with who gave them and why. Players can type `!penalties` with no SteamID to see their own record.

## Running the Server

### Changing map

| You type | It does |
|----------|---------|
| `!map` | Lists the maps you can pick |
| `!map dl_midtown` | Changes map after a 3-second warning |

Everyone sees the warning, then the new map loads and players reconnect on their own. Roles, bans, gags and mutes carry over.

### Changing a setting

| You type | It does |
|----------|---------|
| `!cvar sv_gravity` | Shows the current value and the default |
| `!cvar sv_gravity 600` | Changes it (everyone sees the change) |
| `!resetcvar sv_gravity` | Puts it back to the default |

`cvar` also reaches `sv_cheats` and password settings like `sv_password`, so servers usually keep it for the owner. `cvar` and `resetcvar` can't touch `rcon_password`.

### Running a config file

```text
!execcfg events/lan.cfg
```

The file has to be inside the server's `cfg/` folder.

### Anything else: rcon

```text
dw_rcon status
dw_rcon find bot
```

`rcon` runs any server console command and shows you what it printed. To pass a whole command as one argument, quote it: `dw_rcon "sv_cheats 1"`. Only the most trusted people should have it: console commands aren't limited by permissions, so rcon can do anything, including changing `rcon_password` or making someone an owner.

## Keeping Track

- **Players see what staff do.** Players see `ADMIN: banned lapka for 1 hour: griefing`; other staff see who did it. The server owner can change this.
- **Admin commands are logged.** Every Admin plugin command goes in `logs/admin/admin-YYYY-MM-DD.log` with the admin, the target's SteamID and the reason, including ones that aren't announced, like `rcon` and `unban`. Role and permission changes aren't in this log.

## Quick Reference

| Situation | Command |
|-----------|---------|
| Who's on, with slots and SteamIDs | `!who` |
| Spamming chat | `!gag <player> <minutes> [reason]` |
| Mic spam | `!mute <player> <minutes> [reason]` |
| Griefing, AFK | `!kick <player> [reason]` |
| Cheating | `!ban <player> <minutes> [reason]`, `0` = permanent |
| Already left | `!ban <steamid> <minutes> [reason]` |
| Undo | `!unban <steamid>`, `!ungag <player>` |
| Record | `!penalties <steamid>` |
| Kill a hero | `!slay <player>`, `!slay @enemy` |
| Change map | `!map <name>` |
| Change a setting | `!cvar <name> <value>` |
| What can I use? | `dw_help` in console |

## Next

**[3. The Admin Plugin](admin-plugin)**: every command, its permission and its settings in full.
