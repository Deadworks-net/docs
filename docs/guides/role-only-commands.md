---
title: "Commands for one role"
sidebar_label: "Plugin commands for a role"
---

# Commands for one role

A plugin can limit its commands to the players who hold a permission, and a server role can give that permission to exactly the right players. This guide builds a **Medic** plugin that does both:

- `!heal` heals yourself. Only **medics** can use it.
- `!heal <player>` heals someone else. Only **head medics** can do that.
- `!healall` heals everyone. Also head medics only.

Requirements:

- A plugin project. If you don't have one, start with [Project setup](../getting-started/developers/setup) and [Your first plugin](../getting-started/developers/first-plugin).
- Knowing [how permissions work](admins-and-permissions).

## Part 1: The plugin

### Write the commands

```csharp
using DeadworksManaged.Api;

namespace MedicPlugin;

[DeclarePermission("medic.heal.others", Description = "Heal players other than yourself with !heal")]
public class MedicPlugin : DeadworksPluginBase
{
    public override string Name => "Medic";

    [Command("heal",
        Description = "Heal yourself, or another player if you're allowed",
        Permission = "medic.heal.self",
        TargetImmunity = TargetImmunity.Ignore)]
    public void CmdHeal(Caller caller, Target? target = null)
    {
        var player = target?.Single() ?? caller.Player
            ?? throw new CommandException("Name a player to heal.");

        if (player.Slot != caller.Player?.Slot && !caller.HasPermission("medic.heal.others"))
            throw new CommandException("You can only heal yourself.");

        Heal(player);
        caller.Reply($"Healed {player.PlayerName}.");
    }

    [Command("healall", Description = "Heal every player", Permission = "medic.heal.all")]
    public void CmdHealAll(Caller caller)
    {
        foreach (var player in Players.GetAll())
            Heal(player);

        Chat.PrintToChatAll("Everyone has been healed!");
    }

    private static void Heal(CCitadelPlayerController player)
    {
        var pawn = player.GetHeroPawn();
        if (pawn != null)
            pawn.Health = pawn.GetMaxHealth();
    }
}
```

### What each part does

**`Permission = "medic.heal.self"`** locks the command. Before `CmdHeal` runs, Deadworks checks that the player has `medic.heal.self`. If they don't, they see `You don't have permission to use this command.` Your method never runs, so it needs no `if` for this.

**Permission names** start with your plugin's name (`medic.`), then get more specific: `medic.heal.self`, `medic.heal.others`, `medic.heal.all`. Server owners can then grant everything at once with `medic.*`, or all healing with `medic.heal.*`. There's no plain `medic.heal`. Don't make a permission name also the start of other names, so every name is clearly either a permission or a group.

**`Caller caller`** is whoever ran the command: a player, or the server console.

- `caller.Player` is the player's controller. It's `null` for the console, or once the player has left.
- `caller.Reply(...)` answers in the player's chat or the server console.
- `caller.HasPermission(...)` is always `true` for the console.

So the console can run `dw_heal lapka`. `dw_heal` on its own tells it to name a player, since the console has no hero.

**`caller.HasPermission("medic.heal.others")`** is for checks that depend on how the command is used. Anyone with `medic.heal.self` can run `!heal`, but only some of them may heal *other* players, so the method checks that itself. Throwing a `CommandException` sends its message back to whoever ran the command.

**`[DeclarePermission]`** lists `medic.heal.others` for server owners. Permissions on `[Command]` are listed automatically, but Deadworks can't see checks inside your code without this attribute. Without it, the console also warns that the plugin checks a permission nothing declares. That warning is how Deadworks catches typos.

**`Target? target = null`** lets the player optionally name someone: `!heal`, `!heal wisp`, `!heal #3`. With nothing typed, `target` is `null` and the method heals the caller. `target.Single()` makes sure the name matched exactly one player.

**`TargetImmunity = TargetImmunity.Ignore`** turns off the immunity check. By default, commands with a permission can't target players with higher [immunity](../features/permissions#immunity), which suits kick or ban. Healing doesn't hurt anyone, so this lets a medic heal an admin too.

### Build and install

Build the plugin and copy the DLL into the server's plugins folder. When it loads, Deadworks writes `configs/permissions/generated/MedicPlugin.jsonc`, named after the DLL. The file lists the plugin's commands and its permissions, sorted by name:

