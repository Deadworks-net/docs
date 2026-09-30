---
title: "Timers"
sidebar_label: "Timers"
---

# Timers

> **Namespace:** `DeadworksManaged.Api`

A timer runs code later, or over and over. Every plugin has a `Timer` property, so you can use it anywhere in your plugin.

## Run something after a delay

```csharp
Timer.Once(5.Seconds(), () =>
{
    Console.WriteLine("Five seconds passed.");
});
```

## Run something over and over

```csharp
Timer.Every(1.Seconds(), () =>
{
    Console.WriteLine("Still running...");
});
```

It keeps running until you stop it or your plugin unloads.

## Stop a timer

`Timer.Every` gives you back a handle. Keep it, and call `Cancel()` when you want the timer to stop.

```csharp
var timer = Timer.Every(1.Seconds(), () =>
{
    Console.WriteLine("Still running...");
});

// Stop it after 10 seconds
Timer.Once(10.Seconds(), () => timer.Cancel());
```

To stop it automatically when the map changes:

```csharp
timer.CancelOnMapChange();
```

You don't have to stop timers when your plugin unloads. Deadworks does that for you.

## Choose how long to wait

```csharp
5.Seconds()
500.Milliseconds()
1.Ticks()
```

A tick is one step of the game. On a 64 tick server, that is about 15.6 milliseconds.

Timers only run on ticks, so `5.Seconds()` means the first tick after 5 seconds have passed.

## Run something every tick

```csharp
Timer.Every(1.Ticks(), () =>
{
    // Runs 64 times a second on a 64 tick server
});
```

## Wait one tick

```csharp
Timer.NextTick(() =>
{
    // ...
});
```

Use this when you have just created something and it isn't ready yet, or when you are back from an `await` and need to touch the game again.

## Run something a set number of times

Use `Timer.Sequence`. Each time it runs, you decide whether to wait and run again, or stop.

```csharp
Timer.Sequence(step =>
{
    if (step.Run > 10)
        return step.Done();

    target.Hurt(damagePerTick, attacker: attacker);

    return step.Wait(200.Milliseconds());
});
```

`step.Run` is how many times it has run so far. This deals damage every 200 milliseconds and stops once `step.Run` passes 10.
## Give each player their own timer

Keep each player's handle in an [`EntityData`](entities#store-a-value-for-each-entity), so you can stop the right one later.

```csharp
private readonly EntityData<IHandle?> _timers = new();

// Start one for this player
_timers[pawn] = Timer.Every(1.Seconds(), () =>
{
    // ...
});

// Stop it later
if (_timers.TryGet(pawn, out var timer) && timer != null)
{
    timer.Cancel();
    _timers.Remove(pawn);
}
```
