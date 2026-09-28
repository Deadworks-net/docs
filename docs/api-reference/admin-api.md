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
if (id == 0)
    throw new CommandException("Bots can't be banned.");
if (!caller.CanTarget(player))
    throw new CommandException("You can't ban them.");

// caller is the command's Caller: the admin the ban is recorded against
Penalties.Add(PenaltyType.Ban, id, TimeSpan.FromHours(1), "spamming", caller, player.PlayerName);
```

| Member | Description |
|--------|-------------|
| `Add(type, steamId64, duration, reason, by, playerName = null)` | Adds a penalty. `by` is the `Caller` issuing it (`Caller.Console` for the console). `duration: null` is permanent; zero or negative throws `ArgumentOutOfRangeException`. Replaces an active penalty of the same type, even with a shorter one. A ban kicks the player if they're on the server. |
| `WouldShorten(type, steamId64, duration)` | The active penalty that adding this one would cut short, or `null`. Shortening partly lifts a penalty, so check this if that should need more than adding, as the Admin plugin's `ban` requires `admin.moderation.unban`. |
| `Remove(type, steamId64, by)` | Lifts the active penalty. `false` if there wasn't one. |
| `GetActive(type, steamId64)` / `GetActive(type?)` | The active penalty, or every active one |
| `IsBanned`, `IsGagged`, `IsMuted` | Shortcuts for `GetActive(...) != null` |
| `GetHistoryAsync(steamId64)` | Everything the store has for a player, newest first, including lifted and expired ones |
| `RegisterStore(this, name, store)` | Supply penalties from a database or web panel (see below) |

**What Deadworks enforces:**

| Type | Enforced |
|------|----------|
| `Ban` | The player is refused at connect, and checked again once Steam has verified them |
| `Gag` | Their chat is dropped before chat commands' broadcast and before any plugin's `OnChatMessage`. Their chat commands still run. |
| `Mute` | Voice chat: the player's voice is dropped before anyone hears it or any plugin's `HookIncoming<CCLCMsg_VoiceData>` sees it |

`Add` can refuse:

| Exception | When |
|-----------|------|
| `ArgumentException` | The SteamID is `0` (bots have none). Check for it first, like the example above. |
| `CommandException`: `<name> hasn't been verified by Steam yet. Try again in a moment.` | The player is on the server but Steam hasn't confirmed them yet (see [Steam Verification](#steam-verification)). A SteamID for someone who isn't on the server is accepted as usual. |
| `CommandException`: `Penalties can't be changed right now: ...` | The penalty store isn't available (see [Custom Stores](#custom-stores)). `Remove` throws this too. |

Let a `CommandException` reach the caller, or catch it.

To react when a penalty starts or ends, for example to post it to Discord, override these in your plugin:

```csharp
public override void OnPenaltyAdded(Penalty penalty) { /* ... */ }
public override void OnPenaltyRemoved(Penalty penalty) { /* lifted, replaced or expired */ }
```

`OnPenaltyRemoved` isn't called for penalties that disappear because the store was reloaded.

**Immunity isn't checked by `Penalties`.** Check `caller.CanTarget(player)`, or, for offline players, `caller.IsConsole || Permissions.CanTarget(caller.SteamId64, targetId)`, before penalizing someone on another player's behalf. A `Target` argument does this for you when the command has a permission.

`Penalty` is a record with `Id` (a `Guid`), `Type`, `SteamId64`, `PlayerName`, `CreatedUtc`, `ExpiresUtc` (null = permanent), `Reason`, `AdminSteamId64` (0 = console), `AdminName`, `RemovedUtc`, `RemovedBySteamId64`, plus `IsPermanent`, `IsActiveAt(now)` and `DescribeRemaining(now)` ("for 1h 5m", "permanently").

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

- new players are refused at connect with `This server can't check its ban list right now. Try again in a few minutes.` Bots are never refused.
- players already on the server stay, including when they reload after a map change, and bans that were already loaded are still enforced.
- adding or lifting penalties throws `Penalties can't be changed right now: the '<store>' store isn't available.`

If `penalties.jsonc` breaks after it loaded once, the old penalties stay enforced, but changes are refused with `Penalties can't be changed right now: penalties.jsonc has an error. Fix it and run dw_penalties_reload.`

## Admin Activity

Announce what an admin did and record it in the admin log:

```csharp
AdminActivity.Show(caller, $"slayed {player.PlayerName}", details: $"target={id}");
AdminActivity.Log(caller, $"ran rcon: {command}");   // logged, not announced
```

| Member | Description |
|--------|-------------|
| `Show(admin, action, details = null)` | Announces `action` in chat and logs it. `admin` is a `Caller`. `details` goes in the log only. |
| `Log(admin, action, details = null)` | Logs without announcing |

To receive every logged action, e.g. to forward it to Discord, override `OnAdminAction` in your plugin:

```csharp
public override void OnAdminAction(AdminLogEntry entry)
{
    // ...
}
```

Players see `ADMIN: slayed lapka`; players with `deadworks.admin.notify` see `wisp: slayed lapka`. Server owners can change both under `admin.show_activity` in `configs/deadworks.jsonc`. Every `Show` and `Log` is also written to `logs/admin/admin-YYYY-MM-DD.log` (the folder is `admin.log_dir`), as `<time> <admin> (<steamid>) <action> [<details>]` in UTC. Only actions that go through `AdminActivity` are logged; Deadworks' own permission commands aren't.

When the Admin plugin's `rcon` sets a password cvar (or `rcon_password`), the log and `OnAdminAction` get `ran rcon: sv_password (value hidden)` instead of the value. If you log commands yourself, leave secrets out.

## Server Helpers

| Member | Description |
|--------|-------------|
| `Server.Kick(slot, message)` / `controller.Kick(message)` | Disconnects a player, printing the message to their chat and console first and passing it to the engine as the reason. Deadlock doesn't show the engine's reason to the player |
| `Server.ExecuteCommand(command, onOutput)` | Runs a server command and gives you what it printed. The callback comes on a later frame. |
| `Server.IsMapValid(map)` | Whether a map exists. Names containing spaces, `;`, quotes or `..` are always rejected, so a valid name is safe to put in a command. |
| `Server.GetMapList()` | The game's maps plus `serverbrowser.extra_maps` |
| `Server.ChangeMap(map)` | Changes map if `IsMapValid` accepts it |

## Steam Verification

The engine checks a player's Steam ticket when they connect, so the SteamID is already the right one. A few seconds later Steam confirms the ticket is still valid; until then the player has only the `default` role (so `default`'s immunity, 0 unless the owner set one), and can't be banned, gagged or muted. See [Steam Validation](../guides/admins-and-permissions#steam-validation) for why.

| Member | Description |
|--------|-------------|
| `Players.IsAuthenticated(slot)` | Whether Steam has confirmed the player. `false` for bots and empty slots. `true` straight away when `sv_lan` is on or `require_steam_auth` is off. |
| `Permissions.GetSteamId(slot)` | The SteamID the player connected with |

To run code when Steam confirms a player, override `OnClientAuthorized`. It's called once per connection, and not again when the player reloads after a map change:

```csharp
public override void OnClientAuthorized(ClientAuthorizedEvent args)
{
    // args.Slot, args.SteamId64, args.Controller (may be null)
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

The reason goes to the server console. Deadlock doesn't show it to the player, who is simply disconnected, so don't rely on it to explain anything to them.

## See Also

- [3. The Admin Plugin](../guides/admin-plugin): the shipped commands built on these APIs
- [Permissions API](permissions): `Caller`, `HasPermission`, `Target` and immunity
