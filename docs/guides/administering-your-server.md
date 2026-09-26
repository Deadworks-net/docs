---
title: "Administering Your Server"
sidebar_label: "2. Administering Your Server"
---

# Administering Your Server

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

Commands that print a list (`who`, `bans`, `gags`, `penalties`, `map` with no name) print it in your **console**, and chat tells you to look there.

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

```text
!slay @enemy               kill every enemy hero
!kick #4 afk               kick whoever is in slot 4
!gag "Big Dave" 10         names with spaces go in quotes
!who lap                   look someone up before acting
```

A few rules:

- **Get slot numbers and SteamIDs from `!who`.** It lists everyone with their `#slot`, name, SteamID, team and roles.
- **Use `#slot` when names are similar.** If "lap" matches both "lapka" and "lapdog", you'll get a list back instead of hitting the wrong person.
- **Groups only work for `kick` and `slay`.** Bans and gags are too serious to hand out to a whole team by accident, so they always take one player.
- **You can't act on higher-ranked staff.** A moderator can't kick an admin. With `@all` or `@enemy`, anyone you can't act on is skipped. See [immunity](admins-and-permissions#immunity).
- **Bots can be kicked and slain, but not banned or gagged,** because they have no SteamID.

## Common Situations

### Someone is spamming chat

Gag them. They can still play and talk on voice, but can't type in chat.

```text
!gag lapka 30 spamming chat          30 minutes
!ungag lapka                         lift it early
!gags                                who's gagged right now
```

The time comes **before** the reason. `!gag lapka spamming` doesn't work, because "spamming" isn't a number of minutes. Leave the time off entirely (`!gag lapka`) for a gag with no end, which needs the permanent-penalty permission.

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

```text
!ban lapka 60 griefing               one hour
!ban lapka 1440 cheating             one day (10080 is a week)
!ban lapka 0 cheating                permanent
```

They're kicked with the reason, and turned away if they try to reconnect; the refusal says how long is left. Permanent bans need an extra permission, so your server may only let senior staff hand them out.

### They left before you could ban them

Use `addban` with their SteamID. It works whether or not they're on the server.

```text
!addban 76561197960287931 1440 ban evasion
```

To find the SteamID of someone who's already gone, look in the admin log, `logs/admin/`. Every action names the target's SteamID, so a kick you gave earlier shows it. The server console also prints each player's SteamID as they connect. Next time, run `!who` while they're still there.

### Undoing a mistake

```text
!unban 76561197960287931             unban takes a SteamID
!ungag lapka
!bans                                list every active ban
```

### Checking a player's record

```text
!penalties 76561197960287931
```

This shows their bans and gags: active, lifted and expired, with who gave them and why. Players can type `!penalties` with no SteamID to see their own record.

## Running the Server

### Changing map

```text
!map                     list the maps you can pick
!map dl_midtown          changes after a 3-second warning
```

Everyone sees the warning, then the new map loads and players reconnect on their own. Roles, bans and gags carry over.

### Changing a setting

```text
!cvar sv_gravity             show the current value and the default
!cvar sv_gravity 600         change it (everyone sees the change)
!resetcvar sv_gravity        back to the default
```

Some settings need extra permissions: `sv_cheats`, and password settings like `sv_password`. `rcon_password` can't be touched from here at all.

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

`rcon` runs any server console command and shows you what it printed. Only the most trusted people should have it: console commands aren't limited by permissions, so rcon can do anything, including making someone an owner.

## Keeping Track

- **Players see what staff do.** Players see `ADMIN: banned lapka (60 minutes): griefing`; other staff see who did it. The server owner can change this.
- **Everything is logged.** Every admin action goes in `logs/admin/admin-YYYY-MM-DD.log` with the admin, the target's SteamID and the reason, including actions that aren't announced, like `rcon` and `unban`.

## Quick Reference

| Situation | Command |
|-----------|---------|
| Who's on, with slots and SteamIDs | `!who` |
| Spamming chat | `!gag <player> <minutes> [reason]` |
| Griefing, AFK | `!kick <player> [reason]` |
| Cheating | `!ban <player> <minutes> [reason]`, `0` = permanent |
| Already left | `!addban <steamid> <minutes> [reason]` |
| Undo | `!unban <steamid>`, `!ungag <player>` |
| Record | `!penalties <steamid>` |
| Kill a hero | `!slay <player>`, `!slay @enemy` |
| Change map | `!map <name>` |
| Change a setting | `!cvar <name> <value>` |
| What can I use? | `dw_help` in console |

## Next

**[3. The Admin Plugin](admin-plugin)**: every command, its permission and its settings in full.
