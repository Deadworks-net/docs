---
title: "Item Rotation"
sidebar_label: "Item Rotation"
---

# Example: Item Rotation Plugin

**Source:** `ItemRotation.cs`

A config-driven plugin that rotates item sets between players on a timer.

## Overview

- **Commands:** `/ir_start`, `/ir_swap`, `/ir_reset`, `/ir_sets`
- **Features:** JSON config, sequential/random modes, duplicate prevention, HUD announcements
- **Concepts demonstrated:** Configuration system, player tracking, timed game logic, chat messaging

## Architecture

```
/ir_start
    │
    ├── Validate players & item sets
    ├── Assign initial sets (sequential or random)
    ├── Apply items to all players
    └── Start swap timer
        │
        └── Every N seconds:
            ├── Rotate set assignments
            ├── Remove old items
            ├── Give new items
            ├── Play sound
            └── Show announcement
```

## Configuration

Uses `IPluginConfig<T>` with `BasePluginConfig` for JSON-serialized settings:

```csharp
public class ItemRotationConfig : BasePluginConfig
{
    [JsonPropertyName("SwapIntervalSeconds")]
    public int SwapIntervalSeconds { get; set; } = 10;

    [JsonPropertyName("SelectionMode")]
    public string SelectionMode { get; set; } = "sequential";

    [JsonPropertyName("AllowDuplicateSets")]
    public bool AllowDuplicateSets { get; set; } = true;

    [JsonPropertyName("ItemSets")]
    public List<ItemSet> ItemSets { get; set; } = new()
    {
        new() { Name = "Speed Demons", Items = new() { "upgrade_sprint_booster", "upgrade_kinetic_sash" } },
        new() { Name = "Cardio Kings", Items = new() { "upgrade_fleetfoot_boots", "upgrade_cardio_calibrator" } },
        // ...more sets
    };
}
```

### Config Validation

```csharp
public void OnConfigParsed(ItemRotationConfig config)
{
    if (config.SwapIntervalSeconds < 1) config.SwapIntervalSeconds = 1;
    Config = config;
}
```

## Player Tracking

Tracks active players by slot index:

```csharp
private readonly Dictionary<int, int> _playerSetIndex = new(); // slot -> set index
private readonly HashSet<int> _activePlayers = new();

// On disconnect, clean up
public override void OnClientDisconnect(ClientDisconnectedEvent args)
{
    _activePlayers.Remove(args.Slot);
    _playerSetIndex.Remove(args.Slot);
}
```

## Chat Messaging Helpers

Reusable helpers for sending targeted messages:

```csharp
private static void SendChat(int slot, string text)
{
    var msg = new CCitadelUserMsg_ChatMsg
    {
        PlayerSlot = -1,
        Text = text,
        AllChat = true
    };
    NetMessages.Send(msg, RecipientFilter.Single(slot));
}

private static void SendChatAll(string text)
{
    var msg = new CCitadelUserMsg_ChatMsg
    {
        PlayerSlot = -1,
        Text = text,
        AllChat = true
    };
    NetMessages.Send(msg, RecipientFilter.All);
}
```

## Key Patterns

### Sequential vs Random Assignment

```csharp
if (Config.SelectionMode == "random")
    AssignRandomSets(players);
else
{
    // Sequential: each player gets the next set
    for (int i = 0; i < players.Count; i++)
        _playerSetIndex[players[i]] = i % Config.ItemSets.Count;
}
```

### Duplicate Prevention

When `AllowDuplicateSets` is false, validates at startup:

```csharp
if (!Config.AllowDuplicateSets && players.Count > Config.ItemSets.Count)
{
    SendChat(slot, "Not enough item sets for all players!");
    return HookResult.Handled;
}
```

### Item Application with Old/New Swap

```csharp
// Remove old items
if (previousSets.TryGetValue(slot, out int oldIndex))
    foreach (var item in Config.ItemSets[oldIndex].Items)
        pawn.RemoveItem(item);

// Give new items
foreach (var item in Config.ItemSets[setIndex].Items)
    pawn.AddItem(item);
```

## API Features Used

| Feature | Reference |
|---------|-----------|
| `IPluginConfig<T>` | [Configuration](../api-reference/configuration) |
| `[ChatCommand]` | [Chat Commands](../api-reference/chat-commands) |
| `Timer.Every` | [Timers](../api-reference/timers) |
| `NetMessages.Send`, `RecipientFilter` | [Networking](../api-reference/networking) |
| `Players.FromSlot`, `Players.MaxSlots` | [Players](../api-reference/players) |
| `CCitadelUserMsg_HudGameAnnouncement` | [Networking](../api-reference/networking) |
| `OnClientDisconnect` | [Plugin Base](../api-reference/plugin-base) |
