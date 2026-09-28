---
title: "Permissions"
sidebar_label: "Permissions API"
---

# Permissions

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

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
    public void CmdKick(Caller caller, Target target)
    {
        foreach (var player in target)
            player.Kick();

        caller.Reply($"Kicked {target.Count} player(s).");
    }

    [Command("ping")] // no Permission: anyone can use it
    public void CmdPing(Caller caller, Target target)
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
admin.server.map
itemtest.rcon
```

- Start with your plugin's name, lowercased without spaces (`"Item Rotation"` → `itemrotation.`). Deadworks logs a warning if a permission doesn't, because server owners grant whole plugins with wildcards like `itemrotation.*`.
- `deadworks.*` is reserved for built-in commands.
- Group related permissions so wildcards are useful: owners can grant `admin.moderation.*` to moderators.
- **Never use a permission name as the parent of others.** If you have `medic.heal.others`, don't also have `medic.heal`; name it `medic.heal.self`. That way every name is either a permission or a group, never both, and owners always know what they're granting. Deadworks doesn't enforce this; it's a convention every plugin should follow.
- The examples on this page come from Deadworks' own **Admin** plugin, which is why they start with `admin.`. Your plugin uses its own name; `admin.*` belongs to the Admin plugin.

Wildcards and denies are for server owners to use in their config. Plugins always ask about one exact permission.

## CommandAttribute Properties

| Property | Type | Description |
|----------|------|-------------|
| `Permission` | `string` | Permission a player needs to run the command. Empty means anyone. The server console can always run it. |
| `TargetImmunity` | `TargetImmunity` | Whether [`Target`](#targeting-players-and-immunity) arguments leave out players the caller can't target. Default `Auto`. |

Server owners can change a command's permission in `overrides.jsonc` without touching your plugin, so don't rely on a command being public or private. The check always happens before your method runs, and the current value is used on every call.

## The `Caller` Parameter

Make `Caller` the first parameter of your `[Command]` methods. It stands for whoever ran the command: a player, or the server console (which includes RCON).

```csharp
[Command("whoami")]
public void CmdWhoAmI(Caller caller)
{
    caller.Reply(caller.IsConsole ? "You're the server console." : $"You're {caller.Name}.");
}
```

| Member | Description |
|--------|-------------|
| `Caller.Console` | *Static.* The server console |
| `Caller.Of(player)` | *Static.* A `Caller` for a `CCitadelPlayerController` |
| `Player` | The `CCitadelPlayerController`, or `null` for the console, or once the player has left |
| `IsConnected` | Whether the player who ran the command is still on the server. Always `true` for the console. Check it after an `await`. |
| `IsConsole` | `true` for the server console |
| `Name` | The player's name when they ran the command, or `"Console"` |
| `SteamId64` | The SteamID the engine gave the player at connect, or `0` for the console. Kept after they leave. |
| `HasPermission(permission)` | Whether the caller holds the permission. Always `true` for the console. |
| `CanTarget(player)` | Whether the caller may act on that player (see [Immunity](#immunity)). Always `true` for the console. |
| `CanTarget(steamId64)` | The same for a SteamID, on the server or not, judged by their saved entry. `false` while that entry is still loading from a custom store. |
| `Reply(message)` | Answers the caller: in chat for a player, in the server console for the console |
| `PrintToConsole(message)` | Prints to the player's console, or the server console |

Methods that take `CCitadelPlayerController? caller` instead still work, but new code should use `Caller`.

A command typed by a player whose controller can't be found runs nothing, not even a public command, so a `Caller` for a player always has one.

## Checking Permissions in Code

For anything finer than "can run this command", check inside the handler. The Admin plugin's `penalties` command is open to everyone, but only staff may look up other players:

```csharp
[Command("penalties")]
public void CmdPenalties(Caller caller, string steamId = "")
{
    if (steamId != "" && !caller.HasPermission("admin.moderation.who"))
        throw new CommandException("You can only see your own penalties.");

    // ...
}
```

### Checking a Controller Directly

`controller.HasPermission(...)`, `controller.CanTarget(...)` and the `Permissions` methods that take a controller treat a `null` controller as **nobody**: it has no permissions and can't target anyone, and `CanTarget` is also `false` for a `null` target. A failed player lookup returns `null`, and it must never act with the console's powers. When your code runs for "a player or the console", pass a `Caller` around instead, and use `Caller.Console` for the console.

### Declaring Permissions You Check in Code

Permissions on `[Command]` are listed for server owners automatically. For a permission that no command requires, and that you only check in code, add `[DeclarePermission]` to your plugin class so it's listed too:

```csharp
[DeclarePermission("medic.heal.others", Description = "Heal players other than yourself with !heal")]
public class MedicPlugin : DeadworksPluginBase
{
    // ...
}
```

Undeclared permissions still work, but Deadworks warns about them (see below), and owners won't find them in the `generated` files.

### Typo Warnings

Deadworks warns in the server console, once per permission, when a plugin checks a permission that no loaded plugin declares. A permission counts as declared if it's on a `[Command]`, in a `[DeclarePermission]`, or set in `overrides.jsonc`. It usually means a typo in your code:

```text
A plugin checked 'medic.heal.other', which no loaded plugin declares. If it isn't a typo, list it with [DeclarePermission] so server owners can find it.
```

The warning comes on the tick after the check, so checking your own permissions in `OnLoad`, before your commands have registered, doesn't trigger it.

Server owners get the reverse: after startup and on `dw_perm_reload`, the console lists grants in their roles and players that match nothing any loaded plugin declares. With the JSON store that covers everyone in `players.jsonc`; with a custom store, players are checked as they load.

### The `Permissions` Class

`Caller` covers most plugins. The static `Permissions` class adds checks by SteamID, which also work for offline players:

| Member | Returns | Description |
|--------|---------|-------------|
| `Has(ulong steamId64, string permission)` | `bool` | Whether the player holds the permission |
| `Has(CCitadelPlayerController player, string permission)` | `bool` | Same as `player.HasPermission(permission)`. `false` if `player` is `null`. |
| `Explain(ulong steamId64, string permission)` | `PermissionExplanation` | Which grant decided the answer from the player's saved entry, and which role it came from. `dw_perm_check` prints the same, except that for an online player it shows what applies right now (only `default` before Steam confirms them). |
| `CanTarget(ulong caller, ulong target)` | `bool` | Whether the caller's immunity is at least the target's. `false` while the target's entry is still loading from a custom store. |
| `CanTarget(CCitadelPlayerController caller, CCitadelPlayerController target)` | `bool` | Same as `caller.CanTarget(target)`. `false` if either is `null`. |
| `IsLoaded(ulong steamId64)` | `bool` | Whether the store's answer for this SteamID has arrived, starting to load it if nothing has asked yet. Until it has, checks by SteamID answer as `default` and `CanTarget` refuses; `OnPermissionsChanged` fires with that SteamID when it arrives. Always `true` at once for the JSON store. |
| `GetImmunity(ulong steamId64)` | `int` | The player's immunity, from their saved entry even before Steam confirms them (it protects them) |
| `GetRoles(ulong steamId64)` | `IReadOnlyList<string>` | Roles assigned to the player (not counting `default`). Like `Has`, none while they're on the server but not yet confirmed by Steam. For access checks, prefer a permission. |
| `GetSteamId(int slot)` | `ulong` | The SteamID64 the player in this slot connected with, or `0` for bots and empty slots |
| `RegisterStore(...)` | `void` | See [Custom Stores](#custom-stores) |

`PermissionExplanation` has `Allowed`, `Grant` (the entry that decided it as written, e.g. `-admin.moderation.ban`, or `null` if nothing matched) and `Source` (`player`, `role:moderator`, `role:moderator (via senior)` or `unauthenticated`). Its `ToString()` is the text `dw_perm_check` prints.

To read or print SteamIDs in any format, use `SteamIds`: `SteamIds.TryParse(text, out var steamId64)` accepts SteamID64, `STEAM_0:1:11101` and `[U:1:22203]`; `SteamIds.ToSteam2(id)` and `SteamIds.ToSteam3(id)` format one.

:::tip Use `caller.SteamId64` or `Permissions.GetSteamId(slot)` for anything security-related
`CBasePlayerController.PlayerSteamId` can be changed by plugins, and a controller can be handed to a different player across reconnects. The permission system records the SteamID the engine gave at connect, and these return that one.

Checks by SteamID wait for Steam like checks by player do: while that SteamID's player is on the server but not yet verified, `Permissions.Has(steamId, ...)` answers as `default`, and so does the caller side of `Permissions.CanTarget(callerId, targetId)`. A SteamID that isn't on the server is judged by its saved entry.
:::

### Reacting to Changes

Override `OnPermissionsChanged` to refresh anything you cache, such as UI. It's called after a reload, any grant or revoke, and when Steam confirms a player (their own roles replace `default` then), with the affected SteamID64, or `null` when everyone may have changed:

```csharp
public override void OnPermissionsChanged(ulong? steamId64)
{
    RefreshAdminMenus(steamId64);
}
```

Like other plugin overrides, it stops when your plugin unloads or hot-reloads, so there's nothing to unsubscribe.

## Targeting Players and Immunity

Use `Target` as a command parameter type to let callers pick players:

```csharp
[Command("spec", Description = "Move players to spectators", Permission = "teams.move")]
public void CmdSpec(Caller caller, Target target)
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
| `Target.Resolve(caller, input, enforceImmunity = true)` | Resolves a string the same way, for commands that decide for themselves whether an argument is a player. Throws a `CommandException` with the usual message if nothing matches |

