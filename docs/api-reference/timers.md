---
title: "Timers"
sidebar_label: "Timers"
---

# Timers

> **Namespace:** `DeadworksManaged.Api`

The timer system provides per-plugin scheduling for delayed and repeating actions. Access via `this.Timer` in any `DeadworksPluginBase` subclass.

## Duration

Strongly-typed time value representing either game ticks or wall-clock time. Created via extension methods:

```csharp
// Tick-based (tied to server tick rate)
1.Ticks()       // 1 game tick
64.Ticks()      // 64 game ticks

// Real-time
3.Seconds()     // 3 seconds
1.5.Seconds()   // 1.5 seconds
500.Milliseconds()  // 500ms
1700.Milliseconds() // 1.7 seconds
```

### Extension Methods

| Method | Input Type | Description |
|--------|-----------|-------------|
| `.Ticks()` | `int`, `long` | Create tick-based duration |
| `.Seconds()` | `int`, `double` | Create real-time duration |
| `.Milliseconds()` | `int`, `long` | Create duration in milliseconds |

## ITimer

Per-plugin timer service. Accessed via `this.Timer` property.

### Timer.Once

Execute a callback once after a delay:

```csharp
Timer.Once(5.Seconds(), () =>
{
    Console.WriteLine("5 seconds have passed!");
});
```

### Timer.Every

Execute a callback repeatedly at a fixed interval. Returns an `IHandle` for cancellation:

```csharp
var handle = Timer.Every(1.Ticks(), () =>
{
    // Runs every tick
    pawn.AbilityComponent.ResourceStamina.CurrentValue =
        pawn.AbilityComponent.ResourceStamina.MaxValue;
});

// Cancel later
handle.Cancel();
```

### Timer.Sequence

Run a stateful sequence with control over pacing. Useful for multi-step timed effects:

```csharp
Timer.Sequence(step =>
{
    // step.Run = how many times invoked (starts at 1)
    // step.ElapsedTicks = ticks since sequence started

    if (step.Run > 10)
        return step.Done();  // End the sequence

    // Apply damage each step
    target.Hurt(damagePerTick, attacker, attacker, null);

    return step.Wait(200.Milliseconds());  // Wait before next step
});
```

### Timer.NextTick

Defer an action to the next game tick. Thread-safe:

```csharp
Timer.NextTick(() =>
{
    // Runs on the next tick
});
```

## IHandle

Handle to a scheduled timer for cancellation and status checking.

| Member | Type | Description |
|--------|------|-------------|
| `Cancel()` | `void` | Cancel this timer. No-op if already finished |
| `CancelOnMapChange()` | `void` | Auto-cancel this timer when the map changes |
| `IsFinished` | `bool` | Whether this timer has completed or been cancelled |

## IStep

Sequence step context passed to `Timer.Sequence` callbacks.

| Member | Type | Description |
|--------|------|-------------|
| `Run` | `int` | How many times the callback has been invoked (starts at 1) |
| `ElapsedTicks` | `long` | Game ticks elapsed since the sequence started |
| `Wait(Duration)` | `Pace` | Execute again after specified duration |
| `Done()` | `Pace` | End the sequence |

## Patterns

### Per-Entity Timer Tracking

Use [`EntityData<IHandle?>`](entities) to track timers per entity:

```csharp
private readonly EntityData<IHandle?> _timers = new();

// Start a timer for a specific entity
var timer = Timer.Every(1.Ticks(), () => { /* ... */ });
_timers[pawn] = timer;

// Cancel later
if (_timers.TryGet(pawn, out var t))
{
    t?.Cancel();
    _timers.Remove(pawn);
}
```

### Toggle Pattern

```csharp
private readonly EntityData<IHandle?> _activeTimers = new();

[Command("stamina")]
public void CmdStamina(CCitadelPlayerController caller)
{
    var pawn = caller.GetHeroPawn();
    if (pawn == null) return;

    // If already active, cancel (toggle off)
    if (_activeTimers.TryGet(pawn, out var existing) && existing != null)
    {
        existing.Cancel();
        _activeTimers.Remove(pawn);
        return;
    }

    // Start new timer (toggle on)
    var timer = Timer.Every(1.Ticks(), () =>
    {
        if (pawn.Health <= 0) return;
        var stamina = pawn.AbilityComponent.ResourceStamina;
        stamina.LatchValue = stamina.MaxValue;
        stamina.CurrentValue = stamina.MaxValue;
    });
    _activeTimers[pawn] = timer;
}
```

## Cleanup

Timers are **per-plugin** and automatically cleaned up when the plugin is unloaded. For manual cleanup in `OnUnload()`:

```csharp
public override void OnUnload()
{
    // EntityData stores will be cleaned up,
    // but you can manually cancel if needed
}
```

## See Also

- [Entities](entities) — `EntityData<T>` for per-entity state
- [First Plugin](../getting-started/first-plugin) — `DeadworksPluginBase` gives your plugin a `Timer`
- [Scourge Example](../examples/scourge) — DOT effect using `Timer.Sequence`
