---
title: "Entity I/O"
sidebar_label: "Entity I/O"
---

# Entity I/O

> **Namespace:** `DeadworksManaged.Api`

Hook into the Valve entity I/O system to observe output firings and input dispatches by entity designer name.

## EntityIO

### Hooking Outputs

Subscribe to outputs fired by entities with a given designer name:

```csharp
var handle = EntityIO.HookOutput("trigger_multiple", "OnTrigger", ev =>
{
    Console.WriteLine($"Trigger fired by entity {ev.Entity.EntityIndex}");
    Console.WriteLine($"Activator: {ev.Activator?.Classname}");
});

// Cancel later
handle.Cancel();
```

### Hooking Inputs

Subscribe to inputs dispatched to entities:

```csharp
var handle = EntityIO.HookInput("func_button", "Kill", ev =>
{
    Console.WriteLine($"Kill input received by {ev.Entity.Classname}");
    Console.WriteLine($"Value: {ev.Value}");
});
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `HookOutput(string designerName, string outputName, Action<EntityOutputEvent>)` | `IHandle` | Subscribe to outputs by designer name and output name |
| `HookInput(string designerName, string inputName, Action<EntityInputEvent>)` | `IHandle` | Subscribe to inputs by designer name and input name |

Both return an `IHandle` that cancels the hook when disposed or cancelled.

:::caution Limited Entity I/O Support
Entity I/O hooks work with map-placed entities that use the Source 2 I/O system (e.g. `trigger_multiple`, `func_button`). Player entities (`"player"`) do not fire standard I/O outputs like `"OnDeath"` — use `OnTakeDamage` or `GameEvents.AddListener("player_death")` instead for player death detection.
:::

## EntityOutputEvent

Data for a fired entity output.

| Property | Type | Description |
|----------|------|-------------|
| `Entity` | `CBaseEntity` | The entity that fired the output |
| `Activator` | `CBaseEntity?` | The entity that activated the output |
| `Caller` | `CBaseEntity?` | The entity that called the output |
| `OutputName` | `string` | Name of the output (e.g. `"OnTrigger"`) |

## EntityInputEvent

Data for a received entity input.

| Property | Type | Description |
|----------|------|-------------|
| `Entity` | `CBaseEntity` | The entity receiving the input |
| `Activator` | `CBaseEntity?` | The activating entity |
| `Caller` | `CBaseEntity?` | The calling entity |
| `InputName` | `string` | Name of the input (e.g. `"Kill"`) |
| `Value` | `string?` | Optional string value passed with the input |

## AcceptInput

You can also fire inputs directly on entities. See [Entities](entities):

```csharp
entity.AcceptInput("Start", activator: null, caller: null, value: "");
entity.AcceptInput("Kill", activator: null, caller: null, value: "");
```

## See Also

- [Entities](entities) — `AcceptInput` method
- [Plugin Base](plugin-base) — Entity lifecycle hooks
