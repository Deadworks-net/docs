---
title: "NPCs"
sidebar_label: "NPCs"
---

# NPCs

> **Namespace:** `DeadworksManaged.Api`

An NPC is a character the game's AI controls: lane troopers, neutral creeps, bosses, guardians, walkers, the Patron and hero summons. Every NPC is a [`CAI_BaseNPC`](/api-reference/entities/cai_basenpc), and every NPC Deadlock spawns is also a [`CAI_CitadelNPC`](/api-reference/entities/cai_citadelnpc).

## Find NPCs

Lane troopers are [`CNPC_Trooper`](/api-reference/entities/cnpc_trooper):

```csharp
var troopers = Entities.ByClass<CNPC_Trooper>()
    .Where(t => !t.IsDormant && t.Health > 0);
```

The game keeps a pool of hidden troopers to reuse as new spawns. `IsDormant` is `true` for those. Skip them when giving orders.

## Send an NPC somewhere

`MoveTo` sends the NPC to a point with the game's own pathfinding, like the `npc_go` console command:

```csharp
trooper.MoveTo(pawn.Position);
```

The NPC ignores enemies and damage until it arrives or its path fails. Then it goes back to what it was doing, so a lane trooper walks back to its lane.

To make an NPC follow a moving target, call `MoveTo` again every half second:

```csharp
Timer.Every(500.Milliseconds(), () =>
{
    foreach (var trooper in troopers)
        trooper.MoveTo(pawn.Position);
});
```

`Stop()` drops the current move. The NPC picks something new to do on its next think.

## Make an NPC fight something

```csharp
trooper.SetEnemy(targetPawn);
```

The AI chooses its own enemy every time it thinks, so it can switch to a closer target straight away. It never keeps an enemy on its own team.

## Run a schedule

A schedule is one of the AI's routines, such as `SCHED_IDLE_STAND` or `SCHED_TROOPER_RUN_DOWN_LANE`. `Schedule` is the one running now. `SetSchedule` starts another:

```csharp
trooper.SetSchedule("SCHED_IDLE_STAND");
```

The schedule runs until it finishes or something interrupts it, such as a new enemy. Then the NPC chooses its next schedule as usual.

## Change what NPCs choose to do

Override `OnNpcSelectSchedule` to replace the schedule the game picks. This keeps every trooper where it stands:

```csharp
public override void OnNpcSelectSchedule(NpcSelectScheduleEvent e)
{
    if (e.Npc.As<CNPC_Trooper>() != null)
        e.Override = "SCHED_IDLE_STAND";
}
```

`e.Schedule` is what the game chose. Leave `e.Override` null to keep it.

:::note
A schedule name the NPC's class doesn't have runs `SCHED_IDLE_STAND` instead, and the game logs "No CASE for Schedule Type".
:::

## Make an NPC a player's minion

A minion works for a hero, like Necro's skeletons. Its damage and kills count for the hero, and it also attacks neutral creeps.

```csharp
trooper.SetMinion(true);
trooper.SetSummoner(pawn);
```

When the hero's pawn is removed, for example on a hero swap, the game removes its minions too. They stay alive when the hero dies.

## See also

- [Navigation](navigation): paths and navmesh queries without an NPC.
- [Bots](bots): bot heroes, whose AI is an NPC called the brain.
- [`CAI_BaseNPC`](/api-reference/entities/cai_basenpc), [`CAI_CitadelNPC`](/api-reference/entities/cai_citadelnpc), [`NpcSelectScheduleEvent`](/api-reference/events/npcselectscheduleevent)
