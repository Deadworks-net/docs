---
title: "Making Yourself Admin"
sidebar_label: "1. Make Yourself Admin"
---

# Making Yourself Admin

**Step 1 of 4** in [Admins & Permissions](/permissions). Start here.

As the server owner you can already run every command from the **server console**. This guide gives your own Steam account the same access, so you can use admin commands from in-game chat and your game console as well.

It takes about a minute.

## Make Yourself Admin

1. Start your server and join it from the game.
2. In the **server console** window (or over RCON), run:

   ```text
   dw_role_grant <your name> admin
   ```

3. The server replies with something like:

   ```text
   Gave wisp (76561197960287930) the role admin.
   ```

Put quotes around a name with spaces: `dw_role_grant "Big Dave" admin`.

The change is saved to `configs/permissions/players.jsonc`, so it's still there after a restart.

Until anyone has a role, the server console reminds you how to do this. When a player joins, it prints the exact command to make them admin by SteamID:

```text
[Permissions] No admins yet. To make wisp one, run this in the server console or over RCON: dw_role_grant 76561197960287930 admin
```

## Check That It Worked

Run this in the server console:

```text
dw_perm_list <your name>
```

You should see `Roles: admin` and `Immunity: 100`.

Your roles apply once Steam has confirmed your account, a few seconds after you join. Until then, `dw_perm_list` shows `Not validated by Steam yet`, and admin commands tell you they're waiting for Steam.

In game, open your console and run `dw_help`. It lists every command on the server, including admin-only ones. You can also try an admin command in chat.

## Or Edit the Files Yourself

You can also make yourself admin, and set up everyone else, by editing the permission files directly, for example to do it before anyone joins. See [3. How Permissions Work](admins-and-permissions) to learn about the files.

## Next

**[2. Admin Commands](admin-commands)**: every admin command, and how to pick players with `@enemy`, `#slot` and more.
