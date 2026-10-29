---
title: "NPCs"
sidebar_label: "NPCs"
---

# NPCs

> **Namespace:** `DeadworksManaged.Api`

An **NPC** is a character controlled by the game's AI. Every NPC is a [`CAI_BaseNPC`](/api-reference/entities/cai_basenpc). NPCs that Deadlock spawns are also [`CAI_CitadelNPC`](/api-reference/entities/cai_citadelnpc). Lane troopers are [`CNPC_Trooper`](/api-reference/entities/cnpc_trooper).

## Finding NPCs

```csharp
var troopers = Entities.ByClass<CNPC_Trooper>()
    .Where(t => !t.IsDormant && t.Health > 0);
```

`IsDormant` is `true` for troopers the game keeps hidden for reuse. Skip them.

## Spawning

| Method | Description |
|---|---|
| `CNPC_Trooper.Create(position, team, type)` | Spawns a lane trooper, like `citadel_spawn_trooper`. The trooper joins the nearest lane. Reuses a hidden trooper if one is free. |
| `CAI_BaseNPC.Create(subclass, position, team)` | Spawns an NPC by VData subclass name. Returns null if the name is not an NPC subclass. |

```csharp
var trooper = CNPC_Trooper.Create(position, team: 3, TrooperType.Melee);
var guardian = CAI_BaseNPC.Create("npc_boss_tier1", position, team: 3);
```

:::tip
`SubclassNames` in `DeadworksManaged.Game` lists every subclass name. Its `Spawn` functions, such as `Spawn.trooper_normal`, spawn from key values instead. Troopers spawned that way have no lane.
:::

## Orders

| Method | Description |
|---|---|
| `MoveTo(position)` | Moves to the point, like `npc_go`. The NPC ignores enemies and damage until it arrives or the path fails. |
| `Stop()` | Drops the current move order. |
| `SetEnemy(entity)` | Sets the enemy. Ignored for an entity on the NPC's team. The AI can switch to a closer enemy on its next think. |
| `SetSchedule(name)` | Starts a schedule. |
| `SetState(state)` | Sets the AI state. `Idle` also clears the enemy. |

An NPC follows a moving target if `MoveTo` is called again every half second:

```csharp
Timer.Every(500.Milliseconds(), () =>
{
    foreach (var trooper in troopers)
        trooper.MoveTo(pawn.Position);
});
```

:::note
Most `MoveTo` orders over 3000 units of path fail. Shorter ones can fail partway and leave the NPC in `SCHED_FAIL`. Send long trips in legs along a [path](navigation#paths).
:::

## Schedules

A **schedule** is a routine the AI runs, such as `SCHED_IDLE_STAND`. `Schedule` is the name of the running one. When a schedule ends, the NPC picks the next.

`OnNpcSelectSchedule` runs at each pick. `e.Schedule` is the game's choice. Set `e.Override` to run another schedule instead. This keeps every trooper standing still:

```csharp
public override void OnNpcSelectSchedule(NpcSelectScheduleEvent e)
{
    if (e.Npc.As<CNPC_Trooper>() != null)
        e.Override = "SCHED_IDLE_STAND";
}
```

:::note
A schedule the NPC's class lacks runs `SCHED_IDLE_STAND` and logs `No CASE for Schedule Type`.
:::

## Minions

A **minion** fights for a hero, like Graves's skeletons. Its damage and kills count for the hero:

```csharp
trooper.SetMinion(true);
trooper.SetSummoner(pawn);
```

Minions also attack neutral creeps. They are removed with the hero's pawn, but survive the hero's death.

## See also

- [NPC demo plugin](https://github.com/Deadworks-net/deadworks/tree/main/examples/plugins/NpcDemoPlugin) – chat commands that try the NPC, navigation and bot API.
- [Navigation](navigation)
- [Bots](bots)
- [`CAI_BaseNPC`](/api-reference/entities/cai_basenpc), [`CAI_CitadelNPC`](/api-reference/entities/cai_citadelnpc), [`NpcSelectScheduleEvent`](/api-reference/events/npcselectscheduleevent)
