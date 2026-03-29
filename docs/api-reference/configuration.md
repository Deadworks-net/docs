---
title: "Configuration"
sidebar_label: "Configuration"
---

# Configuration

> **Namespace:** `DeadworksManaged.Api`

Plugins can declare JSON-serialized configuration using `IConfig` and the `[PluginConfig]` attribute.

## Core API

| Type | Description |
|------|-------------|
| `IConfig` | Interface with a `Validate()` method — implement on your config class |
| `[PluginConfig]` | Attribute marking a property as the plugin's config (applied to the Config property) |
| `plugin.ReloadConfig()` | Extension method to reload config from disk at runtime |
| `plugin.GetConfigPath()` | Extension method to get the config file path |

## Basic Setup

### 1. Define a Config Class

Implement `IConfig` with your settings:

```csharp
using System.Text.Json.Serialization;

public class MyPluginConfig : IConfig
{
    [JsonPropertyName("swap_interval_seconds")]
    public int SwapIntervalSeconds { get; set; } = 10;

    [JsonPropertyName("selection_mode")]
    public string SelectionMode { get; set; } = "sequential";

    [JsonPropertyName("show_announcement")]
    public bool ShowAnnouncement { get; set; } = true;

    [JsonPropertyName("damage_multiplier")]
    public float DamageMultiplier { get; set; } = 1.0f;

    public void Validate()
    {
        if (SwapIntervalSeconds < 1) SwapIntervalSeconds = 10;
        DamageMultiplier = Math.Clamp(DamageMultiplier, 0f, 10f);
    }
}
```

### 2. Add Config Property to Plugin

Mark your config property with `[PluginConfig]`:

```csharp
public class MyPlugin : DeadworksPluginBase
{
    public override string Name => "My Plugin";

    [PluginConfig]
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

public class ItemRotationConfig : IConfig
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

    public void Validate()
    {
        if (SwapIntervalSeconds < 1) SwapIntervalSeconds = 10;
    }
}
```

## Validation

The `IConfig.Validate()` method is called automatically after config is loaded or reloaded. Put your validation logic there:

```csharp
public void Validate()
{
    if (SwapIntervalSeconds < 1)
        SwapIntervalSeconds = 10;

    if (SelectionMode != "sequential" && SelectionMode != "random")
        SelectionMode = "sequential";

    DamageMultiplier = Math.Clamp(DamageMultiplier, 0.0f, 1.0f);
}
```

### Runtime Reload

Reload config from disk at runtime:

```csharp
[ConCommand("dw_reload_config")]
public void OnReloadConfig(ConCommandContext ctx)
{
    bool success = this.ReloadConfig();
    ctx.Controller?.PrintToConsole(success ? "Config reloaded!" : "Reload failed.");
}
```

## See Also

- [Plugin Base](plugin-base) — Base class and `OnConfigReloaded` hook
- [Item Rotation Example](../examples/item-rotation) — Full config-driven plugin
- [Scourge Example](../examples/scourge) — Config with float clamping
