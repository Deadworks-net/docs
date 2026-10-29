---
title: "NPCs"
sidebar_label: "NPCs"
---

# NPCs

> **Namespace:** `DeadworksManaged.Api`

An NPC is a character run by the game's AI: lane troopers, neutral creeps, bosses, guardians, walkers, the Patron and hero summons. Every NPC is a [`CAI_BaseNPC`](/api-reference/entities/cai_basenpc); those Deadlock spawns are also [`CAI_CitadelNPC`](/api-reference/entities/cai_citadelnpc). Lane troopers are [`CNPC_Trooper`](/api-reference/entities/cnpc_trooper).

## Finding NPCs

```csharp
var troopers = Entities.ByClass<CNPC_Trooper>()
    .Where(t => !t.IsDormant && t.Health > 0);
```

`IsDormant` is `true` for troopers the game hides in a pool for reuse. Skip them.

## Spawning

`CNPC_Trooper.Create` spawns a lane trooper, like `citadel_spawn_trooper`. The trooper drops to the ground and joins the nearest lane. A free pooled trooper is reused if there is one:

```csharp
var trooper = CNPC_Trooper.Create(position, team: 3, TrooperType.Melee);
```

`CAI_BaseNPC.Create` spawns any NPC by VData subclass name. It returns null for anything else, such as the class name `npc_trooper_neutral`:

```csharp
var creep = CAI_BaseNPC.Create("neutral_trooper_strong", position);
var guardian = CAI_BaseNPC.Create("npc_boss_tier1", position, team: 3);
```

`SubclassNames` in `DeadworksManaged.Game` lists the names. That assembly also has a `Spawn` function per subclass, such as `Spawn.trooper_normal`, which takes spawn key values. Troopers spawned that way get no lane (`Lane` is 0).

:::warning
A trooper placed near the enemy base dies within seconds.
:::

## Orders

These work on any NPC:

| Method | Effect |
|---|---|
| `MoveTo(position)` | Walks to the point, like `npc_go`. Ignores enemies and damage until it arrives or the path fails, then resumes its own AI. |
| `Stop()` | Drops the current move order. |
| `SetEnemy(entity)` | Sets the enemy. The AI re-picks its enemy every think and may switch to a closer one. An enemy on the NPC's own team is dropped. |
| `SetSchedule(name)` | Starts a schedule. Runs until it finishes or is interrupted. |

To follow a moving target, order again every half second:

```csharp
Timer.Every(500.Milliseconds(), () =>
{
    foreach (var trooper in troopers)
        trooper.MoveTo(pawn.Position);
});
```

:::note
Orders to a point more than 3000 units of path away mostly fail. Nearer ones can stop partway, leaving the NPC in `SCHED_FAIL`. Send long trips in legs along a [path](navigation#paths) and re-order after a failure.
:::

## Schedules

A schedule is an AI routine, such as `SCHED_IDLE_STAND` or `SCHED_TROOPER_RUN_DOWN_LANE`. `Schedule` returns the running one.

```csharp
trooper.SetSchedule("SCHED_IDLE_STAND");
```

Override `OnNpcSelectSchedule` to replace the game's pick. `e.Schedule` is what the game chose; leave `e.Override` null to keep it. To keep every trooper where it stands:

```csharp
public override void OnNpcSelectSchedule(NpcSelectScheduleEvent e)
{
    if (e.Npc.As<CNPC_Trooper>() != null)
        e.Override = "SCHED_IDLE_STAND";
}
```

:::note
A schedule the NPC's class lacks runs `SCHED_IDLE_STAND` instead and logs "No CASE for Schedule Type".
:::

## Minions

A minion works for a hero, like Necro's skeletons. Its damage and kills count for the hero, and it attacks neutral creeps:

```csharp
trooper.SetMinion(true);
trooper.SetSummoner(pawn);
```

Minions are removed with the hero's pawn, such as on a hero swap. They survive the hero's death.

## See also

- [NPC demo plugin](https://github.com/Deadworks-net/deadworks/tree/main/examples/plugins/NpcDemoPlugin): chat commands that try the NPC, navigation and bot API in game.
- [Navigation](navigation)
- [Bots](bots)
- [`CAI_BaseNPC`](/api-reference/entities/cai_basenpc), [`CAI_CitadelNPC`](/api-reference/entities/cai_citadelnpc), [`NpcSelectScheduleEvent`](/api-reference/events/npcselectscheduleevent)
