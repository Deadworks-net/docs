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

Permissions are opt-in. A command without a `Permission` can be run by anyone.

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

With this plugin loaded, on a fresh server:

- the server console (and RCON) can run everything,
- a player can run `!kick` once the server owner gives them `admin.moderation.kick`, or a role that includes it such as the built-in `admin` role (`*`),
- a player without it sees `You don't have permission to use this command.` The failed `!kick` is not shown in chat.

A player whom Steam hasn't confirmed yet sees `You don't have permission to use this command yet: your roles apply once Steam has confirmed your account, a few seconds after joining.` instead (see [Steam Verification](admin-api#steam-verification)).

## Naming Permissions

Permissions are dot-separated strings, compared case-insensitively. Use `<plugin>.<area>.<action>`:

```text
admin.moderation.kick
admin.moderation.ban
admin.server.map
itemtest.rcon
```

- Start with your plugin's `Name`, lowercased, letters and digits only (`"Item Rotation"` → `itemrotation.`). Deadworks logs a warning when the plugin loads if a permission doesn't, because server owners grant whole plugins with wildcards like `itemrotation.*`.
- `deadworks.*` is reserved for built-in commands.
- Group related permissions so wildcards are useful: owners can grant `admin.moderation.*` to moderators.
- **Never use a permission name as the parent of others.** If you have `medic.heal.others`, don't also have `medic.heal`; name it `medic.heal.self`. That way every name is either a permission or a group, never both, and owners always know what they're granting. Deadworks doesn't enforce this; every plugin should follow it.
- The examples on this page come from Deadworks' own **Admin** plugin, which is why they start with `admin.`. Your plugin uses its own name; `admin.*` belongs to the Admin plugin.

Wildcards and denies are for server owners to use in their config. Plugins always ask about one exact permission.

## CommandAttribute Properties

| Property | Type | Description |
|----------|------|-------------|
| `Permission` | `string` | Sets the permission a player needs to run the command. Empty means anyone; the server console can always run it. |
| `TargetImmunity` | `TargetImmunity` | Sets whether [`Target`](#targeting-players-and-immunity) arguments leave out players the caller can't target. Default `Auto`. |

Server owners can change a command's permission in [`overrides.jsonc`](../guides/overriding-command-permissions) without touching your plugin, so don't rely on a command being public or private. The check always happens before your method runs, using the current value.

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
| `Caller.Console` | *Static.* Returns the server console. |
| `Caller.Of(player)` | *Static.* Returns a `Caller` for a `CCitadelPlayerController`. Throws `ArgumentNullException` for `null`; use `Caller.Console` for the console. |
| `Player` | Returns the `CCitadelPlayerController`, or `null` for the console or once the player has left. |
| `IsConnected` | Returns whether the player who ran the command is still on the server. Always `true` for the console. Check it after an `await`. |
| `IsConsole` | Returns `true` for the server console. |
| `Name` | Returns the player's name when they ran the command, or `"Console"`. |
| `SteamId64` | Returns the SteamID the player connected with, or `0` for the console. Kept after they leave. |
| `HasPermission(permission)` | Returns whether the caller holds the permission. Always `true` for the console. |
| `CanTarget(player)` | Returns whether the caller may act on that player (see [Immunity](#immunity)). Always `true` for the console. |
| `CanTarget(steamId64)` | Returns the same for a SteamID, on the server or not, judged by their saved entry. `false` while that entry is still loading from a custom store. |
| `Reply(message)` | Answers the caller: in chat for a player, in the server console for the console. |
| `PrintToConsole(message)` | Prints to the player's console, or the server console. |

Once the player has left, `HasPermission` and `CanTarget` return `false`, and `Reply` and `PrintToConsole` do nothing.

Methods that take `CCitadelPlayerController? caller` instead still work, but new code should use `Caller`.

A command typed by a player whose controller can't be found runs nothing, not even a public command, so a `Caller` for a player always has one.

## Checking Permissions in Code

For anything finer than "can run this command", check inside the handler. The Admin plugin's `penalties` command is open to everyone, but only staff may look up other players:

```csharp
[Command("penalties")]
public void CmdPenalties(Caller caller, string player = "")
{
    if (player != "" && !caller.HasPermission("admin.moderation.who"))
        throw new CommandException("You can only look up your own penalties. Use penalties on its own.");

    // ...
}
```

### Checking a Controller Directly

`controller.HasPermission(...)`, `controller.CanTarget(...)` and the `Permissions` methods that take a controller treat a `null` controller as **nobody**: it has no permissions and can't target anyone, and `CanTarget` is also `false` for a `null` target. This way a failed player lookup never acts with the console's powers. When your code runs for "a player or the console", pass a `Caller` around instead, and use `Caller.Console` for the console.

### Declaring Permissions You Check in Code

Permissions on `[Command]` are listed for server owners automatically. For a permission that no command requires, and that you only check in code, add `[DeclarePermission]` to your plugin class (once per permission) so it's listed too:

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
[Permissions] A plugin checked 'medic.heal.other', which no loaded plugin declares. If it isn't a typo, list it with [DeclarePermission] so server owners can find it.
```

