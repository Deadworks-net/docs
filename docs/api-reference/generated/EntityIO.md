---
title: "Entity I/O"
sidebar_label: "Entity I/O"
sidebar_position: 12
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# EntityIO

> **Namespace:** `DeadworksManaged.Api`

Hooks into the Valve entity I/O system to observe output firings and input dispatches by entity designer name.

## Methods

| Method | Description |
|--------|-------------|
| `HookOutput(string designerName, string outputName, Action<EntityOutputEvent> handler)` | Subscribes to outputs fired by entities with the given designer name and output name. |
| `HookInput(string designerName, string inputName, Action<EntityInputEvent> handler)` | Subscribes to inputs dispatched to entities with the given designer name and input name. |

---

## EntityOutputEvent

> **Namespace:** `DeadworksManaged.Api`

Data for a fired entity output, passed to handlers registered via `EntityOutputEvent})`.

### Properties

| Property | Description |
|----------|-------------|
| `Entity` | The entity that fired the output. |
| `Activator` | The entity that activated the output, if any. |
| `Caller` | The entity that called the output, if any. |
| `OutputName` | The name of the output that fired (e.g. `"OnTrigger"`). |

---

## EntityInputEvent

> **Namespace:** `DeadworksManaged.Api`

Data for a received entity input, passed to handlers registered via `EntityInputEvent})`.

### Properties

| Property | Description |
|----------|-------------|
| `Entity` | The entity receiving the input. |
| `Activator` | The entity that activated the input, if any. |
| `Caller` | The entity that called the input, if any. |
| `InputName` | The name of the input being received (e.g. `"Kill"`). |
| `Value` | Optional string value passed with the input, or `null` if none. |
