---
title: "Deathmatch"
sidebar_label: "Deathmatch"
---

# Example: Deathmatch Plugin

**Source:** `DeathmatchPlugin.cs`

A comprehensive game mode plugin with spawn control, chat rebroadcasting, team balancing, and numerous debug/admin commands.

## Overview

- **Game Mode Setup:** Configures convars for deathmatch (no troopers, fast respawn, all-talk)
- **Team Balancing:** Auto-assigns teams on connect with random hero selection
- **Currency Control:** Strips natural income, re-issues custom amounts
- **Chat System:** Rebroadcasts chat messages with sender names (workaround for portrait limit)
- **Admin Commands:** `/ff`, `/airjump`, `/stamina`, `/modifier`, `/ent_create`, `/swap`, `/trace`, etc.

## Server Configuration

Uses `OnStartupServer()` to set game convars:

```csharp
public override void OnStartupServer()
{
    ConVar.Find("citadel_active_lane")?.SetInt(4);
    ConVar.Find("citadel_player_spawn_time_max_respawn_time")?.SetInt(5);
    ConVar.Find("citadel_allow_purchasing_anywhere")?.SetInt(1);
    ConVar.Find("citadel_trooper_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_npc_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_allow_duplicate_heroes")?.SetInt(1);
    ConVar.Find("citadel_voice_all_talk")?.SetInt(1);
    ConVar.Find("citadel_player_starting_gold")?.SetInt(0);
    // ...more convars
}
```

## Chat Rebroadcasting

Hooks outgoing chat messages to add sender names — works around Deadlock's 12-slot portrait limit:

```csharp
[NetMessageHandler]
public HookResult OnChatMsgOutgoing(OutgoingMessageContext<CCitadelUserMsg_ChatMsg> ctx)
{
    if (_rebroadcasting) return HookResult.Continue;  // Reentrancy guard

    var senderSlot = ctx.Message.PlayerSlot;
    if (senderSlot < 0) return HookResult.Continue;   // System messages pass through

    var senderName = _playerNames.GetValueOrDefault(senderSlot, $"Player {senderSlot}");
    var originalMask = ctx.Recipients.Mask;

    _rebroadcasting = true;
    try
    {
        for (int slot = 0; slot < 64; slot++)
        {
            if ((originalMask & (1UL << slot)) == 0) continue;

            var msg = new CCitadelUserMsg_ChatMsg
            {
                PlayerSlot = slot,  // Show as recipient's own portrait
                Text = slot == senderSlot ? ctx.Message.Text : $"[{senderName}]: {ctx.Message.Text}",
                AllChat = ctx.Message.AllChat,
                LaneColor = ctx.Message.LaneColor
            };
            NetMessages.Send(msg, RecipientFilter.Single(slot));
        }
    }
    finally { _rebroadcasting = false; }

    return HookResult.Stop;  // Suppress original broadcast
}
```

**Key Pattern:** The `_rebroadcasting` flag prevents infinite recursion since `NetMessages.Send` triggers the hook again.

## Team Balancing

Auto-assigns players to the smaller team with a random available hero:

```csharp
public override void OnClientFullConnect(ClientFullConnectEvent args)
{
    var controller = args.Controller;
    if (controller == null) return;

    // Count team sizes
    int team2 = 0, team3 = 0;
    for (int i = 0; i < 64; i++)
    {
        var ent = CBaseEntity.FromIndex(i + 1);
        if (ent?.TeamNum == 2) team2++;
        else if (ent?.TeamNum == 3) team3++;
    }

    int team = team2 <= team3 ? 2 : 3;
    controller.ChangeTeam(team);

    // Random hero from available heroes
    var heroes = Enum.GetValues<Heroes>()
        .Where(h => h.GetHeroData()?.AvailableInGame == true)
        .ToArray();
    controller.SelectHero(heroes[Random.Shared.Next(heroes.Length)]);
}
```

## Currency Control

Blocks natural income and re-issues custom starting amounts:

