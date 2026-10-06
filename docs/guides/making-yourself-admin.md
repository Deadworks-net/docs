---
title: "Making yourself admin"
sidebar_label: "1. Make yourself admin"
---

# Making yourself admin

**Step 1 of 4** in [Admins & Permissions](/permissions). Start here.

The **server console** can already run every command. Giving your Steam account the `admin` role lets you run admin commands from chat and your game console too.

## Make yourself admin

1. Start your server and join it from the game.
2. In the server console window, or over Remote Console (RCON), run:

   ```text
   dw_role_grant <your name> admin
   ```

3. Check the reply in the server console:

   ```text
   Gave wisp (76561197960287930) the role admin.
   ```

Put quotes around a name with spaces: `dw_role_grant "Big Dave" admin`.

The change is saved to `configs/permissions/players.jsonc`. It stays after a restart.

While nobody has a role, the server console prints a reminder each time a player joins. The reminder includes the exact command to make that player admin by SteamID:

```text
[Permissions] No admins yet. To make wisp one, run this in the server console or over RCON: dw_role_grant 76561197960287930 admin
```

## Check that it worked

Run this in the server console:

```text
dw_perm_list <your name>
```

The output includes `Roles: admin` and `Immunity: 100`.

:::note
Your roles apply once Steam confirms your account, a few seconds after you join. Until then, `dw_perm_list` shows `Not validated by Steam yet`, and admin commands report that they're waiting for Steam. Wait a few seconds and try again.
:::

In game, open your game console and run `dw_help`. It lists every command on the server, including admin-only ones. You can also try an admin command in chat.

## Or edit the files yourself

The permission files can also make you admin and set up everyone else. Editing them works before anyone has joined. See [3. How permissions work](admins-and-permissions) for the files.

## Next

**[2. Admin commands](admin-commands)**: every admin command, and how to pick players with `@enemy`, `#slot` and more.
