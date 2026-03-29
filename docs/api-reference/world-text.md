---
title: "World Text"
sidebar_label: "World Text"
---

# World Text

> **Namespace:** `DeadworksManaged.Api`

Display text in the 3D world or anchored to a player's screen.

## CPointWorldText

Wraps the `point_worldtext` entity — a world-space text panel rendered in 3D.

### Creating World Text

```csharp
var text = CPointWorldText.Create(
    message: "Hello World",
    position: new Vector3(100, 200, 300),
    fontSize: 100f,
    worldUnitsPerPx: null,     // null = auto-calculated from fontSize
    fontName: null,            // null = default font
    r: 255, g: 255, b: 255, a: 255,  // RGBA color
    reorientMode: 0            // 0 = no reorientation
);
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | `string` | — | Text to display |
| `position` | `Vector3` | — | World-space position |
| `fontSize` | `float` | `100f` | Font size in pixels |
| `worldUnitsPerPx` | `float?` | `null` | World units per pixel (`null` = auto-calculated as `0.25 / 1050 * fontSize`) |
| `fontName` | `string?` | `null` | Font name (`null` = default, max 63 bytes UTF-8) |
| `r, g, b, a` | `byte` | `255` | RGBA color components |
| `reorientMode` | `int` | `0` | Reorientation mode (0 = none) |

### Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `Enabled` | `bool` | Enable/disable the text entity |
| `Fullbright` | `bool` | Whether text is fullbright (ignores lighting) |
| `FontSize` | `float` | Font size in pixels |
| `WorldUnitsPerPx` | `float` | World units per pixel |
| `DepthOffset` | `float` | Depth offset for rendering |
| `FontName` | `string` | Font name (max 63 bytes UTF-8) |
| `ColorABGR` | `uint` | Color as ABGR uint32 |
| `JustifyHorizontal` | `HorizontalJustify` | Horizontal text justification |
| `JustifyVertical` | `VerticalJustify` | Vertical text justification |

### Updating Text

```csharp
text.SetMessage("Updated text!");
text.SetColor(255, 0, 0);           // RGB (alpha defaults to 255)
text.SetColor(255, 0, 0, 128);      // RGBA
```

### Cleanup

```csharp
text.Remove();  // Inherited from CBaseEntity
```

## Screen-Anchored Text (Pattern)

There is no dedicated `ScreenText` class. To display text anchored to a player's camera, create a `CPointWorldText` and parent it to the player pawn using `SetParent()`.

:::tip Camera Offset
Deadlock uses a right-shoulder third-person camera, positioned ~35 units to the right of the player's eye position. ScreenText positions are relative to the model eye, not the actual camera — so screen-center coordinates are **not** `(0.5, 0.5)`.

**Calibrated center position:** `posX: 2.341f, posY: 2.6f` (these values are far beyond the 0-1 range due to the shoulder offset).
:::

### Positioning Tips

| Parameter | Recommended Value | Notes |
|-----------|-------------------|-------|
| `fwdOffset` | `-50f` | Places text close to camera (behind eye position) |
| `posX` | `2.341f` | Horizontal center (accounting for shoulder camera) |
| `posY` | `2.6f` | Vertical center |
| `PixelSize` | `50f` | Good size for pixel art blocks |
| `SpacingX` | `0.023f` | Horizontal character spacing |
| `SpacingY` | `0.06f` | Vertical character spacing (~2.6x taller than wide for "█") |

:::tip Pixel Art
Use the full block character `"█"` for pixel-art style displays. The `"."` character is invisible at small sizes. The block character is approximately 2.6x taller than wide, so adjust `SpacingX` and `SpacingY` accordingly for square pixels.
:::

### Example: Toggle Screen Overlay

From the Deathmatch plugin:

```csharp
private CPointWorldText? _screenText;

[ChatCommand("worldtext")]
public HookResult OnWorldText(ChatCommandContext ctx)
{
    var pawn = ctx.Controller?.GetHeroPawn();
    if (pawn == null) return HookResult.Handled;

    if (_screenText != null)
    {
        _screenText.Remove();
        _screenText = null;
        return HookResult.Handled;
    }

    // Create text at screen center
    _screenText = CPointWorldText.Create(
        "OVERLAY TEXT",
        pawn.EyePosition,  // Will be parented to player
        fontSize: 200f,
        r: 255, g: 255, b: 255, a: 255
    );

    return HookResult.Handled;
}
```

## See Also

- [Entities](entities) — Base entity operations (`Remove`, `SetParent`)
- [Networking](networking) — HUD announcements as an alternative
