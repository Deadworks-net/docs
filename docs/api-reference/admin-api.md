---
title: "Penalties & Admin Tools"
sidebar_label: "Penalties & Admin Tools API"
---

# Penalties & Admin Tools

:::info Coming soon
This isn't in a Deadworks release yet. It describes features coming in an upcoming version.
:::

> **Namespace:** `DeadworksManaged.Api`

Building blocks for admin plugins. The [Admin plugin](../guides/admin-commands) that ships with Deadworks is built on these, and your plugin can use them too, so bans, announcements and logs behave the same whichever plugin issues them.

## Penalties

Bans, gags and mutes are stored and **enforced by Deadworks**. Your plugin only decides when to add or lift them.

```csharp
var id = Permissions.GetSteamId64(player.Slot);
if (id == 0)
    throw new CommandException("Bots can't be banned.");
if (!caller.CanTarget(player))
    throw new CommandException("You can't ban them.");

// caller is the command's Caller: the admin the ban is recorded against
Penalties.Add(PenaltyType.Ban, id, TimeSpan.FromHours(1), caller, "spamming", player.PlayerName);
```

| Member | Description |
|--------|-------------|
| `Add(type, steamId64, duration, by, reason = "", playerName = null)` | Adds a penalty and returns it. `by` is the `Caller` issuing it (`Caller.Console` for the console). `duration: null` is permanent. Replaces an active penalty of the same type, even with a shorter one. A ban kicks the player if they're on the server. |
| `WouldShorten(type, steamId64, duration)` | Returns the active penalty that adding this one would cut short, or `null`. Shortening partly lifts a penalty, so check this if that should need more than adding, as the Admin plugin's `ban` requires `admin.moderation.unban`. |
| `Remove(type, steamId64, by, reason = "")` | Lifts the active penalty, keeping the reason in its history. Returns `false` if there wasn't one. |
| `GetActive(type, steamId64)` | Returns the player's active penalty of this type, or `null`. |
| `GetAllActive(type = null)` | Returns every active penalty, or every active one of one type, oldest first. |
| `IsBanned`, `IsGagged`, `IsMuted` | Return whether `GetActive(...) != null`. |
| `GetHistoryAsync(steamId64)` | Returns everything the store has for a player, newest first, including lifted and expired ones. Faults while the penalty store is unavailable. |
| `DescribeDuration(duration)` | Words a length the way the Admin plugin announces it: `"for 45 minutes"`, `"for 1h 5m"`, `"for 2d 4h"`, or `"permanently"` for `null`. |
| `RegisterStore(this, name, store)` | Registers a penalty store (see [Custom Stores](#custom-stores)). |

**What Deadworks enforces:**

| Type | Enforcement |
|------|-------------|
| `Ban` | Refuses the player at connect, before any plugin's `OnClientConnect`, and checks again once Steam has verified them. |
| `Gag` | Drops their chat before it reaches other players or any plugin's `OnChatMessage`, and tells them they're gagged. Their chat commands still run, but aren't shown in chat. |
| `Mute` | Drops their voice before anyone hears it or any plugin's `HookIncoming<CCLCMsg_VoiceData>` sees it. A muted player who talks is told, at most every 30 seconds. |

The penalty applies at once and is saved in the background. If the save fails, the console prints an `ERROR`, and the penalty applies only until the server restarts.

`Add` can refuse:

| Exception | When |
|-----------|------|
| `ArgumentException` | The SteamID is `0` (bots have none). Check for it first, like the example above. |
| `ArgumentOutOfRangeException` | `duration` is zero or negative. Use `null` for permanent. |
| `CommandException`: `<name> hasn't been verified by Steam yet. ...` | The player is on the server but Steam hasn't confirmed them yet (see [Steam Verification](#steam-verification)). `Caller.Console` is allowed anyway, so the owner can act during a Steam outage. A SteamID for someone who isn't on the server is accepted as usual. |
| `CommandException`: `Penalties can't be changed right now: ...` | The penalty store isn't available (see [Custom Stores](#custom-stores)). `Remove` throws this too. |

Let a `CommandException` reach the caller, or catch it.

To react when a penalty starts or ends, for example to post it to Discord, override these in your plugin:

```csharp
public override void OnPenaltyAdded(Penalty penalty) { /* ... */ }
public override void OnPenaltyRemoved(Penalty penalty) { /* lifted, replaced or expired */ }
```

`OnPenaltyRemoved` gets the ended penalty. For an expired one, it's called within about a second of it running out.

Both are also called when a reload finds a change made elsewhere: a penalty added or lifted by hand in `penalties.jsonc`, or by another server sharing a custom store. A penalty lifted elsewhere has `RemovedUtc` set, but who lifted it may be unknown.

To post penalties to Discord, use these two hooks rather than `OnAdminAction`: the `Penalty` has every field, and when a penalty replaces another, `OnPenaltyRemoved` gets the old one, with `ReplacedBy` set to the new one's `Id`, just before `OnPenaltyAdded` gets the new one. Use `OnAdminAction` for everything else, such as kicks and map changes.

**Immunity isn't checked by `Penalties`.** Check `caller.CanTarget(player)`, or `caller.CanTarget(steamId)` for someone who may not be on the server, before penalizing someone on another player's behalf. If it's `false` and `Permissions.IsLoaded(steamId)` is too, their entry is still loading from a custom store; try again shortly. A `Target` argument does this for you when the command has a permission.

`Penalty` is a record with `Id` (a `Guid`), `Type`, `SteamId64`, `PlayerName`, `CreatedUtc`, `ExpiresUtc` (null = permanent), `Reason`, `AdminSteamId64` (0 = console), `AdminName`, and, once it's been lifted or replaced, `RemovedUtc`, `RemovedBySteamId64`, `RemovedByName`, `RemovalReason` and `ReplacedBy` (the new penalty's `Id`). It also has `IsPermanent`, `IsActiveAt(now)`, `DescribeRemaining(now)` ("for 1 hour", "for 1h 5m", "permanently") and `HowEnded(now)`.

`HowEnded(now)` says how it stopped applying: `PenaltyEnd.Lifted` (unban, ungag, unmute), `PenaltyEnd.Replaced` (a newer one of the same type took over, so the player is still penalized), `PenaltyEnd.Expired`, or `null` if it still applies. Running out wins: a penalty can't be lifted or replaced once it has expired. Check it in `OnPenaltyRemoved` before announcing an unban: extending a ban replaces it.

A custom `IPenaltyStore` has to save and give back `RemovedByName`, `RemovalReason` and `ReplacedBy` as well as the other fields; without `ReplacedBy`, every extended ban reads as lifted.

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

Register it in `OnLoad` with `Penalties.RegisterStore(this, "mysql", store)`. It's used when `penalties.store` in `configs/deadworks.jsonc` is `"mysql"`.

Like permission stores, penalty stores **fail closed**. If `penalties.store` names a store no plugin has registered, if that plugin unloads, or if penalties can't be loaded at all at startup (for example `penalties.jsonc` has an error):

- new players are refused at connect with the reason `This server can't check its ban list right now. Try again in a few minutes.` Bots are never refused.
- players already on the server stay, including when they reload after a map change, and bans that were already loaded are still enforced.
- adding or lifting penalties throws `Penalties can't be changed right now: the '<store>' store isn't available.`

If `penalties.jsonc` breaks after it loaded once, the old penalties stay enforced, but changes are refused with `Penalties can't be changed right now: penalties.jsonc has an error. Fix it and run dw_penalties_reload. (...)`

## Admin Activity

Announce what an admin did and record it in the admin log:

```csharp
AdminActivity.Show(caller, $"slayed {player.PlayerName}", details: $"target={id}");
AdminActivity.Log(caller, $"ran rcon: {command}");   // logged, not announced
```

| Member | Description |
|--------|-------------|
| `Show(admin, action, details = null)` | Announces `action` in chat and logs it. `admin` is a `Caller`; `details` goes in the log only. |
| `Log(admin, action, details = null)` | Logs `action` without announcing it. |

To receive every logged action, e.g. to forward it to Discord, override `OnAdminAction` in your plugin:

```csharp
public override void OnAdminAction(AdminLogEntry entry)
{
    // ...
}
```

`AdminLogEntry` has `TimeUtc`, `AdminSteamId64` (0 = console), `AdminName`, `Action` and `Details`; its `ToString()` is the line written to the log file.

Players see `ADMIN: slayed lapka`; players with `deadworks.admin.notify` see `wisp: slayed lapka`. Server owners can change both under `admin.show_activity` in `configs/deadworks.jsonc`. Every `Show` and `Log` is also printed to the server console and written to `logs/admin/admin-YYYY-MM-DD.log` (the folder is `admin.log_dir`), as `<time> <admin> (<steamid>) <action> [<details>]` in UTC. Only actions that go through `AdminActivity` are logged. Deadworks logs its own staff changes (role and permission changes, plugin enable and disable, reloads) and commands refused to players who hold a role the same way.

When the Admin plugin's `rcon` sets a password cvar (one the engine flags as protected) or `rcon_password`, the log and `OnAdminAction` get `ran rcon: sv_password (value hidden)` instead of the value. If you log commands yourself, leave secrets out.

## Server Helpers

| Member | Description |
|--------|-------------|
| `Server.Kick(slot, message)` / `controller.Kick(message)` | Disconnects a player, passing the message to the engine as the reason. Deadlock doesn't show a disconnect reason to the player, so tell them anything they need to know before kicking them. |
| `Server.ExecuteCommand(command, onOutput)` | Runs a server console command and passes what it printed to `onOutput`. The callback comes on a later frame. |
| `Server.IsMapValid(map)` | Returns whether a map exists. Names with anything other than letters, digits, `_`, `-`, `.` and `/`, or containing `..`, are always rejected, so a valid name is safe to put in a command. |
| `Server.GetMapList()` | Returns the game's maps plus `serverbrowser.extra_maps`, sorted by name. |
| `Server.ChangeMap(map)` | Changes map if `IsMapValid` accepts it. Returns `false` otherwise. |

## Steam Verification

The engine checks a player's Steam ticket when they connect, so the SteamID is already the right one. A few seconds later Steam confirms the ticket is still valid. Until then the player has only the `default` role, and only `Caller.Console` can ban, gag or mute them. Their immunity, though, is taken from their saved entry from the start, so an admin who just joined, or every admin while Steam is down, can't be kicked by someone with less immunity. See [Steam Validation](../guides/admins-and-permissions#deadworksjsonc) for why.

| Member | Description |
|--------|-------------|
| `Players.IsAuthorized(slot)` | Returns whether Steam has confirmed the player. `false` for bots and empty slots; `true` straight away when `sv_lan` is on or `permissions.require_steam_auth` is off. |
| `Permissions.GetSteamId64(slot)` | Returns the SteamID the player connected with. |

To run code when Steam confirms a player, override `OnClientAuthorized`. It's called within about a second of the confirmation (or of connecting, when the wait is off), once per connection, and not again when the player reloads after a map change. A player who turns out to be banned is kicked instead:

```csharp
public override void OnClientAuthorized(ClientAuthorizedEvent args)
{
    // args.Slot, args.SteamId64, args.Controller (null if they've already left)
}
```

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

Deadlock doesn't show the reason to the player, who is disconnected without explanation, so don't rely on it to explain anything to them.

:::note
Bots don't go through `OnClientConnect`, so a whitelist like this never refuses them. Their first event is `OnClientPutInServer`, with `IsBot` set to `true`.
:::

## See Also

- [2. Admin Commands](../guides/admin-commands): the shipped commands built on these APIs
- [Permissions API](permissions): `Caller`, `HasPermission`, `Target` and immunity
