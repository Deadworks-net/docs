---
title: "Bots"
sidebar_label: "Bots"
---

# Bots

> **Namespace:** `DeadworksManaged.Api`

A bot is a hero played by the game's AI instead of a player. Each bot hero has a brain, a hidden [NPC](npcs) that plans what it does. [`Bots`](/api-reference/navigation/bots) adds bots, turns their AI on and off and fills in their input.

## Add a bot

```csharp
var spawn = Nav.GetNearestPoint(position) ?? position;
CCitadelPlayerPawn? bot = Bots.Add(Heroes.Inferno, team: 2, spawn, BotDifficulty.Hard);
```

The bot joins as a player named `BotN`, on the team, at the position. Pass `null` as the hero for a random one. The game also assigns a lane, as it does for practice bots. Pass `assignLane: false` to skip that.

`Add` returns null when bots can't play the hero, the server is full or no map is loaded.

:::warning
A bot placed in the enemy base dies within seconds. Spawn it on its own side of the map.
:::

The hero finishes loading a moment after `Add` returns. Wait before reading its abilities.

To remove a bot, kick its player slot with [`Server.Kick`](/api-reference/plugin/server#kick).

## Turn the bot AI on

On a server without a matchmaking lobby, bots stand still: the game sends them blank input and ignores their brains. Turn their AI on to make them play:

```csharp
Bots.SetAiEnabled(true);
```

Bots then take ziplines, push their lanes and fight. This is the same switch as the `citadel_solo_bot_match` cvar. `Bots.AiEnabled` is its current value.

## Choose a bot's lane

```csharp
bot.SetBotLane(LaneColor.Blue);
```

`BotLane` is the lane the bot follows. `BotDifficulty` is the difficulty it was created with.

## Send a bot somewhere

The brain is a [`CCitadelPlayerBotNPCBrain`](/api-reference/entities/ccitadelplayerbotnpcbrain). Give it the same orders as any NPC:

```csharp
bot.BotBrain?.MoveTo(goal);
```

How the hero gets there depends on the AI:

| AI | Result |
|---|---|
| On | Heads for the goal, but the brain often drops the order for its own plans, such as taking a zipline. |
| Off | Nothing moves until you apply the brain's movement to the bot's input, as below. |

With the AI off, call `ApplyMovement` on each of the bot's usercmds. The bot then runs along the brain's path:

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

It stops about `50` units from the goal. Pass `lookAt` to keep the bot aiming at a point while it moves.

## Steer a bot yourself

With the AI off, a bot does exactly what its usercmds say. `Bots.SetMoveInput` fills one in to move the bot towards a point. Together with a [path follower](navigation#follow-a-path), it walks a bot along any path:

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

- [NPCs](npcs): orders and schedules the brain shares with every NPC.
- [Navigation](navigation): paths to give a bot.
- [`Bots`](/api-reference/navigation/bots), [`CCitadelPlayerBotNPCBrain`](/api-reference/entities/ccitadelplayerbotnpcbrain)
