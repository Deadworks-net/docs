---
title: "Setting Up Staff Roles"
sidebar_label: "4. Staff Roles"
---

# Setting Up Staff Roles

**Step 4 of 7** in [Admins & Permissions](/permissions). Before this: [the Admin plugin](admin-plugin).

This guide sets up a typical staff team for the [Admin plugin](admin-plugin): trial moderators, moderators, admins and an owner, where each rank can do a bit more than the one below it and can't act against the ranks above.

It assumes you've read [Making Yourself Admin](making-yourself-admin). For how roles, wildcards and immunity work in general, see [How Permissions Work](admins-and-permissions).

## The Plan

| | Trial Mod | Moderator | Admin | Owner |
|---|:---:|:---:|:---:|:---:|
| Kick, gag, `who` | ✅ | ✅ | ✅ | ✅ |
| Temporary bans, unban, slay | | ✅ | ✅ | ✅ |
| Permanent and offline bans | | | ✅ | ✅ |
| Change map, cvars, configs | | | ✅ | ✅ |
| Add and remove staff | | | ✅ (up to Admin) | ✅ |
| `rcon`, passwords, everything else | | | | ✅ |
| Immunity | 10 | 50 | 90 | 100 |

Immunity decides who can act on whom. Everyone can act on players with the same or lower immunity, and nobody can act on anyone higher. So moderators can't kick admins, and nobody but the server console can touch the owner.

## Step 1: Write the Roles

Replace the contents of `configs/permissions/roles.jsonc` with:

```jsonc
{
  "default": {
    "permissions": []
  },

  "trialmod": {
    "permissions": [
      "admin.moderation.kick",
      "admin.moderation.gag",
      "admin.moderation.who",
      "deadworks.admin.notify"
    ],
    "immunity": 10
  },

  "moderator": {
    "inherits": ["trialmod"],
    "permissions": [
      "admin.moderation.ban",
      "admin.moderation.unban",
      "admin.moderation.slay"
    ],
    "immunity": 50
  },

  "admin": {
    "inherits": ["moderator"],
    "permissions": [
      "admin.moderation.*",
      "admin.server.*",
      "-admin.server.rcon",
      "-admin.server.cvar.protected",
      "deadworks.permissions.view",
      "deadworks.permissions.manage"
    ],
    "immunity": 90
  },

  "owner": {
    "permissions": ["*"],
    "immunity": 100
  }
}
```

:::caution If you already made yourself admin
The default `admin` role has `*`. This setup turns `admin` into a smaller role and puts `*` on a new `owner` role. After reloading, move yourself across from the **server console**:

```text
dw_role_grant <your name> owner
dw_role_revoke <your name> admin
```

Run these in the server console, not your game console. Once `admin` is smaller, it can't hand out `owner`, and the server console isn't limited by permissions.
:::

Then load it:

```text
dw_perm_reload
dw_role_list
```

### What Each Part Does

