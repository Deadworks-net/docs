---
title: "Timers"
sidebar_label: "Timers"
---

# Timers

> **Namespace:** `DeadworksManaged.Api`

Every plugin gets a `Timer` property from `DeadworksPluginBase`.

Use timers when you want code to:

- run later
- repeat on an interval
- wait until the next tick
- stop after a certain amount of time

## Which Timer Should I Use?

| If you want to... | Use this |
|-------------------|----------|
| run code one time after a delay | `Timer.Once(...)` |
| run code over and over | `Timer.Every(...)` |
| wait until the next game tick | `Timer.NextTick(...)` |
| build a multi-step timed effect | `Timer.Sequence(...)` |

If you are new, start with `Once`, `Every`, and `NextTick`. You can ignore `Sequence` until you need it.

## Durations

A `Duration` is just "how long should this wait?"

```csharp
1.Ticks()            // 1 game tick
5.Seconds()          // 5 real seconds
500.Milliseconds()   // half a second
1700.Milliseconds()  // 1.7 seconds
```

A game tick is one server update step.

Deadworks only runs timer callbacks on ticks, never between them.

That means:

- `1.Ticks()` means "wait exactly 1 server tick"
- `5.Seconds()` means "wait at least 5 seconds, then run on the next game tick"
- `500.Milliseconds()` means "wait at least 500ms, then run on the next game tick"

On a 64 tick server, one tick is about 15.6 milliseconds.

Use `Ticks()` when you care about exact tick counts, such as "next tick" or "every tick."

## Timer.Once

Use `Timer.Once` when something should happen one time after a delay:

```csharp
Timer.Once(5.Seconds(), () =>
{
    Console.WriteLine("Five seconds passed.");
});
```

## Timer.Every

Use `Timer.Every` when something should keep running until you stop it.

`Timer.Every` returns a handle. Save that handle if you want to cancel the timer later.

```csharp
var regenTimer = Timer.Every(1.Seconds(), () =>
{
    Console.WriteLine("Still running...");
});

Timer.Once(10.Seconds(), () => regenTimer.Cancel());
```

## Timer.NextTick

Use `Timer.NextTick` when you want to wait just one game tick before touching the game again.

This is useful when:

- an entity exists but is not fully ready yet
- you just spawned something and want to touch it on the next tick
- you came back from `await` and need to get onto the game thread safely

```csharp
Timer.NextTick(() =>
{
    // Safe place to touch game objects on the next tick
});
```

## Timer.Sequence

`Timer.Sequence` is the more advanced timer.

Use it when each step decides whether to keep going, wait again, or stop.

```csharp
Timer.Sequence(step =>
{
    if (step.Run > 10)
        return step.Done();

    target.Hurt(damagePerTick, attacker: attacker);

    return step.Wait(200.Milliseconds());
});
```

Useful pieces inside a sequence:

- `step.Run` is how many times the sequence has run so far
- `step.Wait(...)` tells it when to run again
- `step.Done()` stops the sequence

This is good for things like damage-over-time effects, wave spawners, and short scripted sequences.

## Timer Handles

Repeating timers give you an `IHandle`.

You usually only need three parts of it:

| Member | What it does |
|--------|---------------|
| `Cancel()` | Stops the timer |
| `CancelOnMapChange()` | Stops the timer automatically when the map changes |
| `IsFinished` | Tells you whether the timer already ended |

## One Timer Per Player or Entity

If each player or pawn should have its own running timer, store the handle for that specific entity.

[`EntityData<IHandle?>`](entities) works well for this:

```csharp
private readonly EntityData<IHandle?> _timers = new();

var timer = Timer.Every(1.Ticks(), () =>
{
    // ...
});

_timers[pawn] = timer;

if (_timers.TryGet(pawn, out var existing) && existing != null)
{
    existing.Cancel();
    _timers.Remove(pawn);
}
```

## Cleanup

Timers belong to your plugin, so they are automatically cleaned up when the plugin unloads.

You only need to cancel them yourself when you want to stop them earlier than that.

## See Also

- [Entities](entities) - `EntityData<T>` for per-entity state
- [First Plugin](../getting-started/first-plugin) - `DeadworksPluginBase` gives your plugin a `Timer`
- [Scourge Example](../examples/scourge) - DOT effect using `Timer.Sequence`