```csharp
public override HookResult OnModifyCurrency(ModifyCurrencyEvent args)
{
    if (args.CurrencyType == ECurrencyType.EGold)
    {
        if (args.Source == ECurrencySource.EStartingAmount)
        {
            // Re-issue as custom amount
            args.Pawn.ModifyCurrency(ECurrencyType.EGold, 15_000, ECurrencySource.ECheats);
            args.Pawn.ModifyCurrency(ECurrencyType.EAbilityPoints, 17, ECurrencySource.ECheats);
            return HookResult.Stop;
        }
        // Block everything except purchases
        if (args.Source != ECurrencySource.ECheats &&
            args.Source != ECurrencySource.EItemPurchase &&
            args.Source != ECurrencySource.EItemSale)
            return HookResult.Stop;
    }
    return HookResult.Continue;
}
```

## Spawn Protection

Prevents hero changes outside spawn via `OnClientConCommand`:

```csharp
public override HookResult OnClientConCommand(ClientConCommandEvent e)
{
    if (e.Command == "selecthero")
    {
        var pawn = e.Controller?.GetHeroPawn()?.As<CCitadelPlayerPawn>();
        if (pawn != null && !pawn.InRegenerationZone && pawn.Health > 0)
        {
            // Send error message, block the command
            return HookResult.Stop;
        }
    }
    return HookResult.Continue;
}
```

## Notable Commands

### Self-Kill (ConCommand)

```csharp
[ConCommand("dw_killme", Description = "Kill yourself", ServerOnly = false)]
public void CmdKillMe(ConCommandContext ctx)
{
    var pawn = ctx.Controller?.GetHeroPawn();
    if (pawn == null) return;

    using var info = new CTakeDamageInfo(pawn.PlayerData!.HealthMax * 10, attacker: pawn, inflictor: pawn);
    info.DamageFlags |= (TakeDamageFlags.ForceDeath | TakeDamageFlags.AllowSuicide);
    pawn.TakeDamage(info);
}
```

### Friendly Fire Toggle

```csharp
[ChatCommand("ff")]
public HookResult CmdFriendlyFire(ChatCommandContext ctx)
{
    if (_ffTimer != null)
    {
        _ffTimer.Cancel();
        _ffTimer = null;
        foreach (var pawn in Players.GetAllPawns())
            pawn.ModifierProp?.SetModifierState(EModifierState.FriendlyFireEnabled, false);
        return HookResult.Handled;
    }

    // Re-apply every tick since modifier recomputation can clear bits
    _ffTimer = Timer.Every(1.Ticks(), () =>
    {
        foreach (var pawn in Players.GetAllPawns())
            pawn.ModifierProp?.SetModifierState(EModifierState.FriendlyFireEnabled, true);
    });
    return HookResult.Handled;
}
```

### Ray Trace Debug

Full trace implementation from player eye position — see [Tracing](../api-reference/tracing).

### Screen Text Toggle

```csharp
[ChatCommand("worldtext")]
public HookResult CmdWorldText(ChatCommandContext ctx)
{
    if (_screenText is { IsValid: true })
    {
        _screenText.Destroy();
        _screenText = null;
        return HookResult.Handled;
    }
    _screenText = ScreenText.Create(ctx.Controller, "HELLO WORLD", posX: 0.5f, posY: 0.5f, fontSize: 200);
    return HookResult.Handled;
}
```

## API Features Used

| Feature | Reference |
|---------|-----------|
| `OnStartupServer`, `ConVar.Find` | [Console Commands](../api-reference/console-commands) |
| `[NetMessageHandler]` | [Networking](../api-reference/networking) |
| `OnClientFullConnect`, `OnClientDisconnect` | [Plugin Base](../api-reference/plugin-base) |
| `OnTakeDamage` | [Damage](../api-reference/damage) |
| `OnModifyCurrency` | [Damage](../api-reference/damage) |
| `OnClientConCommand` | [Plugin Base](../api-reference/plugin-base) |
| `[ConCommand]` | [Console Commands](../api-reference/console-commands) |
| `CTakeDamageInfo`, `TakeDamageFlags` | [Damage](../api-reference/damage) |
| `EModifierState`, `ModifierProp` | [Modifiers](../api-reference/modifiers) |
| `[GameEventHandler]` | [Game Events](../api-reference/game-events) |
| `Heroes`, `GetHeroData`, `SelectHero` | [Heroes](../api-reference/heroes) |
| `ScreenText`, `CPointWorldText` | [World Text](../api-reference/world-text) |
| `Trace.TraceShape`, `CGameTrace` | [Tracing](../api-reference/tracing) |
| `CBaseEntity.CreateByName` | [Entities](../api-reference/entities) |
