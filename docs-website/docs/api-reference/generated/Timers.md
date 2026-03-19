---
title: "Timers"
sidebar_label: "Timers"
sidebar_position: 21
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# ITimer

> **Namespace:** `DeadworksManaged.Api`

Per-plugin timer service. Access via `this.Timer` in any `IDeadworksPlugin`.

## Methods

| Method | Description |
|--------|-------------|
| `Once(Duration arg0, Action arg1)` | Execute a callback once after the specified delay. |
| `Every(Duration arg0, Action arg1)` | Execute a callback repeatedly at the specified interval. |
| `Sequence(Func<IStep, Pace> arg0)` | Run a stateful sequence. The callback receives an `IStep` and returns a `Pace` to control when the next invocation occurs. |
| `NextTick(Action arg0)` | Defer an action to the next tick. Thread-safe — can be called from any thread. |

---

## IHandle

> **Namespace:** `DeadworksManaged.Api`

A handle to a scheduled timer. Allows cancellation and status checking.

### Properties

| Property | Description |
|----------|-------------|
| `IsFinished` | Whether this timer has completed or been cancelled. |

### Methods

| Method | Description |
|--------|-------------|
| `Cancel()` | Cancel this timer. If already finished, this is a no-op. |

---

## IStep

> **Namespace:** `DeadworksManaged.Api`

Sequence step context passed to `Pace})` callbacks. Provides execution count and methods to control pacing.

### Properties

| Property | Description |
|----------|-------------|
| `Run` | How many times the sequence callback has been invoked (starts at 1). |
| `ElapsedTicks` | Game ticks elapsed since the sequence started. |

### Methods

| Method | Description |
|--------|-------------|
| `Wait(Duration arg0)` | Execute again after the specified duration. |
| `Done()` | End the sequence. |

---

## Pace

> **Namespace:** `DeadworksManaged.Api`

Controls the flow of a timer sequence step. Created via `IStep` methods — not instantiated directly.

---

## WaitPace

> **Namespace:** `DeadworksManaged.Api`

Execute again after the specified duration.

---

## DonePace

> **Namespace:** `DeadworksManaged.Api`

The sequence is finished.

---

## TimerResolver

> **Namespace:** `DeadworksManaged.Api`

Internal resolver used by the IDeadworksPlugin.Timer default property. Set up by the host during initialization.