The warning comes on the tick after the check, so checking your own permissions in `OnLoad`, before your commands have registered, doesn't trigger it.

Server owners get the matching warnings for grants in their own files; see [Warnings in the Console](../guides/admins-and-permissions#warnings-in-the-console).

### The `Permissions` Class

`Caller` covers most plugins. The static `Permissions` class adds checks by SteamID, which also work for offline players:

| Member | Returns | Description |
|--------|---------|-------------|
| `Has(ulong steamId64, string permission)` | `bool` | Returns whether the player holds the permission. An empty permission is always held. |
| `Has(CCitadelPlayerController player, string permission)` | `bool` | Returns the same as `player.HasPermission(permission)`. `false` if `player` is `null`. |
| `Explain(ulong steamId64, string permission)` | `PermissionExplanation` | Returns which grant decided `Has`'s answer, and where it came from. |
| `CanTarget(ulong caller, ulong target)` | `bool` | Returns whether the caller's immunity is at least the target's. `false` while the target's entry is still loading from a custom store. |
| `CanTarget(CCitadelPlayerController caller, CCitadelPlayerController target)` | `bool` | Returns the same as `caller.CanTarget(target)`. `false` if either is `null`. |
| `IsLoaded(ulong steamId64)` | `bool` | Returns whether the store's answer for this SteamID has arrived, and starts loading it if nothing has asked yet. Always `true` for the JSON store. |
| `GetImmunity(ulong steamId64)` | `int` | Returns the player's immunity, from their saved entry even before Steam confirms them. |
| `GetRoles(ulong steamId64)` | `IReadOnlyList<string>` | Returns the roles assigned to the player, not counting `default` or inherited roles. For access checks, prefer a permission. |
| `GetSteamId64(int slot)` | `ulong` | Returns the SteamID64 the player in this slot connected with, or `0` for bots and empty slots. |
| `RegisterStore(owner, name, store)` | `void` | Registers a permission store. See [Custom Stores](#custom-stores). |

Checks by SteamID wait for Steam like checks by player do. While a SteamID's player is on the server but not yet confirmed by Steam, `Has` and `Explain` answer as `default`, `GetRoles` returns none, and `CanTarget(callerId, targetId)` gives that caller `default`'s immunity. A SteamID that isn't on the server is judged by its saved entry.

With a custom store, a SteamID whose entry hasn't arrived yet also answers as `default`, and `CanTarget` refuses to target it. `OnPermissionsChanged` is called with that SteamID when the entry arrives.

`PermissionExplanation` has `Allowed`, `Grant` (the entry that decided it as written, e.g. `-admin.moderation.ban`, or `null` if nothing matched) and `Source` (`player`, `role:moderator` or `role:moderator (via senior)`, or `null` if nothing matched). Its `ToString()` reads like `denied by "-admin.moderation.ban" from role:moderator`, the format `dw_perm_check` prints.

To read or print SteamIDs in any format, use `SteamIds`: `SteamIds.TryParse(text, out var steamId64)` accepts SteamID64, `STEAM_0:1:11101` and `[U:1:22203]`; `SteamIds.ToSteam2(id)` and `SteamIds.ToSteam3(id)` format one.

:::tip Use `caller.SteamId64` or `Permissions.GetSteamId64(slot)` for anything security-related
`CBasePlayerController.PlayerSteamId` can be changed by plugins, and a controller can be handed to a different player across reconnects. These two return the SteamID the player actually connected with.
:::

### Reacting to Changes

Override `OnPermissionsChanged` to refresh anything you cache, such as UI. It's called with the affected SteamID64, or `null` when everyone may have changed, after:

- a reload (`null`),
- any grant or revoke,
- Steam confirming a player, when their own roles replace `default`,
- a player's entry arriving from, or changing in, a custom store.

```csharp
public override void OnPermissionsChanged(ulong? steamId64)
{
    RefreshAdminMenus(steamId64);
}
```

As with other plugin overrides, there's nothing to unsubscribe when your plugin unloads.

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
| anything else | A player whose name matches, ignoring case: exactly, or else as a unique part of it |

A `Target` is never empty. If nothing matches, or a name matches several players, the caller gets an error and your method doesn't run. `@me`, `@team` and `@enemy` need a player caller.

| Member | Description |
|--------|-------------|
| `Count`, indexer, `foreach` | Returns the matched players. |
| `Single()` | Returns the one matched player, or throws a `CommandException` telling the caller to be more specific. |
| `IsGroup` | Returns `true` for `@all`, `@team` and `@enemy`. |
| `Input` | Returns the argument as typed. |
| `Target.Resolve(caller, input, enforceImmunity = true)` | Resolves a string the same way, for commands that decide for themselves whether an argument is a player. Throws a `CommandException` with the usual message if nothing matches, or if the caller has left the server. |

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
        if (!caller.CanTarget(steamId))
            throw new CommandException(Permissions.IsLoaded(steamId)
                ? "Their immunity is higher than yours."
                : "Their record is still loading. Try again in a moment.");
        id = steamId;
    }
    else
    {
        id = Permissions.GetSteamId64(Target.Resolve(caller, player).Single().Slot);
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
| `Auto` (default) | Enforces immunity if the command declares a `Permission`, and ignores it if it declares none. A server making the command public in `overrides.jsonc` doesn't change this, so a public `slay` still can't be used on admins. |
| `Enforce` | Always leaves out players the caller can't target. |
| `Ignore` | Never considers immunity, e.g. for a stats or spectate command. |

So a public `!ping greeny` works on anyone, while a moderator's `!kick` can't reach an admin.

When filtering, a single-player pattern that hits an immune player is an error (`You can't target lapka: their immunity is higher than yours.`). Group patterns like `@all` silently leave immune players out, and are an error only if that leaves nobody.

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
    Task<PlayerEntry?> LoadPlayerAsync(ulong steamId64, CancellationToken ct);            // null = no entry
    Task SavePlayerAsync(ulong steamId64, PlayerEntry? entry, CancellationToken ct);      // null deletes
    event Action<ulong?>? Changed; // raise when data changes outside Deadworks; null = everything
}
```

Register it in `OnLoad`:

```csharp
public override void OnLoad(bool isReload)
{
    Permissions.RegisterStore(this, "mysql", new MySqlPermissionStore(Config.ConnectionString));
}
```

- The store is only used when the server owner sets `"store": "mysql"` under `permissions` in `configs/deadworks.jsonc`. Store names ignore case.
- **Until your plugin registers it, nobody has any permissions.** Only the server console works, and the console logs `permissions.store is 'mysql', but no plugin has registered that store. Nobody has any permissions until one does; the server console still works.` The same happens if your plugin unloads. Deadworks doesn't fall back to the JSON files.
- Deadworks still evaluates wildcards, denies, inheritance and immunity, so they behave the same on every store. Your store only returns data.
- `LoadRolesAsync` is called when the store is registered, on `dw_perm_reload`, and when you raise `Changed` with `null`.
- `SavePlayerAsync` is called when staff use `role_grant`, `role_revoke`, `perm_grant` or `perm_revoke` without `--temp` (see [Console Commands](../guides/admins-and-permissions#console-commands)). The change takes effect once your task completes; if it fails, nothing changes.
- `RoleDefinition` has `Permissions`, `Inherits` and `Immunity` (`int?`). `PlayerEntry` has `Name`, `Roles`, `Permissions`, `Immunity` (`int?`) and `Clone()`.
- `LoadPlayerAsync` is called when a player connects, each time they reconnect, and when an offline SteamID is checked. Deadworks forgets a player's entry when they leave, so changes made outside Deadworks are picked up. The player has only the `default` role until it completes. If it fails, they keep only `default`, and Deadworks tries again at most every 30 seconds. Until it has loaded, no player can target them and nobody can change their roles.
- Results are applied on the game thread, so your tasks can run anywhere.

## See Also

- [6. Commands for One Role](../guides/role-only-commands): step by step, a plugin with permissions and a role that can use it
- [Penalties & Admin Tools API](admin-api): bans, gags, announcements and the admin log
- [Commands](commands): `[Command]` and argument binding
