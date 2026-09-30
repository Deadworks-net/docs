---
title: "Timers"
sidebar_label: "Timers"
---

# Timers

> **Namespace:** `DeadworksManaged.Api`

A timer runs code later, or over and over. Every plugin has a `Timer` property.

## Quick Start

```csharp
// Run once, after 5 seconds
Timer.Once(5.Seconds(), () =>
{
    Console.WriteLine("Five seconds passed.");
});

// Run every second, then stop after 10 seconds
var timer = Timer.Every(1.Seconds(), () =>
{
    Console.WriteLine("Still running...");
});

Timer.Once(10.Seconds(), () => timer.Cancel());
```

Timers are cleaned up when your plugin unloads. Cancel one yourself only to stop it sooner.

## Timer

| Method | Description |
|--------|-------------|
| `Once(duration, callback)` | Run one time after a delay |
| `Every(duration, callback)` | Run over and over until cancelled. Returns a handle |
| `NextTick(callback)` | Run on the next game tick |
| `Sequence(callback)` | Run in steps, where each step picks how long to wait next |

## Durations

| Example | Description |
|---------|-------------|
| `5.Seconds()` | 5 seconds |
| `500.Milliseconds()` | Half a second |
| `1.Ticks()` | 1 game tick, about 15.6 milliseconds on a 64 tick server |

Timers only run on game ticks, so `5.Seconds()` means the first tick after 5 seconds.

## Handles

`Timer.Every` returns an `IHandle`.

| Member | Description |
|--------|-------------|
| `Cancel()` | Stop the timer |
| `CancelOnMapChange()` | Stop the timer automatically when the map changes |
| `IsFinished` | Whether the timer has already ended |

## Sequence

Use `Timer.Sequence` for things like damage over time, where each step decides whether to wait again or stop.

```csharp
Timer.Sequence(step =>
{
    if (step.Run > 10)
        return step.Done();

    target.Hurt(damagePerTick, attacker: attacker);

    return step.Wait(200.Milliseconds());
});
```

`step.Run` is how many times it has run so far. See the [Scourge example](../examples/scourge).