```csharp
[Command("goto", Permission = "teams.teleport")]
public void CmdGoto(Caller caller, Target target)
{
    var destination = target.Single();
    // ...
}
```

To accept either a player or a SteamID that isn't on the server, take a `string` and resolve it yourself. `Target.Resolve` checks immunity for players on the server; for a SteamID you check it, since nothing else will:

```csharp
[Command("whitelist", Permission = "whitelist.add")]
public void CmdWhitelist(Caller caller, string player)
{
    ulong id;
    if (SteamIds.TryParse(player, out var steamId))
    {
        if (!caller.IsConsole && !Permissions.CanTarget(caller.SteamId64, steamId))
            throw new CommandException("Their immunity is higher than yours.");
        id = steamId;
    }
    else
    {
        id = Permissions.GetSteamId(Target.Resolve(caller, player).Single().Slot);
        if (id == 0)
            throw new CommandException("That's a bot.");
    }
    // ...
}
```

### Immunity

Every player has an **immunity** number set by the server owner (0 by default). A caller can't target a player whose immunity is higher than their own, so a moderator can't kick an admin. Players with equal immunity can target each other, and anyone can target themselves. The server console can target anyone.

Immunity only applies when a command picks players. It never stops a command from running. Whether `Target` arguments filter by immunity is controlled by `TargetImmunity`:

