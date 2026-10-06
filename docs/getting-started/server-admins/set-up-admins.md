---
title: "Set up admins"
sidebar_label: "3. Set up admins"
---

# Set up admins

**Step 3 of 4** in [Getting started for server admins](/getting-started/server-admins). Admins are players with the `admin` role, which lets them use every command on the server.

The server console can always run every command. Nobody else can use admin commands until you give them a role.

## Make yourself admin

1. Start the server and join it from the game.
2. In the server console, run:

   ```text
   dw_role_grant <your name> admin
   ```

   Put quotes around a name with spaces: `dw_role_grant "Big Dave" admin`.

3. The server replies:

   ```text
   Gave wisp (76561197960287930) the role admin.
   ```

Your role applies once Steam confirms your account, a few seconds after you join. It is saved in `configs\permissions\players.jsonc` and lasts across restarts.

To check, run `dw_perm_list <your name>`. It shows `Roles: admin` and `Immunity: 100`.

## Add other admins

Run the same command for each person while they're on the server:

```text
dw_role_grant lapka admin
```

For someone who isn't on the server, use their SteamID: `dw_role_grant 76561197960287931 admin`. To take the role away:

```text
dw_role_revoke lapka admin
```

:::tip Give staff less than everything
The `admin` role can do anything, including `rcon`. For moderators who can only kick, gag and ban, follow [Setting up staff roles](../../guides/staff-roles).
:::

## Lock down a plugin's commands

Commands from a plugin without permissions work for everyone. To make one admin only, require a permission for it in `configs\permissions\overrides.jsonc`:

```jsonc
{
  "commands": {
    "givesouls": "myserver.cheats"
  }
}
```

Then run `dw_perm_reload`. The `admin` role has every permission, so admins can still use it. `configs\permissions\generated\` lists every plugin's commands.

## Next

**[4. Use admin tools](use-admin-tools)**

For roles, immunity and every permission file, see [How permissions work](../../guides/admins-and-permissions).
