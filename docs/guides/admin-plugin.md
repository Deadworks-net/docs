---
title: "The Admin Plugin"
sidebar_label: "The Admin Plugin"
---

# The Admin Plugin

Deadworks comes with an **Admin** plugin that has the commands every server needs to run a match and deal with problem players: kicking, banning, gagging, changing map and so on. It's enabled by default and does nothing for players who don't have its permissions, so a fresh server is exactly as open as before, apart from the server console.

This page explains what's in it and how it behaves. To give people access to it, see [Setting Up Staff Roles](staff-roles).

## The Two Command Groups

The commands are split into two groups. Each group has its own permissions, so you can hand them out separately:

| Group | Permissions | For |
|-------|-------------|-----|
| **Moderation** | `admin.moderation.*` | Dealing with players: kick, ban, gag, mute, slay, who |
| **Server** | `admin.server.*` | Running the server: change map, cvars, configs, console commands |

Moderators usually get the moderation group only. Server control is for people you trust with the whole server.

Every command works three ways, like any Deadworks command: `!kick` or `/kick` in chat, and `dw_kick` in the console. Admin commands never show up in public chat, even when typed with `!`.

## Picking Players

Wherever a command takes a `<player>`, you can use:

| You type | It means |
|----------|----------|
| `lapka` or `lap` | A player whose name matches. If it matches more than one, you'll be asked to be more specific. |
| `#3` | The player in slot 3 (see `who`) |
| `76561197960287931`, `STEAM_0:1:11101`, `[U:1:22203]` | That player, by SteamID |
| `@me` | Yourself |
| `@all`, `@team`, `@enemy` | Groups of players. Only `kick` and `slay` accept these. |

**Immunity:** you can't use moderation commands on someone whose [immunity](admins-and-permissions#immunity) is higher than yours. A moderator can't kick an admin. The server console can target anyone.

## Moderation Commands

| Command | Permission | What it does |
|---------|------------|--------------|
| `kick <player> [reason]` | `admin.moderation.kick` | Disconnects the player and shows them the reason. They can rejoin. |
| `ban <player> <minutes> [reason]` | `admin.moderation.ban` | Kicks the player and stops them rejoining for that many minutes. |
| `addban <steamid> <minutes> [reason]` | `admin.moderation.ban.offline` | Bans someone who isn't on the server, by SteamID. |
| `unban <steamid>` | `admin.moderation.unban` | Lifts a ban. |
| `gag <player> [minutes] [reason]` | `admin.moderation.gag` | Stops the player **typing** in chat. |
| `ungag <player>` | `admin.moderation.gag` | Lifts a gag. |
| `mute <player> [minutes] [reason]` | `admin.moderation.mute` | Stops the player **talking** on voice chat. |
| `unmute <player>` | `admin.moderation.mute` | Lifts a mute. |
| `silence <player> [minutes] [reason]` | both of the above | Gag and mute at once. `unsilence` lifts both. |
| `slay <player>` | `admin.moderation.slay` | Kills the player's hero. |
| `who [player]` | `admin.moderation.who` | Lists players with their slot, SteamID, team, roles and active penalties. |
| `penalties [steamid]` | anyone, for themselves | Shows your own bans, gags and mutes. Staff with `admin.moderation.who` can look up anyone. |

### Gag vs Mute

These follow SourceMod's meanings:

- **gag** = text chat
- **mute** = voice chat
- **silence** = both

### Durations

- Durations are in **minutes**: `60` is an hour, `1440` a day, `10080` a week.
- `0` means **permanent**. So does leaving the time off `gag`, `mute` and `silence`.
- Permanent bans, gags and mutes need an extra permission, `admin.moderation.ban.permanent`. That lets you give moderators temporary bans only.

```text
!ban lapka 60 spamming mic           ← one hour
!ban lapka 0 cheating                ← permanent, needs admin.moderation.ban.permanent
!gag #4 30                           ← 30 minutes of no text chat
dw_addban STEAM_0:1:11101 1440 ban evasion
```