| Value | Behavior |
|-------|----------|
| `Auto` (default) | Enforce if the command declares a `Permission`; ignore if it declares none. A server making the command public in `overrides.jsonc` doesn't change this, so a public `slay` still can't be used on admins |
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

- The store is only used when the server owner sets `"store": "mysql"` under `permissions` in `configs/deadworks.jsonc`.
- **Until your plugin registers it, nobody has any permissions.** Only the server console works, and the console logs `permissions.store is 'mysql', but no plugin has registered that store. Nobody has any permissions until one does; the server console still works.` (`dw_perm_list` shows it too). The same happens if your plugin unloads. Deadworks doesn't fall back to the JSON files, so a broken database never hands out the permissions of stale files.
- Deadworks still evaluates wildcards, denies, inheritance and immunity, so they behave the same on every store. Your store only returns data.
- `RoleDefinition` has `Permissions`, `Inherits` and `Immunity` (`int?`). `PlayerEntry` has `Name`, `Roles`, `Permissions`, `Immunity` (`int?`) and `Clone()`.
- `LoadPlayerAsync` is called when a player connects, and again each time they reconnect: Deadworks forgets a player's entry when they leave, so changes made outside Deadworks are picked up. The player has only the `default` role until it completes. If it fails, they keep only `default`, and Deadworks tries again at most every 30 seconds. Until it has loaded, nobody can target them or change their roles.
- Results are applied on the game thread, so your tasks can run anywhere.

## See Also

- [7. Commands for One Role](../guides/role-only-commands): step by step, a plugin with permissions and a role that can use it
- [Penalties & Admin Tools API](admin-api): bans, gags, announcements and the admin log
- [Commands](commands): `[Command]` and argument binding
