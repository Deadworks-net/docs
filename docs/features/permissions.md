---
title: "Permissions"
sidebar_label: "Permissions"
---

# Permissions

> **Namespace:** `DeadworksManaged.Api`

A permission is a name like `myplugin.heal` that a player needs to run a command. Your plugin decides which permission each command needs. Server owners decide who holds it, with roles: see [How permissions work](../guides/admins-and-permissions).

A command without a permission works for everyone. The server console can run every command.

## Give a command a permission

```csharp
[Command("heal", Permission = "myplugin.heal")]
public void CmdHeal(Caller caller)
{
    // ...
}
```

A player without `myplugin.heal` sees `You don't have permission to use this command.` and your method doesn't run. The built-in `admin` role has every permission, so admins can use it straight away.

Server owners can change a command's permission in [`overrides.jsonc`](../guides/admins-and-permissions#overridesjsonc) without touching your plugin.

## Name permissions

Use `<plugin>.<area>.<action>`, lowercase: `myplugin.heal.self`, `myplugin.heal.others`.

- Start with your plugin's `Name`, lowercased, letters and digits only. Server owners grant a whole plugin with `myplugin.*`.
- Don't make a permission name the start of another one. With `myplugin.heal.others`, name the other one `myplugin.heal.self`, not `myplugin.heal`.
- `deadworks.*` and `admin.*` are taken by Deadworks and the Admin plugin.

## Check a permission in code

For anything finer than "can run this command", check inside the method:

```csharp
[Command("heal", Permission = "myplugin.heal.self")]
public void CmdHeal(Caller caller, Target? target = null)
{
    var player = target?.Single() ?? caller.Player
        ?? throw new CommandException("Name a player to heal.");

    if (player.Slot != caller.Player?.Slot && !caller.HasPermission("myplugin.heal.others"))
        throw new CommandException("You can only heal yourself.");

    // ...
}
```

`caller.HasPermission` is always `true` for the server console.

## List permissions you check in code

Permissions on `[Command]` are listed for server owners in `configs/permissions/generated/`. Add `[DeclarePermission]` to your plugin class for each permission you only check in code:

```csharp
[DeclarePermission("myplugin.heal.others", Description = "Heal players other than yourself")]
public class MyPlugin : DeadworksPluginBase
{
    // ...
}
```

Without it, the server console warns that your plugin checks a permission nothing declares, which is how Deadworks catches typos.

## Keep players from targeting staff

Every player has an **immunity** number. A player can't pick someone with higher immunity, so a moderator can't kick an admin. On a command with a permission, `Target` parameters leave those players out.

Set `TargetImmunity` to change that:

```csharp
[Command("heal", Permission = "myplugin.heal", TargetImmunity = TargetImmunity.Ignore)]
```

| Value | Effect |
|-------|--------|
| `Auto` | Enforces immunity if the command has a permission. The default. |
| `Enforce` | Always enforces immunity. |
| `Ignore` | Never enforces immunity. Use it for commands that don't harm anyone, such as heal or spectate. |

If you pick players yourself instead of with `Target`, check `caller.CanTarget(player)`.

## Check a player who isn't on the server

`Permissions` checks by SteamID:

```csharp
if (Permissions.Has(steamId64, "myplugin.vip"))
{
    // ...
}
```

Use `Permissions.GetSteamId64(slot)` or `caller.SteamId64` for the SteamID. Plugins can change `PlayerSteamId`, so don't use it for permission checks.

## React when permissions change

Override `OnPermissionsChanged` to refresh anything you cache. It's called with the player's SteamID64, or `null` when everyone may have changed:

```csharp
public override void OnPermissionsChanged(ulong? steamId64)
{
    RefreshMenus(steamId64);
}
```

A player's roles apply a few seconds after they join, once Steam confirms their account, so this is also called then.

## See also

- [How permissions work](../guides/admins-and-permissions): roles, immunity and the permission files
- [`Caller`](/api-reference/commands/caller), [`Target`](/api-reference/commands/target), [`Permissions`](/api-reference/permissions/permissions)
- [Commands](commands)
