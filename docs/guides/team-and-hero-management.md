---
title: "Team & Hero Management"
sidebar_label: "Team & Hero Management"
---

# Team & Hero Management Guide

This guide covers team balancing, hero selection, and player management patterns.

## Team Assignment

### Auto-Balance on Connect

Assign players to the team with fewer members:

```csharp
public override HookResult OnClientFullConnect(ClientFullConnectEvent ev)
{
    var controller = Players.FromSlot(ev.Slot);
    if (controller == null) return HookResult.Handled;

    // Count players per team
    int team0 = 0, team1 = 0;
    foreach (var c in Players.GetAll())
    {
        var pawn = c.GetHeroPawn();
        if (pawn == null) continue;
        if (pawn.TeamNum == 2) team0++;
        else if (pawn.TeamNum == 3) team1++;
    }

    // Assign to smaller team
    controller.ChangeTeam(team0 <= team1 ? 2 : 3);

    return HookResult.Handled;
}
```

### Changing Teams

```csharp
controller.ChangeTeam(2);  // Team 0 (Amber)
controller.ChangeTeam(3);  // Team 1 (Sapphire)
```

## Hero Selection

### Force a Specific Hero

```csharp
controller.SelectHero(Heroes.Inferno);
```

### Random Hero Assignment

```csharp
var heroes = Enum.GetValues<Heroes>();
var randomHero = heroes[Random.Shared.Next(heroes.Length)];
controller.SelectHero(randomHero);
```

### Prevent Hero Changes

Block hero changes outside spawn zones using `OnClientConCommand`:

```csharp
public override HookResult OnClientConCommand(ClientConCommandEvent ev)
{
    if (ev.CommandName == "citadel_hero_pick")
    {
        var pawn = ev.Controller?.GetHeroPawn();
        if (pawn != null && !IsInSpawnZone(pawn))
        {
            ev.Controller.PrintToConsole("Hero changes only in spawn!");
            return HookResult.Stop;
        }
    }
    return HookResult.Handled;
}
```

### Hero Precaching

When swapping heroes at runtime, precache them first:

```csharp
public override void OnPrecacheResources()
{
    Precache.AddAllHeroes();  // Required for dynamic hero selection
}
```

## Hero Reset

Reset a hero's loadout, items, abilities, and level:

```csharp
pawn.ResetHero(resetLevel: true);
```

### Custom Reset with Currency

```csharp
[GameEventHandler("player_hero_changed")]
public HookResult OnHeroChanged(GameEvent ev)
{
    var pawn = ev.GetPlayerPawn("player") as CCitadelPlayerPawn;
    if (pawn == null) return HookResult.Handled;

    // Give starting resources
    pawn.ModifyCurrency(ECurrencyType.Gold, 15000, ECurrencySource.FlagCapture, false, false, false);
    pawn.ModifyCurrency(ECurrencyType.AbilityPoints, 17, ECurrencySource.FlagCapture, false, false, false);

    return HookResult.Handled;
}
```

## Player Tracking

### Active Player Set

```csharp
private readonly Dictionary<int, string> _playerSets = new();

public override HookResult OnClientFullConnect(ClientFullConnectEvent ev)
{
    _playerSets[ev.Slot] = "default";
    return HookResult.Handled;
}

public override HookResult OnClientDisconnect(ClientDisconnectedEvent ev)
{
    _playerSets.Remove(ev.Slot);
    return HookResult.Handled;
}
```

### Iterating Connected Players

```csharp
foreach (var controller in Players.GetAll())
{
    var pawn = controller.GetHeroPawn();
    if (pawn == null) continue;

    // Do something with each active player
    pawn.EmitSound("Mystical.Piano.AOE.Warning");
}
```

### Player Cleanup on Disconnect

```csharp
public override HookResult OnClientDisconnect(ClientDisconnectedEvent ev)
{
    // Clean up the disconnected player's pawn
    var controller = Players.FromSlot(ev.Slot);
    var pawn = controller?.GetHeroPawn();
    pawn?.Remove();

    return HookResult.Handled;
}
```

## Friendly Fire Toggle

```csharp
private bool _friendlyFire = false;

[ChatCommand("ff")]
public HookResult OnFriendlyFire(ChatCommandContext ctx)
{
    _friendlyFire = !_friendlyFire;

    foreach (var pawn in Players.GetAllPawns())
    {
        // Set friendly fire state on all players
        // Implementation depends on modifier states
    }

    // Announce to all
    var msg = new CCitadelUserMsg_HudGameAnnouncement
    {
        TitleLocstring = "FRIENDLY FIRE",
        DescriptionLocstring = _friendlyFire ? "ENABLED" : "DISABLED"
    };
    NetMessages.Send(msg, RecipientFilter.All);

    return HookResult.Handled;
}
```

## Game Mode Setup Pattern

Configure server convars for custom game modes in `OnStartupServer`:

```csharp
public override void OnStartupServer()
{
    // Deathmatch configuration
    ConVar.Find("citadel_active_lane")?.SetInt(4);
    ConVar.Find("citadel_player_spawn_time_max_respawn_time")?.SetInt(5);
    ConVar.Find("citadel_allow_purchasing_anywhere")?.SetInt(1);
    ConVar.Find("citadel_item_sell_price_ratio")?.SetFloat(1.0f);
    ConVar.Find("citadel_voice_all_talk")?.SetInt(1);
    ConVar.Find("citadel_player_starting_gold")?.SetInt(0);
    ConVar.Find("citadel_trooper_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_npc_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_start_players_on_zipline")?.SetInt(0);
    ConVar.Find("citadel_allow_duplicate_heroes")?.SetInt(1);
}
```

## See Also

- [Players API](../api-reference/players) — Controller and pawn reference
- [Heroes API](../api-reference/heroes) — Hero enum and data
- [Console Commands](../api-reference/console-commands) — ConVar manipulation
- [Deathmatch Example](../examples/deathmatch) — Full game mode implementation
