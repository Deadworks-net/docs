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
        pawn.ModifyCurrency(ECurrencyType.EAbilityPoints, 17, ECurrencySource.ECheats, false, false, false);
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

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `SetString(string key, string value)` | `GameEventWriter` | Set string field (chainable) |
| `SetInt(string key, int value)` | `GameEventWriter` | Set int field (chainable) |
| `SetFloat(string key, float value)` | `GameEventWriter` | Set float field (chainable) |
| `SetBool(string key, bool value)` | `GameEventWriter` | Set bool field (chainable) |
| `Fire(bool dontBroadcast)` | `bool` | Fires the event. Returns success. After firing, owned by engine — must not be used |

## Common Game Events

| Event Name | Typical fields | Notes |
|------------|----------------|-------|
| `player_death` | `userid`, `attacker` | Fires on hero death |
| `player_spawn` | `userid` | See warning below — fires **before** the pawn is fully materialized on the first spawn |
| `player_hero_changed` | `userid` | More reliable than `player_spawn` for post-hero-select logic |
| `player_used_ability` | `userid`, `abilityname`, `Annotation` | Fires for every ability activation including shots (`citadel_weapon_*`) and melee (`ability_melee_*`) |
| `ability_added` | `userid`, `abilityname` | Fires when an ability/item is granted — use this to detect item purchases |
| `game_state_changed` | — | Fires at major match transitions, including end-of-match |

The full list of Source 2 events shipped by Deadlock is available at [SteamTracking-Deadlock/resource/core.gameevents](https://github.com/SteamTracking/GameTracking-Deadlock/blob/master/game/core/pak01_dir/resource/core.gameevents) and [game.gameevents](https://github.com/SteamTracking/GameTracking-Deadlock/blob/master/game/citadel/pak01_dir/resource/game.gameevents). These files list every event name and its field schema.

## Common Patterns

### Detecting a melee attack

```csharp
[GameEventHandler("player_used_ability")]
public HookResult OnAbility(GameEvent ev)
{
    var name = ev.GetString("abilityname", "");
    if (!name.StartsWith("ability_melee")) return HookResult.Continue;

    // Annotation tells heavy vs light melee
    var kind = ev.GetString("Annotation", ""); // "heavy_melee" or "light_melee"
    Console.WriteLine($"Melee attack: {kind}");
    return HookResult.Continue;
}
```

You could also use `OnAbilityAttempt` with `InputButton.Weapon1`, but `player_used_ability` fires only on successful activation and gives you the heavy/light distinction for free.

### Detecting a weapon shot

Same event, different prefix check:

```csharp
if (name.StartsWith("citadel_weapon_")) { /* shot fired */ }
```

### Detecting an item purchase

```csharp
[GameEventHandler("ability_added")]
public HookResult OnAbilityAdded(GameEvent ev)
{
    var pawn = ev.GetPlayerPawn("userid")?.As<CCitadelPlayerPawn>();
    if (pawn == null) return HookResult.Continue;

    // ability_added fires both for ability unlocks and for item purchases.
    // Walk the pawn's abilities on the next tick to see what's actually there.
    Timer.Once(1.Seconds(), () =>
    {
        foreach (var ab in pawn.AbilityComponent.Abilities)
            if (ab.IsItem && ab.AbilityName == "upgrade_unstoppable")
                Console.WriteLine("Bought Unstoppable!");
    });
    return HookResult.Continue;
}
```

> The delay is important — without it, the swap/decision happens while the player is still in the shop UI and the result visibly snaps. One second matches what the shipped `UnstoppableSwapPlugin` example does.

### Detecting match end

The cleanest signal is `game_state_changed`. If you need something more specific, the final patron entity being killed (visible in `OnEntityDeleted`) is also reliable.

## player_spawn Is Racy on First Spawn

The `player_spawn` event fires before the pawn is fully populated the first time a player connects. Subsequent spawns are fine. If your handler dereferences hero data (`GetHeroPawn`, `AbilityComponent`, etc.), either:

- Subscribe to `player_hero_changed` instead — it fires after hero data is ready, and
- Use `Timer.NextTick` or a short delay to re-check the pawn before touching it.

```csharp
[GameEventHandler("player_hero_changed")]
public HookResult OnHeroChanged(GameEvent ev)
{
    var pawn = ev.GetPlayerPawn("userid")?.As<CCitadelPlayerPawn>();
    if (pawn == null) return HookResult.Continue;
    // safe to inspect pawn's hero-specific state here
    return HookResult.Continue;
}
```

:::tip
`GameEvents.AddListener` is confirmed working for dynamic event listeners. The returned `IHandle` can be cancelled to stop listening. The `[GameEventHandler]` attribute also works for auto-registered handlers.
:::

## See Also

- [Plugin Base](plugin-base) — Lifecycle hooks
- [Players](players) — Player pawn and controller access
- [Deathmatch Example](../examples/deathmatch) — Game event usage in practice
