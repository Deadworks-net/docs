---
title: "The Admin Plugin"
sidebar_label: "3. The Admin Plugin"
---

# The Admin Plugin

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

**Step 3 of 7** in [Admins & Permissions](/permissions). Before this: [administering your server](administering-your-server).

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
| `@all`, `@team`, `@enemy` | Groups of players. Only `kick`, `slay` and `who` accept these. A group `kick` leaves you out, but `kick @me` or your own name kicks you. |

**Immunity:** you can't use moderation commands on someone whose [immunity](admins-and-permissions#immunity) is higher than yours. A moderator can't kick an admin. The server console can target anyone.

## Moderation Commands

| Command | Permission | What it does |
|---------|------------|--------------|
| `kick <player> [reason]` | `admin.moderation.kick` | Disconnects the player. They can rejoin. The reason goes in the announcement and the action log. |
| `ban <player> <minutes> [reason]` | `admin.moderation.ban` | Kicks the player and stops them rejoining for that many minutes. `<player>` can also be the SteamID of someone who isn't on the server. `addban` is another name for it. |
| `unban <steamid> [reason]` | `admin.moderation.unban` | Lifts any ban, whoever gave it. The reason goes in the player's history. |
| `bans` | `admin.moderation.ban` | Lists active bans. |
| `gag <player> <minutes> [reason]` | `admin.moderation.gag` | Stops the player **typing** in chat. |
| `ungag <player> [reason]` | `admin.moderation.gag` | Lifts any gag, whoever gave it. |
| `gags` | `admin.moderation.gag` | Lists active gags. |
| `mute <player> <minutes> [reason]` | `admin.moderation.mute` | Stops the player **talking** on voice chat. |
| `unmute <player> [reason]` | `admin.moderation.mute` | Lifts any mute, whoever gave it. |
| `mutes` | `admin.moderation.mute` | Lists active mutes. |
| `slay <player>` | `admin.moderation.slay` | Kills the player's hero. |
| `who [player]` | `admin.moderation.who` | Lists players with their slot, SteamID, team, roles, and whether they're gagged, muted or not yet verified by Steam. |
| `penalties [steamid]` | anyone, for themselves | Shows your own bans, gags and mutes, past and present. Staff with `admin.moderation.who` can look up anyone. |

`ban`, `gag`, `mute` and their `un` commands all take a SteamID in place of `<player>`, for someone who has left, so an appeal can be settled without waiting for them to come back.

`penalties` shows each one with how long it was given for and how it ended, which is what you need for an appeal:

```text
Penalties for 76561197960287931:
  2026-09-26 ban for 1 day by wisp: cheating; lifted early by lapka on 2026-09-27: appeal accepted
  2026-09-20 gag for 30 minutes by greeny: spam; ran out
  2026-09-28 mute permanently by wisp: mic spam; ACTIVE, permanent
```

Lists (`who`, `bans`, `gags`, `mutes`, `penalties`) are printed to your console, since they don't fit in chat. `penalties` may take a moment to load; if you leave before it arrives, it isn't shown to whoever takes your slot.

### Gag vs Mute

These follow SourceMod's meanings:

- **gag** = text chat
- **mute** = voice chat

There's no `silence` (gag and mute together); run both.

### Durations

- Durations are in **minutes**: `60` is an hour, `1440` a day, `10080` a week.
- `0` means **permanent**. `ban` and `gag` both need a duration.
- Anyone who can ban, gag or mute can do it permanently, so only give `admin.moderation.ban`, `admin.moderation.gag` and `admin.moderation.mute` to people you trust with that.
- Banning, gagging or muting someone who already is **replaces** what they had, and the announcement says so: `banned lapka for 1 hour: appeal (replaces a permanent ban by wisp)`.
- A new ban that ends sooner than the one it replaces partly lifts it, so it needs `admin.moderation.unban` as well. Without it you get `lapka already has a permanent ban by wisp. Shortening it needs admin.moderation.unban.`
- Nobody can ban, gag or mute themselves.

A one-hour ban, a permanent ban, 30 minutes of no text chat, and a one-day ban by SteamID:

```text
!ban lapka 60 spamming mic
!ban lapka 0 cheating
!gag #4 30
dw_ban STEAM_0:1:11101 1440 ban evasion
```

A player who has only just joined can't be banned, gagged or muted until Steam has confirmed their identity, which takes a few seconds. You'll see `lapka hasn't been verified by Steam yet. Try again in a moment.` Kicking and slaying work straight away.

### Where Penalties Are Kept

Bans, gags and mutes are saved to `configs/penalties/penalties.jsonc`, so they survive restarts. Deadworks itself enforces them, so they apply no matter which other plugins you run:

- **Banned** players are turned away when they connect.
- **Gagged** players' messages never reach chat, or any plugin that reads chat. They're told they're gagged.
- **Muted** players' voice is dropped by the server, so nobody hears them. They aren't told each time they talk, but they see the announcement when they're muted.

Expired and lifted penalties stay in the file for 90 days (`penalties.history_days` in `configs/deadworks.jsonc`), so `penalties` can show someone's history.

