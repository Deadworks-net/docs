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

## The EKV Workflow (Full Control)

`CPointWorldText.Create` covers the common case. When you need access to keys the helper doesn't expose (reorientation, justify, depth offset, font name, fullbright), spawn the entity directly with `CEntityKeyValues`:

```csharp
var text = CBaseEntity.CreateByDesignerName("point_worldtext");
if (text == null) return;

var ekv = new CEntityKeyValues();
ekv.SetString("message", controller.PlayerName);
ekv.SetInt("font_size", 128);
ekv.SetString("font_name", "Comic Sans MS");
ekv.SetFloat("world_units_per_pixel", 0.15f);
ekv.SetInt("enabled", 1);
ekv.SetColor("color", 255, 255, 255, 255);
ekv.SetFloat("depth_render_offset", 0.125f);
ekv.SetInt("justify_horizontal", 1);   // 0 left, 1 center, 2 right
ekv.SetInt("reorient_mode", 1);        // 1 = always face the camera (around up axis)
ekv.SetInt("fullbright", 1);
text.Spawn(ekv);

text.Teleport(pawn.Position + new Vector3(0, 0, 96), new Vector3(0, 180, 90));
text.SetParent(pawn);
```

A few gotchas worth knowing before you burn hours on them:

- **The EKV key is `font_name`, not `font`.** Passing `font` silently does nothing.
- **`fullbright: 1` is required for the color to show unfiltered** — without it, text is tinted by world lighting and often reads as dim gray indoors.
- **`reorient_mode: 1`** rotates the text around its up axis so it faces each viewer's camera. Mode `0` is a fixed-orientation billboard.
- **`depth_render_offset`** nudges the text toward the camera in world units — use a small positive value (`0.125`) to push text in front of geometry it would otherwise z-fight with.
- **Fonts are looked up from the player's OS.** Deadlock does not ship fonts as usable by this entity. Stick to Windows 10 default fonts (Arial, Segoe UI, Consolas, Comic Sans MS, Verdana, …). Custom font files in the game's `pak01_dir` do **not** work.

## Nametag Pattern

Parent a worldtext to the pawn and it follows them around, bright side facing camera:

```csharp
public override void OnClientFullConnect(ClientFullConnectEvent args)
{
    var pawn = args.Controller?.GetHeroPawn();
    if (pawn == null) return;

    var text = CBaseEntity.CreateByDesignerName("point_worldtext");
    var ekv = new CEntityKeyValues();
    ekv.SetString("message", args.Controller.PlayerName);
    ekv.SetInt("font_size", 128);
    ekv.SetFloat("world_units_per_pixel", 0.12f);
    ekv.SetInt("justify_horizontal", 1);
    ekv.SetInt("reorient_mode", 1);
    ekv.SetInt("fullbright", 1);
    ekv.SetColor("color", 255, 255, 255, 255);
    text.Spawn(ekv);

    text.Teleport(pawn.Position + new Vector3(0, 0, 96), new Vector3(0, 180, 90));
    text.SetParent(pawn);
    // No need to track: when the pawn is removed, parented children die with it.
}
```

## Why Text Looks Blurry When Moving

Deadlock runs temporal upscaling (DLSS by default) which smears `point_worldtext` during movement. It's not a bug in your plugin — the same text is sharp on a stationary camera. Three partial mitigations:

- Bigger, thicker text reads through the smear better (larger `font_size`, heavier font)
- Higher `depth_render_offset` pushes the text closer to the camera, slightly improving sharpness
- On a development machine, disabling DLSS makes text crisp

You cannot fix this per-plugin — any user with DLSS on will see some smear.

## Attaching to the Camera

You **can't** parent a worldtext to the player's camera directly. The camera is not a networked entity, and the player controller sits at `(0,0,0)` on the server. Common workarounds:

- Attach to the pawn and accept that the text moves with the model (fine for nametags, timers, debug overlays)
- Recompute position every tick in `OnGameFrame` based on `EyePosition + forward * distance` (visible stutter because client prediction can't help)
- Use `CCitadelUserMsg_HudGameAnnouncement` for real HUD text (see [chat-and-hud](../guides/chat-and-hud))

## Map-Line Drawing

For drawing on the minimap instead of in the world, send `CCitadelUserMsg_MapLine` messages. Lines have an 8-second lifetime and are green only.

```csharp
// Draw a circle on the minimap at world position `center`, radius `radius`.
void DrawCircle(Vector3 center, float radius, int edges = 32)
{
    float step = MathF.PI * 2f / edges;
    for (int i = 0; i <= edges; i++)
    {
        float x = MathF.Cos(step * i) * radius;
        float y = MathF.Sin(step * i) * radius;

        var line = new CMsgMapLine {
            Initial = i == 0,              // first point breaks the chain
            X = (int)center.X + (int)x,
            Y = (int)center.Y + (int)y,
        };
        var msg = new CCitadelUserMsg_MapLine { Mapline = line, SenderPlayerSlot = 0 };
        NetMessages.Send(msg, RecipientFilter.All);
    }
}
```

Caveats:

- Only green lines are supported. Color overrides are ignored.
- Lines fade after ~8 seconds. Re-emit in `OnGameFrame` if you want persistent overlays.
- More than ~8192 active lines at once causes rendering artifacts (colors darken or clip).

## See Also

- [Entities](entities) — Base entity operations (`Remove`, `SetParent`)
- [Networking](networking) — HUD announcements as an alternative
- [Chat & HUD Messaging](../guides/chat-and-hud) — When to use worldtext vs announcements
