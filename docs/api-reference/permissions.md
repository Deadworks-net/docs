---
title: "Permissions"
sidebar_label: "Permissions API"
---

# Permissions

> **Namespace:** `DeadworksManaged.Api`

Deadworks has one built-in permission system that every plugin shares. As a plugin developer you only decide **which permission each command needs**. Server owners decide **who has it**, using roles and player lists described in [How Permissions Work](../guides/admins-and-permissions).

Permissions are opt-in. A command without a `Permission` works exactly as before: anyone can run it.

## Quick Start

```csharp
using DeadworksManaged.Api;

namespace DeadworksAdmin;

public class AdminPlugin : DeadworksPluginBase
{
    public override string Name => "Admin";

    [Command("kick", Description = "Kick a player", Permission = "admin.moderation.kick")]
    public void CmdKick(CCitadelPlayerController? caller, Target target)
    {
        foreach (var player in target)
            player.Kick();
    }

    [Command("ping")] // no Permission: anyone can use it
    public void CmdPing(CCitadelPlayerController caller, Target target)
    {
        // ...
    }
}
```

That's all a plugin needs. On a fresh server:

- the server console (and RCON) can run everything,
- a player can run `!kick` once the server owner gives them `admin.moderation.kick`, or a role that includes it such as the built-in `admin` role (`*`),
- a player without it sees `You don't have permission to use this command.` The failed `!kick` is not shown in chat.

## Naming Permissions

Permissions are dot-separated strings, compared case-insensitively. Use `<plugin>.<area>.<action>`:

```text
admin.moderation.kick
admin.moderation.ban
admin.moderation.ban.permanent
itemtest.rcon
```

- Start with your plugin's name, lowercased without spaces (`"Item Rotation"` → `itemrotation.`). Deadworks logs a warning if a permission doesn't, because server owners grant whole plugins with wildcards like `itemrotation.*`.
- `deadworks.*` is reserved for built-in commands.
- Group related permissions so wildcards are useful: owners can grant `admin.moderation.*` to moderators.
- The examples on this page come from Deadworks' own **Admin** plugin, which is why they start with `admin.`. Your plugin uses its own name; `admin.*` belongs to the Admin plugin.

Wildcards and denies are for server owners to use in their config. Plugins always ask about one exact permission.

## CommandAttribute Properties