If you edit `penalties.jsonc` by hand, run `dw_penalties_reload` (needs `deadworks.penalties.reload`) for your changes to take effect. Until then they're safe: a ban or unban in the meantime keeps your entries as you wrote them (comments aside), and while the file has an error, penalties can't be added or lifted, so nothing you wrote is overwritten.

If the ban list can't be loaded when the server starts (for example `penalties.jsonc` has an error), Deadworks plays safe: new players are turned away, and bans and gags can't be added or lifted. Players already on the server stay, including through a map change. If the file breaks after it loaded, the bans already loaded keep working, but new ones are refused with `Penalties can't be changed right now: penalties.jsonc has an error. Fix it and run dw_penalties_reload.`

## Server Commands

| Command | Permission | What it does |
|---------|------------|--------------|
| `map [name]` | `admin.server.map` | Changes map after a 3-second warning. With no name, lists the maps you can pick. Unknown maps are refused. |
| `cvar <name> [value]` | `admin.server.cvar` | Shows or changes a server setting (cvar), including `sv_cheats` and passwords such as `sv_password`. |
| `resetcvar <name>` | `admin.server.cvar` | Puts a cvar back to its default. |
| `execcfg <file>` | `admin.server.config` | Runs a config file from the server's `cfg/` folder. |
| `rcon <command>` | `admin.server.rcon` | Runs any server console command and shows you the output. A single quoted argument runs as typed: `dw_rcon "sv_cheats 1"`. |

`admin.server.cvar` can turn on cheats and read or change the server password, so give it only to people you trust with those. `cvar` and `resetcvar` can't read or change `rcon_password`; `rcon` can, since it's full console access anyway.

:::danger `rcon` is full control of the server
Console commands skip every permission check. Someone with `admin.server.rcon` can run `dw_role_grant` on themselves and become an owner. Only give it to people you'd give `*` to.
:::

## What Everyone Sees

When staff use a command, the server announces it. By default:

- **Players** see what happened, but not who did it: `ADMIN: banned lapka for 1 hour: spamming mic`.
- **Staff** see who did it: `wisp: banned lapka for 1 hour: spamming mic`. "Staff" means anyone with the `deadworks.admin.notify` permission.

Durations read like `for 30 minutes`, `for 1 day`, `for 1h 30m` or `permanently`. `rcon`, `unban` and changes to password cvars are logged but not announced.

Each command is announced once, even on a group: `!slay @enemy` shows `ADMIN: slayed lapka, wisp, dingus and 3 others`, and the action log lists every target. You always see the line for your own commands, even when announcements are set to `none`.

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

Every Admin plugin command, and anything other plugins record through Deadworks' [admin log](../api-reference/admin-api#admin-activity), is written to a daily file, `logs/admin/admin-YYYY-MM-DD.log`, whether or not it was announced. Times and file dates are UTC:

```text
2026-09-26T14:02:11Z wisp (76561197960287930) banned lapka for 1 hour: spamming mic [target=76561197960287931 penalty=3f2b8c1e-...]
```

Actions from the server console are logged as `Console`, with no SteamID. When `rcon` sets a password cvar, the log says `ran rcon: sv_password (value hidden)` instead of the value.

Staff changes are logged too, though never announced: roles and permissions given or taken (`dw_role_*`, `dw_perm_*`), plugins enabled or disabled, and config, permission and penalty reloads.

The folder is `admin.log_dir` in `configs/deadworks.jsonc` (default `logs/admin`, relative to `game/bin/win64`).

Use it to check what your staff have been doing, or to settle a ban appeal.

## Settings

`configs/AdminPlugin/AdminPlugin.jsonc` holds the plugin's own settings:

```jsonc
{
  "default_kick_reason": "Kicked by an admin",
  "default_ban_reason": "Banned by an admin",
  "default_gag_reason": "Gagged by an admin",
  "default_mute_reason": "Muted by an admin",
  "require_reason": false,          // true: ban, gag and mute refuse to run without a reason
  "map_change_delay_seconds": 3    // 0 to 60
}
```

Run `dw_reloadconfig AdminPlugin` after editing it.

## Turning Parts Off

- **Don't want some commands at all?** Don't give anyone their permission. Only the server console will be able to use them.
- **Want a command available to someone who wouldn't normally have it,** or to require a different permission? Use [`overrides.jsonc`](overriding-command-permissions).
- **Don't want the plugin at all?** Run `dw_plugin disable AdminPlugin`. Penalties that are already saved are still enforced, because Deadworks enforces them, not the plugin.

## Where It Lives

The plugin ships in `game/bin/win64/managed/builtin/AdminPlugin.dll`, not in `plugins/`, so it's updated whenever you update Deadworks and your `plugins/` folder stays yours. `dw_plugin list` marks it `[ships with Deadworks]`.

To run a modified version, put your own `AdminPlugin.dll` in `plugins/`. It's used instead of the built-in one.

## Not in the Admin Plugin

The Admin plugin sticks to what every server needs. These are left to other plugins:

- announcements and admin-only chat (planned as a future `admin.chat` group)
- warnings
- fun commands: teleporting, freezing, giving items or souls
- votes and map voting
- IP bans (Deadlock players always have a SteamID, and IP bans catch innocent people on shared connections)

## Next

**[4. Setting Up Staff Roles](staff-roles)**: give other people some of these commands.
