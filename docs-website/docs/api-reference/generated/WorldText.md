---
title: "World Text"
sidebar_label: "World Text"
sidebar_position: 10
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# CPointWorldText

> **Namespace:** `DeadworksManaged.Api`

Wraps the point_worldtext entity — a world-space text panel rendered in 3D.

## Methods

| Method | Description |
|--------|-------------|
| `SetMessage(string arg0)` | Sets the message text via entity input. |
| `Create(string arg0, Vector3 arg1, float arg2, byte arg3, byte arg4, byte arg5, byte arg6, int arg7)` | Creates and spawns a CPointWorldText at the given position. |

---

## ScreenText

> **Namespace:** `DeadworksManaged.Api`

Displays world text anchored to the player's camera via per-frame teleport.

### Properties

| Property | Description |
|----------|-------------|
| `Entity` | The underlying world text entity, or `null` if creation failed or the text has been destroyed. |
| `IsValid` | `true` if the text entity and its owning controller are both still alive. |

### Methods

| Method | Description |
|--------|-------------|
| `Create(CCitadelPlayerController controller, string message, float posX, float posY, float fontSize, byte r, byte g, byte b, byte a, float fwdOffset)` | Creates a screen-space text label for a player and begins tracking it each frame. |
| `SetText(string text)` | Updates the displayed text string. |
| `SetPosition(float posX, float posY)` | Changes the screen-space anchor position for subsequent frames. |
| `Destroy()` | Removes the text entity and stops tracking it. Safe to call multiple times. |
| `UpdateAll()` | Called every game frame. |
