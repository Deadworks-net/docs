---
title: "Configuration"
sidebar_label: "Configuration"
---

# Configuration

> **Namespace:** `DeadworksManaged.Api`

A config is a file of settings for your plugin. A server owner can change the settings by editing the file, without touching your code.

## Give your plugin a config

Write a class with a property for each setting. Then add a property of that class to your plugin, marked `[PluginConfig]`.

```csharp
public class MyPluginConfig
{
    public int IntervalSeconds { get; set; } = 10;
    public bool ShowAnnouncement { get; set; } = true;
    public string Title { get; set; } = "ITEM ROTATION";
}

public class MyPlugin : DeadworksPluginBase
{
    public override string Name => "My Plugin";

    [PluginConfig]
    public MyPluginConfig Config { get; set; } = new();
}
```

The value you give each property is its default.

## Find the config file

Deadworks creates the file, filled in with your defaults, the first time your plugin loads. It is named after your plugin's class:

```text
game/bin/win64/configs/MyPlugin/MyPlugin.jsonc
```

```jsonc
// Configuration for My Plugin
{
  "IntervalSeconds": 10,
  "ShowAnnouncement": true,
  "Title": "ITEM ROTATION"
}
```

It is JSON that also allows comments.

## Use a setting in your code

Read it from your `Config` property.

```csharp
[Command("interval")]
public void CmdInterval(Caller caller)
{
    caller.Reply($"Items rotate every {Config.IntervalSeconds} seconds.");
}
```

## Change a setting while the server is running

Edit the file, then type this in the server console:

```text
dw_reloadconfig
```

That reloads every plugin's config. To reload just one, add its name:

```text
dw_reloadconfig MyPlugin
```

If the file has a mistake in it, the plugin keeps the settings it already had.

## Run code when the config is reloaded

Override `OnConfigReloaded`. Use it to restart anything that depends on a setting.

```csharp
private IHandle? _timer;

public override void OnConfigReloaded()
{
    _timer?.Cancel();
    _timer = Timer.Every(Config.IntervalSeconds.Seconds(), RotateItems);
}
```

## Fix settings that don't make sense

Make your config class an `IConfig` and add a `Validate` method. Deadworks calls it every time the config is loaded.

```csharp
public class MyPluginConfig : IConfig
{
    public int IntervalSeconds { get; set; } = 10;
    public float DamageMultiplier { get; set; } = 1.0f;

    public void Validate()
    {
        if (IntervalSeconds < 1)
            IntervalSeconds = 10;

        DamageMultiplier = Math.Clamp(DamageMultiplier, 0f, 10f);
    }
}
```

## Use a list in your config

A setting can be a list, or another class with settings of its own.

```csharp
public class ItemSet
{
    public string Name { get; set; } = "";
    public List<string> Items { get; set; } = new();
}

public class MyPluginConfig
{
    public List<ItemSet> ItemSets { get; set; } = new()
    {
        new() { Name = "Speed Demons", Items = new() { "upgrade_sprint_booster", "upgrade_kinetic_sash" } },
    };
}
```

```jsonc
{
  "ItemSets": [
    {
      "Name": "Speed Demons",
      "Items": ["upgrade_sprint_booster", "upgrade_kinetic_sash"]
    }
  ]
}
```
## Change a setting's name in the file

By default a setting has the same name in the file as in your code. Use `[JsonPropertyName]` to give it a different one.

```csharp
using System.Text.Json.Serialization;

public class MyPluginConfig
{
    [JsonPropertyName("interval_seconds")]
    public int IntervalSeconds { get; set; } = 10;
}
```

```jsonc
{
  "interval_seconds": 10
}
```

## Reload the config from your code

```csharp
bool ok = this.ReloadConfig();
```

It returns `false`, and keeps the old settings, if the file has a mistake in it.