### Where Penalties Are Kept

Bans, gags and mutes are saved to `configs/penalties/penalties.jsonc`, so they survive restarts. Deadworks itself enforces them, so they apply no matter which other plugins you run:

- **Banned** players are turned away when they connect, and told why and for how long.
- **Gagged** players' messages never reach chat, or any plugin that reads chat. They're told they're gagged.
- **Muted** players can't be heard.

Expired and lifted penalties stay in the file for 90 days, so `penalties` can show someone's history.

## Server Commands

| Command | Permission | What it does |
|---------|------------|--------------|
| `map [name]` | `admin.server.map` | Changes map after a 3-second warning. With no name, lists the maps you can pick. Unknown maps are refused. |
| `cvar <name> [value]` | `admin.server.cvar` | Shows or changes a server setting (cvar). |
| `resetcvar <name>` | `admin.server.cvar` | Puts a cvar back to its default. |
| `execcfg <file>` | `admin.server.config` | Runs a config file from the server's `cfg/` folder. |
| `rcon <command>` | `admin.server.rcon` | Runs any server console command and shows you the output. |

### Protected Settings

Some cvars need more than `admin.server.cvar`:

| Cvar | Needs |
|------|-------|
| `sv_cheats` | `admin.server.cvar.cheats` |
| Password-type cvars, such as `sv_password` | `admin.server.cvar.protected` |
| `rcon_password` | Can't be read or changed from the Admin plugin at all |

:::danger `rcon` is full control of the server
Console commands skip every permission check. Someone with `admin.server.rcon` can run `dw_role_grant` on themselves and become an owner. Only give it to people you'd give `*` to.
:::

## What Everyone Sees

When staff use a command, the server announces it. By default:

- **Players** see what happened, but not who did it: `ADMIN: banned lapka (60 minutes): spamming mic`.
- **Staff** see who did it: `wisp: banned lapka (60 minutes): spamming mic`. "Staff" means anyone with the `deadworks.admin.notify` permission.

`rcon`, `unban` and changes to protected cvars are recorded but not announced.

You can change this in `configs/deadworks.jsonc`:

```jsonc
"admin": {
  "show_activity": {
    "players": "anonymous",   // named | anonymous | none
    "notified": "named"       // named | anonymous | none
  }
}
```

## The Action Log

Every admin action is written to a daily log file, `logs/admin/admin-YYYY-MM-DD.log`, whether or not it was announced:

```text
2026-09-26T14:02:11Z [Admin] wisp (76561197960287930) ban lapka (76561197960287931) minutes=60 reason="spamming mic"
```

Use it to check what your staff have been doing, or to settle a ban appeal.

## Settings

`configs/Admin/Admin.jsonc` holds the plugin's own settings, such as the default reason used when none is given, and whether staff must give a reason for a ban.

## Turning Parts Off

- **Don't want some commands at all?** Don't give anyone their permission. Only the server console will be able to use them.
- **Want a command available to someone who wouldn't normally have it,** or to require a different permission? Use [`overrides.jsonc`](overriding-command-permissions).
- **Don't want the plugin at all?** Run `dw_plugin disable Admin`. Penalties that are already saved are still enforced, because Deadworks enforces them, not the plugin.

## Not in the Admin Plugin

The Admin plugin sticks to what every server needs. These are left to other plugins:

- announcements and admin-only chat (planned as a future `admin.chat` group)
- warnings
- fun commands: teleporting, freezing, giving items or souls
- votes and map voting
- IP bans (Deadlock players always have a SteamID, and IP bans catch innocent people on shared connections)

## See Also

- [Setting Up Staff Roles](staff-roles) — Who gets which commands
- [Admins & Permissions](admins-and-permissions) — How roles, permissions and immunity work
- [Making Yourself Admin](making-yourself-admin) — Give your own account full access
