---
title: "Setting Up Admins"
sidebar_label: "Setting Up Admins"
---

# Setting Up Admins

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

The server console can always run every command. This page gives your own Steam account the same access in game, then adds moderators. It takes a few minutes.

## 1. Make Yourself Admin

Start the server and join it. The server console will have printed:

```text
[Permissions] No admins yet. Join the server, then make yourself one from the server console or RCON: dw_role_grant <your name> admin
```

So do that, in the **server console**:

```text
dw_role_grant wisp admin
```

Part of your name is enough, or use `#slot` if it matches more than one player. The server answers `Gave wisp (76561197960287930) the role admin.` and saves it to `configs/permissions/players.jsonc`, so it survives restarts.

The `admin` role has `*` (every command from every plugin) and immunity 100, so nobody you add later can kick or ban you.

Check it worked by running `dw_help` in your game console: it lists every command you can use, which now includes the admin ones.

:::tip Setting it up before anyone joins
Write your SteamID64 into `configs/permissions/players.jsonc` and run `dw_perm_reload`:

```jsonc
{
  "76561197960287930": { "roles": ["admin"] }
}
```
:::

## 2. Add Moderators

Open `configs/permissions/roles.jsonc` and add a `moderator` role next to the two that are already there:

```jsonc
{
  "default": { "permissions": [] },
  "admin":   { "permissions": ["*"], "immunity": 100 },

  "moderator": {
    "permissions": [
      "admin.moderation.*",       // kick, ban, gag, mute, slay, who
      "deadworks.admin.notify"    // see which admin did what
    ],
    "immunity": 50
  }
}
```

Run `dw_perm_reload`, then give people the role, from the server console or from your own game console now that you're admin:

```text
dw_role_grant lapka moderator
dw_role_revoke lapka moderator
dw_role_grant newbie moderator --temp     until the server restarts
```

Moderators can use every moderation command but can't change the map, settings or anyone's roles. With immunity 50 they can act on players and on each other, but not on you.

That's a complete setup. The rest of this page is for when you want more than that.

## More Ranks

`inherits` builds a ladder, so each rank only lists what it adds:

```jsonc
"moderator": {
  "permissions": ["admin.moderation.*", "deadworks.admin.notify"],
  "immunity": 50
},
"senioradmin": {
  "inherits": ["moderator"],
  "permissions": [
    "admin.server.*",               // map, cvar, execcfg, rcon...
    "-admin.server.rcon",           // ...except rcon
    "deadworks.permissions.manage"  // may hire and fire moderators
  ],
  "immunity": 90
}
```

Anyone with `deadworks.permissions.manage` can run `dw_role_grant` and `dw_role_revoke` themselves, but only on players with lower immunity than their own, and only to hand out roles whose permissions they already hold and whose immunity is below theirs. A senior admin can hire moderators, but can't make anyone admin.

:::danger Don't give out `admin.server.rcon` lightly
Console commands skip permission checks, so someone with `rcon` can run `dw_role_grant` on themselves. Only give it to people you'd give `*` to.
:::

## One Player, One Exception

Give or take a single permission without making a new role:

```text
dw_perm_grant lapka admin.server.map        this moderator may also change map
dw_perm_grant lapka -admin.moderation.ban   this moderator may not ban
```

A permission on a player beats every role they hold.

## If It Doesn't Work

Run `dw_perm_check` with the player and the command they tried. It says what the command needs and why they do or don't have it:

```text
] dw_perm_check lapka ban
lapka (76561197960287931): ban (Admin) needs admin.moderation.ban, which is allowed by "admin.moderation.*" from role:moderator
```

- **"...your roles apply once Steam has confirmed your account"**: wait a few seconds after joining. If it never goes away, the server can't reach Steam. On a LAN or offline server, set `"require_steam_auth": false` under `"permissions"` in `configs/deadworks.jsonc` and restart (or turn `sv_lan` on). Never do this on a server reachable from the internet.
- **`Roles: none` in `dw_perm_list <player>`**: the SteamID in `players.jsonc` isn't theirs. Compare it with the one `dw_perm_list` shows.
- **"Failed to reload permissions"**: there's a typo in one of the files. The reply names the file, line and column. The previous settings keep working until you fix it.
- **Staff say they were refused a command**: the server console, and the admin log for anyone with a role, records each refusal with the permission they were missing.

## Next

- [Admin Commands](admin-commands): kicking, banning, gagging and changing map.
- [How Permissions Work](permissions): every rule, file and console command, and how to change what a plugin's commands require.
