---
title: "Penalties & Admin Tools"
sidebar_label: "Penalties & Admin Tools API"
---

# Penalties & Admin Tools

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

> **Namespace:** `DeadworksManaged.Api`

The building blocks of the [Admin plugin](../guides/admin-commands). Use them in your own plugins and bans, announcements and logs behave the same whichever plugin issues them.

## Penalties

Bans, gags and mutes are stored and **enforced by Deadworks**: banned players can't join, gagged players' chat never reaches chat or any plugin, and muted players' voice is dropped before anyone hears it. Each is told why and for how long. Your plugin only decides when to add or lift them.

```csharp
[Command("votekick", Description = "...")]
public void CmdVoteKick(Caller caller, Target player)
{
    var target = player.Single();
    var id = Permissions.GetSteamId64(target.Slot);
    Penalties.Add(PenaltyType.Ban, id, TimeSpan.FromMinutes(30), Caller.Console, "Vote kicked", target.PlayerName);
}
```

| Member | |
|--------|---|
| `Add(type, steamId64, duration, by, reason = "", playerName = null)` | Adds a penalty; `duration: null` is permanent. Replaces an active one of the same type, even with a shorter one. A ban kicks the player if they're on the server. |
| `Remove(type, steamId64, by, reason = "")` | Lifts the active penalty. False if there wasn't one. |
| `GetActive(type, steamId64)` | The active penalty, or null |
| `GetAllActive(type = null)` | Every active penalty, oldest first |
| `IsBanned`, `IsGagged`, `IsMuted` | Shortcuts for `GetActive(...) != null` |
| `WouldShorten(type, steamId64, duration)` | The active penalty a new one would cut short, if any. The Admin plugin asks for `unban` permission then. |
| `GetHistoryAsync(steamId64)` | Everything the store has for them, newest first, including lifted and expired penalties |
| `DescribeDuration(duration)` | `"for 45 minutes"`, `"for 1h 5m"`, `"permanently"`, as the Admin plugin words it |
| `RegisterStore(this, name, store)` | See [Custom Stores](#custom-stores) |

- **Immunity isn't checked for you.** When penalizing on another player's behalf, check `caller.CanTarget(player)`, or `caller.CanTarget(steamId64)` for someone who isn't online. A `Target` parameter does it for commands with a permission.
- **`Add` throws `CommandException`** if the SteamID belongs to a player on the server whom Steam hasn't confirmed yet (unless `by` is the console), or if the store is unavailable. Let it reach the caller.
- The penalty applies at once and is saved in the background. If saving fails it still applies until restart, and the server console prints an error.

`Penalty` is a record: `Id`, `Type`, `SteamId64`, `PlayerName`, `CreatedUtc`, `ExpiresUtc` (null = permanent), `Reason`, `AdminSteamId64` (0 = console), `AdminName`, `RemovedUtc`, `RemovedBySteamId64`, `RemovedByName`, `RemovalReason`, `ReplacedBy`, plus `IsPermanent`, `IsActiveAt(now)`, `HowEnded(now)` (`Lifted`, `Replaced`, `Expired` or null) and `DescribeRemaining(now)`.

### Hearing About Penalties

```csharp
public override void OnPenaltyAdded(Penalty penalty) { }
public override void OnPenaltyRemoved(Penalty penalty) { }   // lifted, replaced or ran out
```

Both fire for penalties from any plugin, and for changes found when penalties are reloaded, such as a ban added by another server sharing the store.

### Custom Stores

Penalties live in `configs/penalties/penalties.jsonc` by default. To share bans across servers, implement `IPenaltyStore`:

```csharp
public interface IPenaltyStore
{
    Task<IReadOnlyList<Penalty>> LoadActiveAsync(CancellationToken ct);
    Task AddAsync(Penalty penalty, CancellationToken ct);
    Task UpdateAsync(Penalty penalty, CancellationToken ct);   // lifted or replaced
    Task<IReadOnlyList<Penalty>> LoadHistoryAsync(ulong steamId64, CancellationToken ct);
    event Action? Changed;                                     // raise to make Deadworks reload
}
```

Register it in `OnLoad` with `Penalties.RegisterStore(this, "mysql", store)`. It's used when `penalties.store` in `configs/deadworks.jsonc` is `"mysql"`, and dropped when your plugin unloads.

## Admin Activity

Announce an admin action and record it in the admin log:

```csharp
AdminActivity.Show(caller, $"slayed {player.PlayerName}", details: $"target={id}");
AdminActivity.Log(caller, $"ran rcon: {command}");   // logged, not announced
```

`details` goes in the log only. Players see `ADMIN: slayed lapka`, and holders of `deadworks.admin.notify` see `wisp: slayed lapka`; owners can change both under `admin.show_activity` in `configs/deadworks.jsonc`. Every entry is written to `logs/admin/admin-YYYY-MM-DD.log`, and reaches every plugin's `OnAdminAction`, e.g. to forward it to Discord:

```csharp
public override void OnAdminAction(AdminLogEntry entry) => _discord.Post(entry.ToString());
```

`AdminLogEntry` has `TimeUtc`, `AdminSteamId64`, `AdminName`, `Action` and `Details`.

## Server Helpers

| Member | |
|--------|---|
| `controller.Kick(message)`, `Server.Kick(slot, message)` | Disconnects a player, showing them the message in chat and console and passing it to the engine as the reason |
| `Server.ExecuteCommand(command, onOutput)` | Runs a server command and hands you what it printed, on a later frame |
| `Server.GetMapList()` | The game's maps plus `serverbrowser.extra_maps` |
| `Server.IsMapValid(map)` | Whether a map exists. Names with spaces, `;`, quotes or `..` are always rejected, so a valid name is safe to put in a command. |
| `Server.ChangeMap(map)` | Changes map if `IsMapValid` accepts it |

## Refusing a Connection

Return `false` from `OnClientConnect` and set `RejectReason` to tell the player why:

```csharp
public override bool OnClientConnect(ClientConnectEvent e)
{
    if (_whitelist.Contains(e.SteamId))
        return true;
    e.RejectReason = "This server is whitelisted.";
    return false;
}
```

## See Also

- [Admin Commands](../guides/admin-commands): the shipped commands built on these APIs
- [Permissions API](permissions): `Caller`, `Target`, `HasPermission` and immunity