- **`inherits`** passes permissions up the ladder. A moderator gets everything a trial mod has, plus their own. An admin gets everything a moderator has.
- **Immunity is not inherited.** Each role sets its own.
- **`deadworks.admin.notify`** lets staff see *who* did something when the server announces an admin action. Players only see "ADMIN: …". Because every other staff role inherits from `trialmod`, they all get it.
- **The admin role** gets the whole moderation group, which adds permanent and offline bans, and the whole server group except `rcon` and password cvars. Denies (`-`) take those two out of the `admin.server.*` wildcard.
- **`deadworks.permissions.manage`** lets admins add and remove staff. See [Step 3](#step-3-let-admins-manage-staff).
- **The owner** has `*`: everything, including permissions that plugins add later.

## Step 2: Add Your Staff

With them on the server, from the server console or as the owner:

```text
dw_role_grant greeny trialmod
dw_role_grant lapka moderator
dw_role_grant mastardy admin
```

You can use part of their name, `#slot`, or their SteamID, which also works when they're offline. This saves to `players.jsonc`, so it lasts across restarts.

**Promoting someone:** grant the new role and take away the old one.

```text
dw_role_grant greeny moderator
dw_role_revoke greeny trialmod
```

Keeping the old role wouldn't give them anything extra, because it's inherited. It would just clutter `players.jsonc`.

**Trying someone out for a session:** add `--temp` and the role disappears when the server restarts.

```text
dw_role_grant newbie trialmod --temp
```

**Removing someone from staff:**

```text
dw_role_revoke lapka moderator
```

## Step 3: Let Admins Manage Staff

Admins have `deadworks.permissions.manage`, so they can run `dw_role_grant` and `dw_role_revoke` from their own console. Two rules stop that getting out of hand:

- **You can only give out roles you hold yourself.** An admin holds `admin`, and through `inherits` also `moderator` and `trialmod`. So they can hire trial mods, moderators and other admins, but can't make anyone an owner.
- **You can't change anyone with higher immunity than you.** An admin (90) can demote a moderator (50), but not the owner (100).

The same rules apply to single permissions with `dw_perm_grant`: an admin can't hand out `admin.server.rcon`, because they don't have it.

Want senior moderators to manage trial mods but nobody else? Give them `deadworks.permissions.manage` in a role that only inherits `trialmod`, and a higher immunity than trial mods.

## Step 4: Check It

```text
] dw_perm_check greeny admin.moderation.ban
greeny (76561197960287932): admin.moderation.ban is denied: no grant matches

] dw_perm_check lapka admin.moderation.ban
lapka (76561197960287931): admin.moderation.ban is allowed by "admin.moderation.ban" from role:moderator

] dw_perm_check mastardy admin.server.rcon
mastardy (76561197960287933): admin.server.rcon is denied by "-admin.server.rcon" from role:admin
```

`dw_perm_list <player>` shows everything about one person: their roles, what they inherit, and their immunity.

Staff actions are written to `logs/admin/`, one file per day. It's worth reading now and then, especially after adding new staff.

## Other Roles You Might Want

Roles don't have to be a ladder. A few common extras:

**Event host**: runs events, but doesn't moderate.

```jsonc
"eventhost": {
  "permissions": [
    "admin.server.map",
    "admin.moderation.slay",
    "deadworks.admin.notify"
  ]
}
```

With no immunity, an event host can only slay players who also have none, never staff.

**Server technician**: manages plugins and configs, never touches players.

```jsonc
"tech": {
  "permissions": [
    "admin.server.config",
    "admin.server.cvar",
    "deadworks.plugins.manage",
    "deadworks.config.reload",
    "deadworks.permissions.reload"
  ]
}
```

**Supporters or VIPs** don't need anything from the Admin plugin. Give them permissions from whichever plugins provide perks on your server. Each plugin's permissions are listed in `configs/permissions/generated/`.

A player can hold several roles. They get the permissions of all of them and the highest immunity among them.

## One Player, One Exception

To give or take away a single permission for one person without making a new role, grant it directly:

```text
dw_perm_grant lapka admin.moderation.ban.permanent      # this moderator may also perma-ban
dw_perm_grant mastardy -admin.server.map                # this admin can't change map
```

A permission given to a player by its exact name always wins over their roles.

## Things to Avoid

**Don't put denies in a role that other roles inherit.** A deny inherited from a lower role can't be undone by the higher role, because they're compared as equals and the deny wins the tie. For example, if `moderator` had `"-admin.moderation.ban.permanent"`, admins inheriting from it couldn't perma-ban even with `admin.moderation.*`. That's why `moderator` above lists what it *can* do instead. Keep denies on roles nothing inherits from, like `admin` here, or on individual players.

**Don't give `admin.server.rcon` to anyone you wouldn't make an owner.** Console commands skip permission checks, so `rcon` can do anything, including making someone an owner.

**Don't hand out `*` casually.** It includes permissions from every plugin you'll ever install.

## Next

**[5. Changing Command Access](overriding-command-permissions)**: lock or unlock a specific plugin's commands.