| Property | Type | Description |
|----------|------|-------------|
| `Permission` | `string` | Permission a player needs to run the command. Empty means anyone. The server console can always run it. |
| `TargetImmunity` | `TargetImmunity` | Whether [`Target`](#targeting-players-and-immunity) arguments leave out players the caller can't target. Default `Auto`. |

Server owners can change a command's permission in `overrides.jsonc` without touching your plugin, so don't rely on a command being public or private. The check always happens before your method runs, and the current value is used on every call.

## Checking Permissions in Code

For anything finer than "can run this command", check inside the handler:

```csharp
[Command("ban", Permission = "admin.moderation.ban")]
public void CmdBan(CCitadelPlayerController? caller, Target target, int minutes = 0)
{
    if (minutes == 0 && !caller.HasPermission("admin.moderation.ban.permanent"))
        throw new CommandException("You can't issue permanent bans.");

    // ...
}
```

`HasPermission` works on a nullable controller. `null` means the server console, which has every permission.

### Declaring Permissions You Check in Code

Permissions on `[Command]` are listed for server owners automatically. For permissions you only check in code, add `[DeclarePermission]` to your plugin class so they're listed too:

```csharp
[DeclarePermission("admin.moderation.ban.permanent", Description = "Issue bans with no expiry")]
public class AdminPlugin : DeadworksPluginBase
{
    // ...
}
```

This is optional; undeclared permissions still work.

### The `Permissions` Class

`HasPermission` and `CanTarget` cover most plugins. The static `Permissions` class adds checks by SteamID, which also work for offline players:

| Member | Returns | Description |
|--------|---------|-------------|
| `Has(ulong steamId64, string permission)` | `bool` | Whether the player holds the permission |
| `Has(CCitadelPlayerController? player, string permission)` | `bool` | Same as `player.HasPermission(permission)` |
| `Explain(ulong steamId64, string permission)` | `PermissionExplanation` | Which grant decided the answer. This is what `dw_perm_check` prints. |
| `CanTarget(ulong caller, ulong target)` | `bool` | Whether the caller's immunity is at least the target's |
| `CanTarget(CCitadelPlayerController? caller, CCitadelPlayerController target)` | `bool` | Same as `caller.CanTarget(target)` |
| `GetImmunity(ulong steamId64)` | `int` | The player's immunity |
| `GetRoles(ulong steamId64)` | `IReadOnlyList<string>` | Roles assigned to the player (not counting `default`) |
| `GetSteamId(int slot)` | `ulong` | The SteamID64 the player in this slot connected with, or `0` for bots and empty slots |
| `Changed` | `event Action<ulong?>` | Raised after a reload or any grant or revoke, with the affected SteamID64 (or `null` for everyone). Use it to refresh cached state such as UI. |
| `RegisterStore(...)` | `void` | See [Custom Stores](#custom-stores) |

```csharp
public override void OnLoad(bool isReload)
{
    Permissions.Changed += steamId => RefreshAdminMenus(steamId);
}
```

:::tip Use `Permissions.GetSteamId(slot)` for anything security-related
`CBasePlayerController.PlayerSteamId` can be changed by plugins, and a controller can be handed to a different player across reconnects. The permission system records the SteamID the engine gave at connect, and `GetSteamId` returns that one.
:::

## Targeting Players and Immunity

Use `Target` as a command parameter type to let callers pick players:

```csharp
[Command("spec", Description = "Move players to spectators", Permission = "teams.move")]
public void CmdSpec(CCitadelPlayerController? caller, Target target)
{
    foreach (var player in target)
        player.ChangeTeam(1);
}
```

A `Target` argument accepts:

| Input | Matches |
|-------|---------|
| `@me` | The caller |
| `@all` | Every connected player |
| `@team` / `@enemy` | The caller's team / the other team |
| `#3` | The player in slot 3 |
| `76561197960287930`, `STEAM_0:0:11101`, `[U:1:22202]` | That player, by SteamID |
| anything else | A player whose name matches: exactly, or else as a unique part of it |

A `Target` is never empty. If nothing matches, or a name matches several players, the caller gets an error and your method doesn't run. `@me`, `@team` and `@enemy` need a player caller.

| Member | Description |
|--------|-------------|
| `Count`, indexer, `foreach` | The matched players |
| `Single()` | The one matched player, or a `CommandException` telling the caller to be more specific |
| `IsGroup` | `true` for `@all`, `@team` and `@enemy` |
| `Input` | The argument as typed |

```csharp
[Command("goto", Permission = "teams.teleport")]
public void CmdGoto(CCitadelPlayerController caller, Target target)
{
    var destination = target.Single();
    // ...
}
```

### Immunity

Every player has an **immunity** number set by the server owner (0 by default). A caller can't target a player whose immunity is higher than their own, so a moderator can't kick an admin. Players with equal immunity can target each other, and anyone can target themselves. The server console can target anyone.

Immunity only applies when a command picks players. It never stops a command from running. Whether `Target` arguments filter by immunity is controlled by `TargetImmunity`:

| Value | Behavior |
|-------|----------|
| `Auto` (default) | Enforce if the command has a `Permission`; ignore if anyone can run it |
| `Enforce` | Always leave out players the caller can't target |
| `Ignore` | Never consider immunity, e.g. for a stats or spectate command |

So a public `!ping greeny` works on anyone, while a moderator's `!kick` can't reach an admin.

When filtering, a single-player pattern that hits an immune player is an error (`You can't target lapka.`), and group patterns like `@all` silently leave immune players out.

If you pick players yourself instead of using `Target`, check immunity with `caller.CanTarget(player)`:

```csharp
foreach (var player in Players.GetAll().Where(p => p.TeamNum == team))
{
    if (!caller.CanTarget(player))
        continue;
    // ...
}
```

## Custom Stores

By default roles and players are read from JSON files. A plugin can supply them from somewhere else, such as a database or a web panel, by implementing `IPermissionStore`:

```csharp
public interface IPermissionStore
{
    Task<IReadOnlyDictionary<string, RoleDefinition>> LoadRolesAsync(CancellationToken ct);
    Task<PlayerEntry?> LoadPlayerAsync(ulong steamId64, CancellationToken ct);
    Task SavePlayerAsync(ulong steamId64, PlayerEntry? entry, CancellationToken ct); // null deletes
    event Action<ulong?>? Changed; // raise when data changes outside Deadworks
}
```

Register it in `OnLoad`:

```csharp
public override void OnLoad(bool isReload)
{
    Permissions.RegisterStore(this, "mysql", new MySqlPermissionStore(Config.ConnectionString));
}
```

- The store is only used when the server owner sets `"store": "mysql"` under `permissions` in `configs/deadworks.jsonc`. Until your plugin registers it, the JSON store is used.
- Deadworks still evaluates wildcards, denies and immunity, so they behave the same on every store. Your store only returns data.
- `LoadPlayerAsync` is called when a player connects. The player has only the `default` role until it completes.
- Results are applied on the game thread, so your tasks can run anywhere.
- When your plugin unloads, Deadworks switches back to the JSON store.

## See Also

- [7. Commands for One Role](../guides/role-only-commands): step by step, a plugin with permissions and a role that can use it
- [Penalties & Admin Tools API](admin-api): bans, gags, announcements and the admin log
- [Commands](commands): `[Command]` and argument binding
