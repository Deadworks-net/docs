---
title: "Making Yourself Admin"
sidebar_label: "1. Make Yourself Admin"
---

# Making Yourself Admin

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

**Step 1 of 6** in [Admins & Permissions](/permissions). Start here.

As the server owner you can already run every command from the **server console**. This guide gives your own Steam account the same access, so you can use admin commands from in-game chat and your game console as well.

It takes about a minute.

## From the Server Console

You don't need to look up your SteamID for this. Until `players.jsonc` has anyone in it, the server reminds you at startup, and again with your SteamID when you join: `[Permissions] No admins yet. To make lapka one, run this in the server console or over RCON: dw_role_grant 76561197960287931 admin`

:::tip Where's the server console?
- **Windows:** the window `deadworks.exe` runs in. Type straight into it.
- **Docker:** `docker compose exec deadworks console dw_role_grant <your name> admin` (see [Linux with Docker](linux-docker#console)).
- **A rented server:** the console in your server's control panel.
- **Anywhere with RCON:** send the same command over RCON.
:::

1. Start your server and join it from the game.
2. In the **server console** window, run:

   ```text
   dw_role_grant <your name> admin
   ```

   Use your in-game name, or part of it, for example `dw_role_grant wisp admin`. If the name matches more than one player, use your slot number instead, like `#0`. A name with a space in it needs quotes: `dw_role_grant "Big Dave" admin`.

3. The server replies with something like:

   ```text
   Gave wisp (76561197960287930) the role admin.
   ```

The change is saved to `configs/permissions/players.jsonc`, so it's still there after a restart.

## Or Edit the Files Yourself

You can also make yourself admin, and set up everyone else, by editing the permission files directly, for example to do it before anyone joins. See [5. How Permissions Work](admins-and-permissions) to learn about the files.

## Check That It Worked

Run this in the server console:

```text
dw_perm_list <your name>
```

You should see `Roles: admin` and `Immunity: 100`.

In game, open your console and run `dw_help`. It lists every command on the server, including admin-only ones. You can also try an admin command in chat.

## What "admin" Gives You

The `admin` role comes with every server. It has the permission `*`, which means **everything**: every command from every plugin, now and in the future, plus the built-in commands for managing plugins and permissions.

It also has immunity 100, so staff you add later with lower immunity can't kick or ban you, or change your roles.

## FAQ

<details>
<summary>It says "your roles apply once Steam has confirmed your account"</summary>

Wait a few seconds after joining and try again. Your permissions only apply once Steam has confirmed your account, which happens shortly after you connect.

If the message never goes away, your server probably isn't logged into Steam, for example on a LAN or offline setup. See the next question.

</details>

<details>
<summary>Steam never confirms me ("Not validated by Steam yet")</summary>

Run `dw_perm_list <your name>` in the server console. If it says **"Not validated by Steam yet"** and never changes, your server probably isn't logged into Steam.

- **On a LAN server**, set `sv_lan 1` and restart, and the wait is skipped.
- **Otherwise**, set `"require_steam_auth": false` under `"permissions"` in `configs/deadworks.jsonc` and restart.

Only do either on a server nobody untrusted can reach: without Steam checks, anyone can claim your SteamID and get your permissions. See [Steam Validation](admins-and-permissions#steam-validation).

</details>

<details>
<summary>It says "You don't have permission to use this command."</summary>

Run `dw_perm_check <your name> <command>` in the server console, e.g. `dw_perm_check wisp ban`. It says which permission the command needs, whether you have it, and why.

Then run `dw_perm_list <your name>`. If it shows `Roles: none`, the SteamID in `players.jsonc` isn't yours. Compare it with the number `dw_perm_list` shows next to your name.

</details>

<details>
<summary><code>dw_perm_list</code> shows a warning about <code>permissions.store</code> or <code>deadworks.jsonc</code></summary>

- **`permissions.store is '<name>', but no plugin has registered that store`**: `permissions.store` in `configs/deadworks.jsonc` names a store from a plugin that isn't loaded, and until it loads nobody has permissions. Set it back to `"json"` to use the files from this guide.
- **`deadworks.jsonc has an error, so Deadworks doesn't know which permission store to use`**: fix the error in `configs/deadworks.jsonc` and restart the server. The server console shows where the error is.

</details>

<details>
<summary><code>dw_perm_reload</code> says "Failed to reload permissions"</summary>

There's a mistake in one of the files, for example a missing comma or quote. The reply says which file, and the line and column of the error. Your previous settings stay in use until you fix it and run `dw_perm_reload` again.

</details>

<details>
<summary><code>dw_role_grant</code> says "No player matches"</summary>

Make sure you've fully joined the server, or use your SteamID instead of your name:

```text
dw_role_grant 76561197960287930 admin
```

</details>

## Next

**[2. Admin Commands](admin-commands)**: every admin command, and how to pick players with `@enemy`, `#slot` and more.
