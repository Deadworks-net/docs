---
title: "Making Yourself Admin"
sidebar_label: "Making Yourself Admin"
---

# Making Yourself Admin

As the server owner you can already run every command from the **server console**. This guide gives your own Steam account the same access, so you can use admin commands from in-game chat and your game console as well.

It takes about a minute. There are two ways to do it; pick one.

## Option A: From the Server Console (easiest)

You don't need to look up your SteamID for this.

1. Start your server and join it from the game.
2. In the **server console** window, run:

   ```text
   dw_role_grant <your name> admin
   ```

   Use your in-game name, or just part of it, for example `dw_role_grant wisp admin`. If the name matches more than one player, use your slot number instead, like `#0`.

3. The server replies with something like:

   ```text
   Gave wisp (76561197960287930) the role admin.
   ```

That's it. The change is saved to `configs/permissions/players.jsonc`, so it's still there after a restart.

## Option B: By Editing the File

Use this if you want to set things up before anyone joins.

1. Find your SteamID64, the 17-digit number starting with `7656…`. You can get it by pasting your Steam profile link into a site like [steamid.io](https://steamid.io).
2. Start the server once so Deadworks creates its config files, then open:

   ```text
   game/bin/win64/configs/permissions/players.jsonc
   ```

3. Add your SteamID with the `admin` role:

   ```jsonc
   {
     "76561197960287930": { "roles": ["admin"] }
   }
   ```

   To add more people, separate the entries with commas:

   ```jsonc
   {
     "76561197960287930": { "roles": ["admin"] },
     "76561197960287931": { "roles": ["admin"] }
   }
   ```

4. Save the file and run `dw_perm_reload` in the server console, or restart the server.

## Check That It Worked

Run this in the server console:

```text
dw_perm_list <your name>
```

You should see `Roles: admin` and `Immunity: 100`.

In game, open your console and run `dw_help`. It now lists every command on the server, including admin-only ones. You can also just try an admin command in chat.

## What "admin" Gives You

The `admin` role comes with every server. It has the permission `*`, which means **everything**: every command from every plugin, now and in the future, plus the built-in commands for managing plugins and permissions.

It also has immunity 100, so staff you add later with lower immunity can't kick or ban you.

## If It Doesn't Work

**"You don't have permission to use this command."**

- Wait a few seconds after joining and try again. Your permissions only apply once Steam has confirmed your identity, which happens shortly after you connect.
- Run `dw_perm_list <your name>` in the server console. If it says **"Not validated by Steam yet"** and never changes, you're probably on a LAN or offline setup. Set `"require_steam_auth": false` under `"permissions"` in `configs/deadworks.jsonc` and restart. Only do this for a server that isn't reachable from the internet.
- If it shows `Roles: none`, the SteamID in `players.jsonc` isn't yours. Compare it with the number `dw_perm_list` shows next to your name.

**`dw_perm_reload` says "Failed to reload permissions"**

There's a typo in one of the files. The server console shows which file and roughly where, for example a missing comma or quote. Your previous settings keep working until you fix it.

**`dw_role_grant` says "No player matches"**

Make sure you've fully joined the server, or use your SteamID instead of your name:

```text
dw_role_grant 76561197960287930 admin
```

## Next Steps

To give other people limited access, such as moderators who can kick but not ban, see [Admins & Permissions](admins-and-permissions).
