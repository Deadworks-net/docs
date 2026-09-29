---
title: "Permissions"
sidebar_label: "Permissions API"
---

# Permissions

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

> **Namespace:** `DeadworksManaged.Api`

Every plugin shares one permission system. Your plugin only says **which permission each command needs**; server owners decide **who has it** with roles (see [How Permissions Work](../guides/permissions)). A command without a `Permission` works for everyone, and the server console can always run everything.

## Quick Start

A **Medic** plugin: `!heal` heals yourself, `!heal <player>` heals someone else, `!healall` heals everyone.

```csharp
using DeadworksManaged.Api;

namespace MedicPlugin;

[DeclarePermission("medic.others", Description = "Heal players other than yourself")]
public class MedicPlugin : DeadworksPluginBase
{
    public override string Name => "Medic";

    [Command("heal", Description = "Heal yourself or a player: heal [player]",
        Permission = "medic.self", TargetImmunity = TargetImmunity.Ignore)]
    public void CmdHeal(CCitadelPlayerController caller, Target? player = null)
    {
        var who = player?.Single() ?? caller;
        if (who.Slot != caller.Slot && !caller.HasPermission("medic.others"))
            throw new CommandException("You can only heal yourself.");

        Heal(who);
    }

    [Command("healall", Description = "Heal every player", Permission = "medic.all")]
    public void CmdHealAll(Caller caller)
    {
        foreach (var p in Players.GetAll())
            Heal(p);
        caller.Reply("Healed everyone.");
    }

    private static void Heal(CCitadelPlayerController player)
    {
        if (player.GetHeroPawn() is { } pawn)
            pawn.Health = pawn.GetMaxHealth();
    }
}
```

- **`Permission = "medic.self"`** is checked before your method runs. A player without it sees `You don't have permission to use this command.` and your method never runs.
- **`caller.HasPermission(...)`** is for checks that depend on how the command is used.
- **`[DeclarePermission]`** lists permissions you only check in code, so server owners can find them. Permissions on `[Command]` are listed automatically.
- **`TargetImmunity.Ignore`** lets a medic heal an admin. By default, commands with a permission can't target players with higher [immunity](#immunity).
- **`CCitadelPlayerController caller`** means only players can run `heal`. **`Caller caller`** on `healall` lets the server console run it too.

When it loads, Deadworks writes `configs/permissions/generated/MedicPlugin.jsonc` listing these commands and permissions. The server owner then sets up roles, and nothing in your plugin changes:

```jsonc
// roles.jsonc
"medic":     { "permissions": ["medic.self"] },
"headmedic": { "permissions": ["medic.*"] }       // self, others and all
```

## Naming Permissions

Use `<plugin>.<area>.<action>`, lowercase, starting with your plugin's name without spaces (`"Item Rotation"` → `itemrotation.`), so owners can grant your whole plugin with `itemrotation.*`. Deadworks warns about permissions that don't, and `deadworks.*` is reserved.

Keep permissions flat: don't make one the parent of another. With `medic.heal` and `medic.heal.all`, an owner granting `medic.heal.*` would get `heal.all` but not `heal` itself. `medic.self`, `medic.others` and `medic.all` avoid that. Wildcards and denies are for server owners; a plugin always asks about one exact permission.

## Caller

`Caller` is who ran a command: a player, or the server console (which includes RCON). Take it as a command's first parameter when the console may run the command.

| Member | |
|--------|---|
| `IsConsole` | True for the server console |
| `Player` | The player, or null for the console or once they've left |
| `Name`, `SteamId64` | As they were when the command ran. `"Console"` and 0 for the console. |
| `IsConnected` | Whether they're still on the server. Check after an `await`. |
| `HasPermission(permission)` | The console has everything; a player who has left, nothing |
| `CanTarget(player)`, `CanTarget(steamId64)` | Immunity check. The console can target anyone. |
| `Reply(message)` | Chat for a player, the server console for the console |
| `PrintToConsole(message)` | For output too long for chat |
| `Caller.Console`, `Caller.Of(player)` | Make one yourself, e.g. to call the [admin APIs](admin-api) |

A `CCitadelPlayerController?` caller still works, but Deadworks prints a note suggesting `Caller`: with a nullable controller, a player whose controller couldn't be found looks exactly like the console. For the same reason, `player.HasPermission(...)` on a null controller is always false.

## CommandAttribute Properties

| Property | Type | |
|----------|------|---|
| `Permission` | `string` | What a player needs to run it. Empty means anyone. |
| `TargetImmunity` | `TargetImmunity` | Whether `Target` arguments skip players the caller can't target. Default `Auto`. |

Server owners can change a command's permission in `overrides.jsonc` without touching your plugin, so don't count on a command being public or private.

## Checking in Code

