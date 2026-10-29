---
title: "Bots"
sidebar_label: "Bots"
---

# Bots

> **Namespace:** `DeadworksManaged.Api`

A bot is a hero played by the game's AI. Its brain, a hidden [NPC](npcs), plans what it does. [`Bots`](/api-reference/navigation/bots) adds bots, toggles their AI and fills in their input.

## Adding a bot

```csharp
var spawn = Nav.GetNearestPoint(position) ?? position;
CCitadelPlayerPawn? bot = Bots.Add(Heroes.Inferno, team: 2, spawn, BotDifficulty.Hard);
```

The bot joins as a player named `BotN`. A `null` hero picks one at random. The game assigns a lane, as for practice bots, unless you pass `assignLane: false`. The hero finishes loading shortly after `Add` returns; wait before reading its abilities.

`Add` returns null if bots can't play the hero, the server is full or no map is loaded. To remove a bot, kick it with [`Server.Kick`](/api-reference/plugin/server#kick).

:::warning
A bot placed in the enemy base dies within seconds.
:::

## Bot AI

Without a matchmaking lobby, bots stand still. Turn the AI on to make them play:

```csharp
Bots.SetAiEnabled(true);
```

Bots then push lanes, take ziplines and fight. This is the `citadel_solo_bot_match` cvar; `Bots.AiEnabled` reads it.

## Lanes and difficulty

```csharp
bot.SetBotLane(LaneColor.Blue);
```

`BotLane` is the lane the bot pushes. `BotDifficulty` is the difficulty it was created with.

## Moving a bot

The brain is a [`CCitadelPlayerBotNPCBrain`](/api-reference/entities/ccitadelplayerbotnpcbrain) and takes the same orders as any NPC:

```csharp
bot.BotBrain?.MoveTo(goal);
```

With the AI on, the brain often drops the order for its own plans, such as a zipline. With the AI off, nothing moves until the brain's movement goes into the bot's usercmds:

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

The bot stops about `50` units from the goal. `lookAt` keeps it aiming at a point on the way.

:::note
`ApplyMovement` returns `false` when the brain has nowhere to go, and also for the first usercmd after `MoveTo`. Treat only a run of `false` results as arrival.
:::

## Steering a bot

With the AI off, a bot does exactly what its usercmds say. `Bots.SetMoveInput` fills one in to move towards a point; with a [path follower](navigation#following-a-path) the bot walks any path:

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
