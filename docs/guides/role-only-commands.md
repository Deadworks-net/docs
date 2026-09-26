---
title: "Commands for One Role"
sidebar_label: "Commands for One Role"
---

# Commands for One Role

This guide walks through a small plugin whose commands only some players can use, then sets up a role on the server so that exactly those players can.

We'll build a **Medic** plugin:

- `!heal` heals yourself. Only **medics** can use it.
- `!heal <player>` heals someone else. Only **head medics** can do that.
- `!healall` heals everyone. Also head medics only.

You should already have a plugin project set up. If not, start with [Project Setup](../getting-started/setup) and [Your First Plugin](../getting-started/first-plugin).

## Part 1: The Plugin

### Write the Commands

```csharp
using DeadworksManaged.Api;

namespace MedicPlugin;

[DeclarePermission("medic.heal.others", Description = "Heal players other than yourself with !heal")]
public class MedicPlugin : DeadworksPluginBase
{
    public override string Name => "Medic";

    [Command("heal",
        Description = "Heal yourself, or another player if you're allowed",
        Permission = "medic.heal",
        TargetImmunity = TargetImmunity.Ignore)]
    public void CmdHeal(CCitadelPlayerController caller, Target? target = null)
    {
        var player = target?.Single() ?? caller;

        if (player.Slot != caller.Slot && !caller.HasPermission("medic.heal.others"))
            throw new CommandException("You can only heal yourself.");

        Heal(player);
        Chat.PrintToChat(caller, $"Healed {player.PlayerName}.");
    }

    [Command("healall", Description = "Heal every player", Permission = "medic.heal.all")]
    public void CmdHealAll(CCitadelPlayerController? caller)
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

### What Each Part Does

**`Permission = "medic.heal"`** is all it takes to lock a command. Before `CmdHeal` runs, Deadworks checks that the player has `medic.heal`. If they don't, they see `You don't have permission to use this command.` and your method never runs, so you don't need an `if` for it.

**Permission names** start with your plugin's name (`medic.`), then get more specific: `medic.heal`, `medic.heal.all`, `medic.heal.others`. This lets server owners grant everything at once with `medic.*`.

**`caller.HasPermission("medic.heal.others")`** is for checks that depend on how the command is used. Anyone with `medic.heal` can run `!heal`, but only some of them may heal *other* players, so we check that inside the method. Throwing a `CommandException` sends the message back to the player.

**`[DeclarePermission]`** lists `medic.heal.others` for server owners. Permissions on `[Command]` are listed automatically, but Deadworks can't see checks inside your code without this.

**`Target? target = null`** lets the player optionally name someone: `!heal`, `!heal wisp`, `!heal #3`. With nothing typed, `target` is `null` and we heal the caller. `target.Single()` makes sure the name matched exactly one player.

**`TargetImmunity = TargetImmunity.Ignore`**: by default, commands with a permission can't target players with higher [immunity](../api-reference/permissions#immunity), which is what you want for kick or ban. Healing doesn't hurt anyone, so a medic should be able to heal an admin too.

**`CCitadelPlayerController? caller`** on `healall` has a `?`, so the server console can run it too. `heal` uses a non-nullable `caller` because the console has no hero to heal.

### Build and Install

Build the plugin and copy the DLL into the server's plugins folder as usual. When it loads, Deadworks writes `configs/permissions/generated/MedicPlugin.jsonc`, which lists the plugin's commands and permissions:

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
      "permission": "medic.heal",
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
      /* Required by: heal */
      "tag": "medic.heal",
      "description": "",
      "declaredBy": [
        "heal"
      ]
    },
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
    }
  ]
}
```

The comment block at the top (shortened here) explains how to change access without touching the plugin. This is the list a server owner works from in Part 2. If you publish the plugin, it's also worth listing these permissions in your README.

Right now nobody but the server console, and anyone with the `admin` role, can use these commands.

## Part 2: Give the Commands to a Role

This part is done on the server and doesn't touch the plugin.

### 1. Create the Roles

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
    "permissions": ["medic.heal"]
  },
  "headmedic": {
    "permissions": ["medic.*"]
  }
}
```

- `medic` gets exactly one permission: healing themselves.
- `headmedic` gets `medic.*`, which is every permission starting with `medic.`: `medic.heal`, `medic.heal.others` and `medic.heal.all`, plus anything the plugin adds later.

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
medic (immunity 0): medic.heal
```

### 2. Add Players to the Role

With the players on the server, run in the server console:

```text
dw_role_grant lapka medic
dw_role_grant greeny headmedic
```

You can use part of a player's name, their `#slot`, or their SteamID. A SteamID also works for players who aren't online. The roles are saved to `configs/permissions/players.jsonc`, which now contains:

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

You could also write those entries by hand and run `dw_perm_reload`.

### 3. Test It

`dw_perm_check` shows whether a player has a permission, and why:

```text
] dw_perm_check lapka medic.heal
lapka (76561197960287931): medic.heal is allowed by "medic.heal" from role:medic

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

## Common Changes

**Let everyone heal themselves.** Give the permission to the `default` role, which every player has:

```jsonc
"default": {
  "permissions": ["medic.heal"]
}
```

**A head medic who can't heal everyone at once.** Add a deny for that one permission to the player. The most specific entry wins, so it beats `medic.*`:

```text
dw_perm_grant greeny -medic.heal.all
```

**Head medics are also medics.** Instead of repeating permissions, a role can include another role's:

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

## Next Steps

- [Permissions](../api-reference/permissions) — Everything a plugin can do with permissions and targeting
- [Admins & Permissions](admins-and-permissions) — Roles, immunity and the console commands in full
