---
title: "Penalties & Admin Tools"
sidebar_label: "Penalties & Admin Tools API"
---

# Penalties & Admin Tools

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

> **Namespace:** `DeadworksManaged.Api`

Building blocks for admin plugins. The [Admin plugin](../guides/admin-plugin) that ships with Deadworks is built on these, and your plugin can use them too, so bans, announcements and logs behave the same whichever plugin issues them.

## Penalties

Bans, gags and mutes are stored and **enforced by Deadworks**. Your plugin only decides when to add or lift them.

```csharp
var id = Permissions.GetSteamId(player.Slot);
if (!caller.CanTarget(player))
    throw new CommandException("You can't ban them.");

Penalties.Add(PenaltyType.Ban, id, TimeSpan.FromHours(1), "spamming", caller, player.PlayerName);
```

| Member | Description |
|--------|-------------|
| `Add(type, steamId64, duration, reason, admin, playerName = null)` | Adds a penalty. `duration: null` is permanent. Replaces an active penalty of the same type. A ban kicks the player if they're on the server. |
| `Remove(type, steamId64, admin)` | Lifts the active penalty. `false` if there wasn't one. |
| `GetActive(type, steamId64)` / `GetActive(type?)` | The active penalty, or every active one |
| `IsBanned`, `IsGagged`, `IsMuted` | Shortcuts for `GetActive(...) != null` |
| `GetHistoryAsync(steamId64)` | Everything the store has for a player, newest first, including lifted and expired ones |
| `Added`, `Removed` | Events. `Removed` also fires when a penalty runs out. |
| `RegisterStore(this, name, store)` | Supply penalties from a database or web panel (see below) |

**What Deadworks enforces:**

| Type | Enforced |
|------|----------|
| `Ban` | The player is refused at connect, and checked again once Steam has verified them |
| `Gag` | Their chat is dropped before chat commands' broadcast and before any plugin's `OnChatMessage`. Their chat commands still run. |
| `Mute` | Stored, but **not enforced yet**: voice blocking is still to come |

**Immunity isn't checked by `Penalties`.** Check `caller.CanTarget(player)`, or `Permissions.CanTarget(callerId, targetId)` for offline players, before penalizing someone on another player's behalf. A `Target` argument does this for you when the command has a permission.

`Penalty` is a record with `Type`, `SteamId64`, `PlayerName`, `CreatedUtc`, `ExpiresUtc` (null = permanent), `Reason`, `AdminSteamId64` (0 = console), `AdminName`, `RemovedUtc`, `RemovedBySteamId64`, plus `IsActiveAt(now)` and `DescribeRemaining(now)` ("for 1h 5m", "permanently").

### Custom Stores

By default penalties live in `configs/penalties/penalties.jsonc`. To share bans across servers, implement `IPenaltyStore`:

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

Register it in `OnLoad` with `Penalties.RegisterStore(this, "mysql", store)`. It's used when `penalties.store` in `configs/deadworks.jsonc` is `"mysql"`, and Deadworks falls back to the JSON store when your plugin unloads.

## Admin Activity

Announce what an admin did and record it in the admin log:

```csharp
AdminActivity.Show(caller, $"slayed {player.PlayerName}", details: $"target={id}");
AdminActivity.Log(caller, $"ran rcon: {command}");   // logged, not announced
```

| Member | Description |
|--------|-------------|
| `Show(admin, action, details = null)` | Announces `action` in chat and logs it. `details` goes in the log only. |
| `Log(admin, action, details = null)` | Logs without announcing |
| `Logged` | Event with every `AdminLogEntry`, e.g. to forward to Discord |

Players see `ADMIN: slayed lapka`; players with `deadworks.admin.notify` see `wisp: slayed lapka`. Server owners can change both under `admin.show_activity` in `configs/deadworks.jsonc`. Every action is also written to `logs/admin/admin-YYYY-MM-DD.log`.

## Server Helpers

| Member | Description |
|--------|-------------|
| `Server.Kick(slot, message)` / `controller.Kick(message)` | Disconnects a player, printing the message to their chat and console first and passing it to the engine as the reason |
| `Server.ExecuteCommand(command, onOutput)` | Runs a server command and gives you what it printed. The callback comes on a later frame. |
| `Server.IsMapValid(map)` | Whether a map exists. Names containing spaces, `;`, quotes or `..` are always rejected, so a valid name is safe to put in a command. |
| `Server.GetMapList()` | The game's maps plus `serverbrowser.extra_maps` |
| `Server.ChangeMap(map)` | Changes map if `IsMapValid` accepts it |

## Steam Verification

A player's SteamID isn't confirmed until Steam validates them, a few seconds after they connect.

| Member | Description |
|--------|-------------|
| `Players.IsAuthenticated(slot)` | Whether Steam has validated the player (always true when `permissions.require_steam_auth` is off) |
| `Players.ClientAuthorized` | Event `(slot, steamId64)`, once per connection when validation happens. Unsubscribe in `OnUnload`. |
| `Permissions.GetSteamId(slot)` | The SteamID the player connected with |

## Refusing a Connection With a Reason

Return `false` from `OnClientConnect` and set `RejectReason` to tell the engine why:

```csharp
public override bool OnClientConnect(ClientConnectEvent e)
{
    if (!_whitelist.Contains(e.SteamId))
    {
        e.RejectReason = "This server is whitelisted.";
        return false;
    }
    return true;
}
```

## See Also

- [3. The Admin Plugin](../guides/admin-plugin): the shipped commands built on these APIs
- [Permissions API](permissions): `HasPermission`, `Target` and immunity