```csharp
[Command("spawnboss", Permission = "events.boss")]
public void CmdSpawnBoss(Caller caller, int health = 5000)
{
    if (health > 20000 && !caller.HasPermission("events.hugeboss"))
        throw new CommandException("You can't spawn a boss that big.");
    // ...
}
```

Add `[DeclarePermission("events.hugeboss", Description = "...")]` to the plugin class to list it. Undeclared permissions still work, but `dw_perm_check` will warn that nothing declares them.

### The `Permissions` Class

For checks outside a command, or by SteamID for players who aren't online:

| Member | |
|--------|---|
| `Has(steamId64, permission)` / `Has(player, permission)` | Whether they hold it |
| `Explain(steamId64, permission)` | Which entry decided, as `dw_perm_check` prints it |
| `CanTarget(callerId, targetId)` / `CanTarget(caller, target)` | Immunity check |
| `GetImmunity(steamId64)` | Their immunity |
| `GetRoles(steamId64)` | Roles assigned to them, not counting `default` or inherited ones |
| `IsLoaded(steamId64)` | Whether a [custom store](#custom-stores) has answered for them yet. Always true for the JSON files. |
| `GetSteamId64(slot)` | The SteamID the player in this slot connected with; 0 for bots |
| `RegisterStore(this, name, store)` | See [Custom Stores](#custom-stores) |

:::tip Use `GetSteamId64(slot)` for anything security-related
Plugins can change `PlayerSteamId`, and a controller can be handed to a different player across reconnects. `Permissions.GetSteamId64` is the SteamID the engine gave at connect.
:::

### Reacting to Changes

Override `OnPermissionsChanged` to refresh anything that depends on who can do what, such as an admin menu. It's called after a reload (`steamId64` is null, meaning everyone), a grant or revoke, and when Steam confirms a player and their roles replace `default`.

```csharp
public override void OnPermissionsChanged(ulong? steamId64) => RefreshMenus(steamId64);
```

`OnClientAuthorized(ClientAuthorizedEvent)` is called once per connection when Steam confirms a player. `Players.IsAuthorized(slot)` tells you whether it has happened yet.

## Picking Players: `Target`

Take a `Target` parameter to let callers pick players:

```csharp
[Command("spec", Description = "Move players to spectators: spec <player>", Permission = "teams.move")]
public void CmdSpec(Caller caller, Target player)
{
    foreach (var p in player)
        p.ChangeTeam(1);
}
```

It accepts `@me`, `@all`, `@team`, `@enemy`, `#slot`, a SteamID (64, Steam2 or Steam3), or part of a name. It's never empty: if nothing matches, or a name matches several players, the caller is told and your method doesn't run. Make it optional with `Target? player = null`.

| Member | |
|--------|---|
| `foreach`, `Count`, indexer | The matched players |
| `Single()` | The one player, or a `CommandException` telling the caller to be more specific |
| `IsGroup` | True for `@all`, `@team` and `@enemy` |
| `Input` | The argument as typed |
| `Target.Resolve(caller, input, enforceImmunity = true)` | Resolve a string yourself, e.g. for "a player, or a SteamID that isn't online" |

### Immunity

A caller can't target a player whose immunity is higher than their own. Equal immunity is fine, and so is targeting yourself. Immunity never stops a command running; it only filters `Target`:

| `TargetImmunity` | |
|------------------|---|
| `Auto` (default) | Enforced if the command declares a `Permission`, ignored if not |
| `Enforce` | Always |
| `Ignore` | Never, e.g. for a heal or stats command |

A single player the caller can't target is an error (`You can't target lapka: their immunity is higher than yours.`). Groups like `@all` quietly leave them out.

If you pick players yourself, check `caller.CanTarget(player)`.

## Custom Stores

Roles and players come from the JSON files by default. To keep them in a database or web panel, implement `IPermissionStore`:

```csharp
public interface IPermissionStore
{
    Task<IReadOnlyDictionary<string, RoleDefinition>> LoadRolesAsync(CancellationToken ct);
    Task<PlayerEntry?> LoadPlayerAsync(ulong steamId64, CancellationToken ct);
    Task SavePlayerAsync(ulong steamId64, PlayerEntry? entry, CancellationToken ct); // null deletes
    event Action<ulong?>? Changed; // raise when data changes outside Deadworks; null reloads everything
}
```

```csharp
public override void OnLoad(bool isReload)
    => Permissions.RegisterStore(this, "mysql", new MySqlPermissionStore(Config.ConnectionString));
```

- It's only used when the owner sets `"store": "mysql"` under `permissions` in `configs/deadworks.jsonc`, and dropped when your plugin unloads.
- Deadworks still evaluates wildcards, denies and immunity. Your store only returns data.
- `LoadPlayerAsync` runs when a player connects; until it completes they only have `default`. Your tasks can run on any thread.

## See Also

- [Commands](commands): `[Command]`, argument types and async commands
- [Penalties & Admin Tools API](admin-api): bans, gags, mutes, announcements and the admin log