```jsonc
// ============================================================================
//  AUTO-GENERATED. DO NOT EDIT. ...
// ============================================================================
{
  "plugin": "Medic",
  "commands": [
    {
      /* !heal / /heal / dw_heal: Heal yourself, or another player if you're allowed */
      "name": "heal",
      "aliases": [],
      "description": "Heal yourself, or another player if you're allowed",
      "permission": "medic.heal.self",
      "targetImmunity": "Ignore"
    },
    {
      /* !healall / /healall / dw_healall: Heal every player */
      "name": "healall",
      "aliases": [],
      "description": "Heal every player",
      "permission": "medic.heal.all",
      "targetImmunity": "Enforce"
    }
  ],
  "permissions": [
    {
      /* Required by: healall */
      "tag": "medic.heal.all",
      "description": "",
      "declaredBy": [
        "healall"
      ]
    },
    {
      /* Checked in code. Heal players other than yourself with !heal */
      "tag": "medic.heal.others",
      "description": "Heal players other than yourself with !heal",
      "declaredBy": [
        "[DeclarePermission]"
      ]
    },
    {
      /* Required by: heal */
      "tag": "medic.heal.self",
      "description": "",
      "declaredBy": [
        "heal"
      ]
    }
  ]
}
```

The comment block at the top (shortened here) explains how to change access without touching the plugin. A server owner works from this list in Part 2. If you publish the plugin, list these permissions in your README too.

At this point only the server console and players with the `admin` role can use these commands.

## Part 2: Give the commands to a role

This part happens on the server. It doesn't touch the plugin.

### 1. Create the roles

Open `configs/permissions/roles.jsonc` and add two roles next to the existing ones:

```jsonc
{
  "default": {
    "permissions": []
  },
  "admin": {
    "permissions": ["*"],
    "immunity": 100
  },

  "medic": {
    "permissions": ["medic.heal.self"]
  },
  "headmedic": {
    "permissions": ["medic.*"]
  }
}
```

- `medic` gets exactly one permission: healing themselves.
- `headmedic` gets `medic.*`, which is every permission starting with `medic.`: `medic.heal.self`, `medic.heal.others` and `medic.heal.all`, plus anything the plugin adds later.

Save the file, then run this in the server console:

```text
dw_perm_reload
```

Check the roles loaded:

```text
] dw_role_list
admin (immunity 100): *
default (immunity 0): no permissions
headmedic (immunity 0): medic.*
medic (immunity 0): medic.heal.self
```

### 2. Add players to the role

With the players on the server, run in the server console:

```text
dw_role_grant lapka medic
dw_role_grant greeny headmedic
```

You can use part of a player's name, their `#slot`, or their SteamID. For players who aren't online, use their SteamID or the exact name saved in `players.jsonc`. The roles are saved to `configs/permissions/players.jsonc`:

```jsonc
// Players and the roles they hold. ...
{
  "76561197960287931": {
    "name": "lapka",
    "roles": [
      "medic"
    ]
  },
  "76561197960287932": {
    "name": "greeny",
    "roles": [
      "headmedic"
    ]
  }
}
```

You can also write those entries by hand and run `dw_perm_reload`.

### 3. Test it

`dw_perm_check` shows whether a player has a permission, and why:

```text
] dw_perm_check lapka medic.heal.self
lapka (76561197960287931): medic.heal.self is allowed by "medic.heal.self" from role:medic

] dw_perm_check lapka medic.heal.all
lapka (76561197960287931): medic.heal.all is denied: no grant matches

] dw_perm_check greeny medic.heal.all
greeny (76561197960287932): medic.heal.all is allowed by "medic.*" from role:headmedic
```

In game:

| Player | `!heal` | `!heal wisp` | `!healall` |
|--------|---------|--------------|------------|
| lapka (medic) | Heals themselves | "You can only heal yourself." | "You don't have permission…" |
| greeny (headmedic) | Heals themselves | Heals wisp | Heals everyone |
| anyone else | "You don't have permission…" | "You don't have permission…" | "You don't have permission…" |

## Common changes

**Let everyone heal themselves.** Give the permission to the `default` role, which every player has:

```jsonc
"default": {
  "permissions": ["medic.heal.self"]
}
```

**Stop one head medic healing everyone at once.** Add a deny for that one permission to the player. A player's own entry is checked before their roles, so it beats the role's `medic.*`:

```text
dw_perm_grant greeny -medic.heal.all
```

**Make head medics inherit from medics.** Instead of repeating permissions, a role can include another role's. `dw_perm_check` then shows `from role:medic (via headmedic)` for what comes from `medic`:

```jsonc
"headmedic": {
  "inherits": ["medic"],
  "permissions": ["medic.heal.others", "medic.heal.all"]
}
```

**Use a different permission than the plugin chose.** In `configs/permissions/overrides.jsonc`:

```jsonc
{
  "commands": {
    "healall": "events.healall"
  }
}
```

## Next

- [Permissions API](../features/permissions): everything a plugin can do with permissions and targeting
- [Penalties & admin tools API](../features/admin-api): bans, gags, announcements and the admin log
