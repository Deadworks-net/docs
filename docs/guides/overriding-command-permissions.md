---
title: "Changing Who Can Use a Plugin's Commands"
sidebar_label: "5. Changing Command Access"
---

# Changing Who Can Use a Plugin's Commands

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

**Step 5 of 7** in [Admins & Permissions](/permissions). Before this: [staff roles](staff-roles).

Plugins decide their own defaults. Some commands are open to everyone, others need a permission. You don't always agree with those choices:

- A plugin lets **anyone** run a command you only want staff to use, like giving themselves souls.
- A plugin **locks** a command you're happy for everyone to use.

You can change either one in `configs/permissions/overrides.jsonc` without editing or rebuilding the plugin. This guide shows both, using the example plugins that ship with Deadworks.

If you haven't set up admins yet, do [Making Yourself Admin](making-yourself-admin) first.

## Step 1: Find the Command

Every plugin gets a file in `configs/permissions/generated/` that lists its commands and what they currently require. For the **Item Test** plugin, open `generated/ItemTestPlugin.jsonc` and find the command:

```jsonc
{
  /* !givesouls / /givesouls / dw_givesouls: Give yourself souls (default 50000) */
  /* Anyone can run it. */
  "name": "givesouls",
  "aliases": [],
  "description": "Give yourself souls (default 50000)",
  "permission": "",
  "targetImmunity": "Ignore"
}
```

Two things matter here:

- `"name"` is what you'll use in the override: `givesouls`.
- `"permission"` is what the command needs right now. Empty, with the comment `Anyone can run it.`, means it's open to everyone.

:::note Don't edit the generated files
They're rewritten every time the plugin loads. Only read them; make changes in `overrides.jsonc`.
:::

## Restrict an Open Command

Let's make `!givesouls` staff-only.

### 1. Require a Permission

Open `configs/permissions/overrides.jsonc` and add the command under `"commands"`:

```jsonc
{
  "commands": {
    "givesouls": "itemtest.cheats"
  }
}
```

The permission name is up to you. Following the plugin's naming (`itemtest.` + something that describes it) keeps things tidy, and lets you grant a whole plugin at once with `itemtest.*`. You can reuse the same name for several commands to control them together:

```jsonc
{
  "commands": {
    "givesouls":  "itemtest.cheats",
    "additem":    "itemtest.cheats",
    "giveimbued": "itemtest.cheats"
  }
}
```

### 2. Reload

In the server console:

```text
dw_perm_reload
```

Now only players with `itemtest.cheats` can use `!givesouls`. Everyone else gets `You don't have permission to use this command.` Admins with `*` still can, and so can the server console.

The generated file now shows the change:

```jsonc
{
  /* !givesouls / /givesouls / dw_givesouls: Give yourself souls (default 50000) */
  /* OVERRIDDEN in overrides.jsonc. The plugin asks for no permission. */
  "name": "givesouls",
  "aliases": [],
  "description": "Give yourself souls (default 50000)",
  "permission": "itemtest.cheats",
  "declaredPermission": "",
  "targetImmunity": "Enforce"
}
```

### 3. Give It to the Right People

A permission nobody has only works for admins. To let another group use it, add it to a role in `configs/permissions/roles.jsonc`:

```jsonc
{
  "moderator": {
    "permissions": ["itemtest.cheats"]
  }
}
```

Or give it to one player from the server console:

```text
dw_perm_grant wisp itemtest.cheats
```

Run `dw_perm_reload` after editing `roles.jsonc`. `dw_perm_grant` applies straight away.

## Open Up a Locked Command

Now the other way round. The **Item Rotation** plugin locks `!ir_start` behind `itemrotation.manage`, and you want anyone to be able to start a round. In `generated/ItemRotationPlugin.jsonc`:

```jsonc
{
  /* !ir_start / /ir_start / dw_ir_start: Start the item-rotation game */
  "name": "ir_start",
  "aliases": [],
  "description": "Start the item-rotation game",
  "permission": "itemrotation.manage",
  "targetImmunity": "Enforce"
}
```

There are two ways to open it up. Pick based on whether you might ever want to stop a specific player from using it.

### Option A: Make It Public

Set the command's permission to an empty string in `overrides.jsonc`:

```jsonc
{
  "commands": {
    "ir_start": ""
  }
}
```

Run `dw_perm_reload`. The command now works for everyone, exactly as if the plugin had never locked it. The generated file shows `Anyone can run it.` and `OVERRIDDEN in overrides.jsonc. The plugin asks for "itemrotation.manage".`

This is the simplest option, but there's nothing left to take away. You can't block one troublemaker from a public command.

### Option B: Give the Permission to Everyone

Leave the command as it is and give its permission to the `default` role in `roles.jsonc`. Every player has that role:

```jsonc
{
  "default": {
    "permissions": ["itemrotation.manage"]
  }
}
```

Run `dw_perm_reload`. Everyone can use `!ir_start`, and also `!ir_swap` and `!ir_reset`, which need the same permission. Because it's a permission rather than an open command, you can still take it away from one player:

```text
dw_perm_grant troublemaker -itemrotation.manage
```

The `-` makes it a deny, which beats the `default` role's grant.

If you only want to open `ir_start` and not the other two, combine both steps: override `ir_start` to a permission of its own, then give that to `default`.

```jsonc
// overrides.jsonc
{
  "commands": {
    "ir_start": "itemrotation.start"
  }
}
```

```jsonc
// roles.jsonc
{
  "default": {
    "permissions": ["itemrotation.start"]
  }
}
```

## Check Your Changes

- The plugin's file in `generated/` shows each command's current `"permission"` and marks overridden ones with `OVERRIDDEN`.
- `dw_perm_check <player> <permission>` shows whether a player has a permission and why:

  ```text
  ] dw_perm_check wisp itemtest.cheats
  wisp (76561197960287930): itemtest.cheats is allowed by "*" from role:admin
  ```

- In game, `dw_help` in the console only lists the commands you're allowed to run.

## Good to Know

- **Use the command's name**, without `!`, `/` or `dw_`. `"givesouls"`, `"!givesouls"` and `"dw_givesouls"` all work and mean the same thing.
- **One entry covers the aliases.** If a command has aliases (listed in `"aliases"`), overriding any of its names changes all of them.
- **Same name in two plugins.** If two plugins both have a command called `ban`, an override for `ban` applies to both.
- **Immunity follows the permission.** By default, commands that need a permission can't target players with higher immunity, and public ones can. When you override a command, the generated file's `"targetImmunity"` shows which applies now. For example, `givesouls` changed from `Ignore` to `Enforce` above.
- **Server-console-only commands stay that way.** Some commands are marked `Server console only; players can never run it.` in the generated file. Overrides can't open those to players.
- **Older plugins.** Commands from plugins built before `[Command]` existed don't appear in the generated files and can't be overridden. Ask the author to update, or disable the plugin with `dw_plugin disable <name>`.
- **Removing an override** puts the command back to what the plugin chose. Delete the line and run `dw_perm_reload`.

## Next

**[6. How Permissions Work](admins-and-permissions)**: the full reference for roles, wildcards, immunity and every console command.
