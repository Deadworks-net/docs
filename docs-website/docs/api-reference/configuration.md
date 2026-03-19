---
title: "Configuration"
sidebar_label: "Configuration"
---

# Configuration

> **Namespace:** `DeadworksManaged.Api`

Plugins can declare JSON-serialized configuration using `IPluginConfig<T>` and `BasePluginConfig`.

## Basic Setup

### 1. Define a Config Class

Extend `BasePluginConfig` with your settings:

```csharp
using System.Text.Json.Serialization;

public class MyPluginConfig : BasePluginConfig
{
    [JsonPropertyName("swap_interval_seconds")]
    public int SwapIntervalSeconds { get; set; } = 10;

    [JsonPropertyName("selection_mode")]
    public string SelectionMode { get; set; } = "sequential";

    [JsonPropertyName("show_announcement")]
    public bool ShowAnnouncement { get; set; } = true;

    [JsonPropertyName("damage_multiplier")]
    public float DamageMultiplier { get; set; } = 1.0f;
}
```

### 2. Implement IPluginConfig\<T\>

Add the interface to your plugin class:

```csharp
public class MyPlugin : DeadworksPluginBase, IPluginConfig<MyPluginConfig>
{
    public override string Name => "My Plugin";

    public MyPluginConfig Config { get; set; } = new();

    [ChatCommand("settings")]
    public HookResult OnSettings(ChatCommandContext ctx)
    {
        var pawn = ctx.Controller?.GetHeroPawn();
        if (pawn == null) return HookResult.Handled;

        ctx.Controller.PrintToConsole($"Interval: {Config.SwapIntervalSeconds}s");
        ctx.Controller.PrintToConsole($"Mode: {Config.SelectionMode}");

        return HookResult.Handled;
    }
}
```

## Supported Types

Use standard C# types with `System.Text.Json.Serialization` attributes:

| Type | Example |
|------|---------|
| `int` | `10` |
| `float` | `1.5f` |
| `double` | `0.005` |
| `bool` | `true` |
| `string` | `"sequential"` |
| `List<T>` | Complex nested objects |
| Custom classes | Nested configuration objects |

## Complex Configuration Example

From the Item Rotation plugin:

```csharp
public class ItemSet
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("items")]
    public List<string> Items { get; set; } = new();
}

public class ItemRotationConfig : BasePluginConfig
{
    [JsonPropertyName("swap_interval_seconds")]
    public int SwapIntervalSeconds { get; set; } = 10;

    [JsonPropertyName("selection_mode")]
    public string SelectionMode { get; set; } = "sequential";

    [JsonPropertyName("allow_duplicate_sets")]
    public bool AllowDuplicateSets { get; set; } = true;

    [JsonPropertyName("show_rotation_announcement")]
    public bool ShowRotationAnnouncement { get; set; } = true;

    [JsonPropertyName("announcement_title")]
    public string AnnouncementTitle { get; set; } = "ITEM ROTATION";

    [JsonPropertyName("announcement_description")]
    public string AnnouncementDescription { get; set; } = "New item set: <item_set_name>";

    [JsonPropertyName("play_rotation_sound")]
    public bool PlayRotationSound { get; set; } = true;

    [JsonPropertyName("rotation_sound")]
    public string RotationSound { get; set; } = "Mystical.Piano.AOE.Warning";

    [JsonPropertyName("item_sets")]
    public List<ItemSet> ItemSets { get; set; } = new()
    {
        new() { Name = "Speed Demons", Items = new() { "item1", "item2" } },
        new() { Name = "Cardio Kings", Items = new() { "item3", "item4" } }
    };
}
```

## Validation

Validate config values in `OnLoad` or when first used:

```csharp
public override void OnLoad(bool isReload)
{
    if (Config.SwapIntervalSeconds < 1)
        Config.SwapIntervalSeconds = 10;

    if (Config.SelectionMode != "sequential" && Config.SelectionMode != "random")
        Config.SelectionMode = "sequential";

    // Clamp float values
    Config.DamageMultiplier = Math.Clamp(Config.DamageMultiplier, 0.0f, 1.0f);
}
```

## See Also

- [Plugin Base](plugin-base) — Base class and `IPluginConfig<T>`
- [Item Rotation Example](../examples/item-rotation) — Full config-driven plugin
- [Scourge Example](../examples/scourge) — Config with float clamping
