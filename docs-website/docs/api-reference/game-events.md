---
title: "Game Events"
sidebar_label: "Game Events"
---

# Game Events

> **Namespace:** `DeadworksManaged.Api`

Listen to and create Source 2 game events.

## GameEventHandlerAttribute

Auto-register a method as a game event handler:

```csharp
[GameEventHandler("player_hero_changed")]
public HookResult OnHeroChanged(GameEvent ev)
{
    var pawn = ev.GetPlayerPawn("player");
    if (pawn != null)
    {
        // Hero was changed — reset ability points
        pawn.ModifyCurrency(ECurrencyType.AbilityPoints, 17, ECurrencySource.FlagCapture, false, false, false);
    }
    return HookResult.Handled;
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `EventName` | `string` | Source 2 game event name (e.g. `"player_death"`) |

## GameEvent

Represents a Source 2 game event. Read fields via typed getter methods.

### Read Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `GetBool(string key, bool default)` | `bool` | Bool field value |
| `GetInt(string key, int default)` | `int` | Int field value |
| `GetFloat(string key, float default)` | `float` | Float field value |
| `GetString(string key, string default)` | `string` | String field value |
| `GetUint64(string key, ulong default)` | `ulong` | Uint64 field value |
| `GetPlayerController(string key)` | `CBasePlayerController?` | Player controller from ehandle field |
| `GetPlayerPawn(string key)` | `CBasePlayerPawn?` | Player pawn from ehandle field |
| `GetEHandle(string key)` | `CBaseEntity?` | Entity from ehandle field |

### Write Methods

| Method | Description |
|--------|-------------|
| `SetBool(string key, bool value)` | Set bool field |
| `SetInt(string key, int value)` | Set int field |
| `SetFloat(string key, float value)` | Set float field |
| `SetString(string key, string value)` | Set string field |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Name` | `string` | The event name (e.g. `"player_death"`) |

## GameEvents (Static Class)

Programmatic API for managing game event listeners.

| Method | Returns | Description |
|--------|---------|-------------|
| `AddListener(string name, GameEventHandler handler)` | `IHandle` | Register dynamic listener. Returns handle for cancellation |
| `RemoveListener(string name, GameEventHandler handler)` | `void` | Remove previously registered listener |
| `Create(string name, bool force)` | `GameEventWriter?` | Create a new game event. Must be fired or freed |

### Dynamic Listener Example

```csharp
private IHandle? _deathListener;

public override void OnLoad(bool isReload)
{
    _deathListener = GameEvents.AddListener("player_death", OnPlayerDeath);
}

private HookResult OnPlayerDeath(GameEvent ev)
{
    var victim = ev.GetPlayerPawn("player");
    Console.WriteLine($"Player died: {victim?.Classname}");
    return HookResult.Handled;
}

public override void OnUnload()
{
    _deathListener?.Cancel();
}
```

## GameEventWriter

Wraps a newly created game event for setting fields and firing.

```csharp
var ev = GameEvents.Create("my_custom_event", force: true);
if (ev != null)
{
    ev.SetInt("player_slot", 0);
    ev.SetString("action", "test");
    ev.Fire(dontBroadcast: false);
    // After firing, the event is owned by the engine — do not use it again
}
```

| Method | Description |
|--------|-------------|
| `Fire(bool dontBroadcast)` | Fires the event. After firing, owned by engine — must not be used |

## Common Game Events

| Event Name | Description | Verified |
|------------|-------------|----------|
| `player_death` | Player died. Fields: `userid`, `attacker` | Yes |
| `player_hero_changed` | Player changed their hero | - |
| `player_spawn` | Player spawned | - |

:::tip
`GameEvents.AddListener` is confirmed working for dynamic event listeners. The returned `IHandle` can be cancelled to stop listening. The `[GameEventHandler]` attribute also works for auto-registered handlers.

The engine has 100+ game event types including `ability_added`, `ability_cast_succeeded`, `ability_cooldown_end_changed`, `item_purchase`, `break_breakable`, `citadel_pause_event`, and many more — see the decompiled API for the full list in `GameEventFactory`.
:::

## See Also

- [Plugin Base](plugin-base) — Lifecycle hooks
- [Players](players) — Player pawn and controller access
- [Deathmatch Example](../examples/deathmatch) — Game event usage in practice
