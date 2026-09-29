---
title: "Setting Up Staff Roles"
sidebar_label: "3. Staff Roles"
---

# Setting Up Staff Roles

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

**Step 3 of 6** in [Admins & Permissions](/permissions). Before this: [admin commands](admin-commands).

This guide sets up a typical staff team for the [Admin plugin](admin-commands): trial moderators, moderators, admins and an owner, where each rank can do a bit more than the one below it and can't act against the ranks above.

It assumes you've read [Making Yourself Admin](making-yourself-admin). For how roles, wildcards and immunity work in general, see [How Permissions Work](admins-and-permissions).

## The Plan

| | Trial Mod | Moderator | Admin | Owner |
|---|:---:|:---:|:---:|:---:|
| Kick, gag, mute, `who` | ✅ | ✅ | ✅ | ✅ |
| Bans (including permanent and offline), unban, slay | | ✅ | ✅ | ✅ |
| Change map, run configs | | | ✅ | ✅ |
| Add and remove staff | | | ✅ (trial mods and moderators, see [Step 3](#step-3-let-admins-manage-staff)) | ✅ (up to Admin) |
| Cvars (including `sv_cheats` and passwords), `rcon`, everything else | | | | ✅ |
| Immunity | 10 | 50 | 90 | 100 |

Immunity decides who can act on whom. Everyone can kick, ban or slay players with the same or lower immunity, and nobody can act on anyone higher. So moderators can't kick admins, but two admins can kick each other. If you're the only owner at 100, only the server console can act on you. Changing someone's roles is stricter: see [Step 3](#step-3-let-admins-manage-staff).

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
      "admin.moderation.mute",
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
      "admin.server.*",
      "-admin.server.rcon",
      "-admin.server.cvar",
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

Run these in the server console, not your game console. Nobody can change their own roles from in game, and the server console isn't limited by permissions.
:::

Then load it:

```text
dw_perm_reload
dw_role_list
```

### What Each Part Does

- **`inherits`** passes permissions up the ladder. A moderator gets everything a trial mod has, plus their own. An admin gets everything a moderator has.
- **Immunity** is set on each role here. A role without an `immunity` would take the highest one among the roles it inherits.
- **`deadworks.admin.notify`** lets staff see *who* did something when the server announces an admin action. Players only see "ADMIN: …". Because every other staff role inherits from `trialmod`, they all get it.
- **`admin.moderation.ban`** covers permanent bans and banning players who've left by SteamID, so moderators can do both. Keep `ban` for people you trust with that.
- **The admin role** gets the whole server group except `rcon` and `cvar`, which leaves changing map and running configs. The denies (`-`) take those two out of the `admin.server.*` wildcard, because an exact entry beats a wildcard in the same role. `cvar` is left to the owner because it also covers `sv_cheats` and passwords like `sv_password`.
- **`deadworks.permissions.manage`** lets admins add and remove staff. See [Step 3](#step-3-let-admins-manage-staff).
- **The owner** has `*`: everything, including permissions that plugins add later.

## Step 2: Add Your Staff

From the server console, or in game as the owner:

```text
dw_role_grant greeny trialmod
dw_role_grant lapka moderator
dw_role_grant mastardy admin
```

You can use part of their name or `#slot` while they're on the server. For someone who isn't, use their SteamID, or the exact name saved with their entry in `players.jsonc`. This saves to `players.jsonc`, so it lasts across restarts.

**Promoting someone:** grant the new role and take away the old one.

```text
dw_role_grant <player> moderator
dw_role_revoke <player> trialmod
```

Keeping the old role wouldn't give them anything extra, because it's inherited. It would only clutter `players.jsonc`.

**Trying someone out for a session:** add `--temp` and the role disappears when the server restarts.

```text
dw_role_grant newbie trialmod --temp
```

**Removing someone from staff:**

```text
dw_role_revoke <player> moderator
```

A role that has since been deleted from `roles.jsonc` can still be revoked.

## Step 3: Let Admins Manage Staff

Admins have `deadworks.permissions.manage`, so they can run `dw_role_grant` and `dw_role_revoke` from their own console. These rules stop that getting out of hand:

- **You can only give out a role if you hold everything it gives,** including what it inherits. A role that denies something doesn't give it, so you don't need that. An admin holds everything `moderator` and `trialmod` give.
- **The role's immunity must be lower than yours.** An admin (90) can hand out `trialmod` (10) and `moderator` (50), but not `admin` or `owner`: `You can't give out admin: its immunity (90) isn't lower than yours (90).`
- **You can only change players whose immunity is lower than yours.** Equal isn't enough. An admin can promote or demote moderators, trial mods and players with no role, but not other admins or the owner. Once someone is an admin, only the owner or the server console can change their roles.
- **Nobody can change their own roles or permissions.**
- **The owner (100) can only be changed from the server console,** because nobody has higher immunity.

The same rules apply to single permissions with `dw_perm_grant`: an admin can't hand out `admin.server.rcon`, because they don't have it. Removing a deny from someone counts as giving them the permission, so an admin can't lift `-admin.server.rcon` from a player either:

```text
Removing -admin.server.rcon would give lapka (76561197960287931) admin.server.rcon, which you don't hold yourself.
```

When a rule stops someone, the reply says which one, for example `You can't change mastardy (76561197960287933): you need higher immunity than theirs (90).`

Role and permission changes (`dw_role_*`, `dw_perm_*`) are written to the admin log in `logs/admin/`, with who made them, so you can always see who promoted whom.

Want senior moderators who manage trial mods and nobody else? Give them a role that inherits `trialmod`, adds `deadworks.permissions.manage`, and has immunity above trial mods but below moderators, such as 30. They can hire and fire trial mods, but can't hand out their own role (its immunity isn't lower than theirs) or touch moderators.

## Step 4: Check It

```text
] dw_perm_check greeny admin.moderation.ban
greeny (76561197960287932): admin.moderation.ban is denied: no grant matches

] dw_perm_check lapka admin.moderation.ban
lapka (76561197960287931): admin.moderation.ban is allowed by "admin.moderation.ban" from role:moderator

] dw_perm_check mastardy admin.moderation.ban
mastardy (76561197960287933): admin.moderation.ban is allowed by "admin.moderation.ban" from role:moderator (via admin)

] dw_perm_check mastardy admin.server.rcon
mastardy (76561197960287933): admin.server.rcon is denied by "-admin.server.rcon" from role:admin
```

`dw_perm_list <player>` shows everything about one person: their roles, what they inherit, and their immunity.

Admin plugin actions are written to `logs/admin/`, one file per day. It's worth reading now and then, especially after adding new staff.

## One Player, One Exception

To give or take away a single permission for one person without making a new role, grant it directly:

This lets moderator lapka also change map, and stops admin mastardy changing map:

```text
dw_perm_grant lapka admin.server.map
dw_perm_grant mastardy -admin.server.map
```

A player's own entry is checked before any of their roles, so anything you put there always wins.

## Next

**[4. Changing Command Access](overriding-command-permissions)**: lock or unlock a specific plugin's commands.
