---
title: "Bots"
sidebar_label: "Bots"
---

# Bots

> **Namespace:** `DeadworksManaged.Api`

A **bot** is a hero played by the game's AI. Each bot has a **brain**, a hidden [NPC](npcs) that plans its moves. [`Bots`](/api-reference/navigation/bots) adds bots and controls their AI.

## Adding a bot

```csharp
var spawn = Nav.GetNearestPoint(position) ?? position;
CCitadelPlayerPawn? bot = Bots.Add(Heroes.Inferno, team: 2, spawn, BotDifficulty.Hard);
```

`Add` returns the bot's pawn, or null if bots can't play the hero, the server is full or no map is loaded. The bot joins as a player named `BotN`. A `null` hero picks a random one. `assignLane: false` skips the game's lane assignment. To remove a bot, kick it with [`Server.Kick`](/api-reference/plugin/server#kick).

:::note
The hero finishes loading shortly after `Add` returns. Wait before reading its abilities.
:::

## Bot AI

Without a matchmaking lobby, bots stand still. `SetAiEnabled` turns their AI on:

```csharp
Bots.SetAiEnabled(true);
```

`Bots.AiEnabled` reads the setting, which is the `citadel_solo_bot_match` cvar.

## Lanes and difficulty

| Member | Description |
|---|---|
| `SetBotLane(lane)` | Sets the lane the bot pushes. |
| `BotLane` | Lane the bot pushes. |
| `BotDifficulty` | Difficulty the bot was created with. |

```csharp
bot.SetBotLane(LaneColor.Blue);
```

## Moving a bot

`BotBrain` is a [`CCitadelPlayerBotNPCBrain`](/api-reference/entities/ccitadelplayerbotnpcbrain). It takes the same orders as any NPC:

```csharp
bot.BotBrain?.MoveTo(goal);
```

With the AI on, the brain can drop the order for its own plans. With the AI off, `ApplyMovement` turns the brain's path into the bot's input:

```csharp
public override void OnProcessUsercmds(ProcessUsercmdsEvent e)
{
    var brain = e.Controller?.GetHeroPawn()?.BotBrain;
    if (brain == null)
        return;

    foreach (var cmd in e.Usercmds)
        brain.ApplyMovement(cmd);
}
```

The bot stops about `50` units from the goal. `lookAt` aims it at a point while it moves.

:::note
`ApplyMovement` returns `false` when the brain has nowhere to go, and for the first usercmd after `MoveTo`. Only a run of `false` results means the bot has arrived.
:::

## Steering a bot

With the AI off, a bot follows its usercmds exactly. `Bots.SetMoveInput` fills one in to move towards a point. With a [path follower](navigation#following-a-path) the bot walks any path:

```csharp
NavPathFollower? follower; // Set from Nav.FindPath when the bot gets a goal

public override void OnProcessUsercmds(ProcessUsercmdsEvent e)
{
    var pawn = e.Controller?.GetHeroPawn();
    if (pawn == null || follower == null)
        return;

    Vector3? next = follower.Update(pawn.Position);
    if (next == null)
        return; // Arrived

    bool jump = follower.ShouldJump(pawn.Position);
    foreach (var cmd in e.Usercmds)
        Bots.SetMoveInput(cmd, pawn, next.Value, jump: jump);
}
```

:::note
`OnProcessUsercmds` runs for every player, humans included. Check the slot before changing a usercmd.
:::

## See also

- [NPCs](npcs)
- [Navigation](navigation)
- [`Bots`](/api-reference/navigation/bots), [`CCitadelPlayerBotNPCBrain`](/api-reference/entities/ccitadelplayerbotnpcbrain)
