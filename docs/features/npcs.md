---
title: "NPCs"
sidebar_label: "NPCs"
---

# NPCs

> **Namespace:** `DeadworksManaged.Api`

An NPC is a character controlled by the game's AI: lane troopers, neutral creeps, bosses, guardians, walkers, the Patron and hero summons. Every NPC is a [`CAI_BaseNPC`](/api-reference/entities/cai_basenpc); every NPC Deadlock spawns is also a [`CAI_CitadelNPC`](/api-reference/entities/cai_citadelnpc). Lane troopers are [`CNPC_Trooper`](/api-reference/entities/cnpc_trooper).

## Finding NPCs

```csharp
var troopers = Entities.ByClass<CNPC_Trooper>()
    .Where(t => !t.IsDormant && t.Health > 0);
```

`IsDormant` is `true` for the hidden troopers the game keeps in a pool for reuse. Skip them.

## Spawning

`CNPC_Trooper.Create` spawns a lane trooper, as `citadel_spawn_trooper` does. The trooper drops to the ground, joins the nearest lane and walks it. A free pooled trooper is reused if there is one.

```csharp
var trooper = CNPC_Trooper.Create(position, team: 3, TrooperType.Melee);
```

`CAI_BaseNPC.Create` spawns any other NPC by its VData subclass name. It returns null for a name that is not an NPC subclass, such as the class name `npc_trooper_neutral`.

```csharp
var creep = CAI_BaseNPC.Create("neutral_trooper_strong", position);
var guardian = CAI_BaseNPC.Create("npc_boss_tier1", position, team: 3);
```

`SubclassNames` in `DeadworksManaged.Game` lists every subclass name. That assembly also has a `Spawn` function per subclass, such as `Spawn.trooper_normal`, which takes spawn key values. A trooper spawned that way has no lane (`Lane` is 0).

:::warning
A trooper placed near the enemy base dies within seconds.
:::

## Orders

These work on any NPC:

| Method | Effect |
|---|---|
| `MoveTo(position)` | Walks to the point with the game's pathfinding, like `npc_go`. Ignores enemies and damage until it arrives or the path fails, then resumes what it was doing. |
| `Stop()` | Drops the current move. The NPC picks a new action on its next think. |
| `SetEnemy(entity)` | Sets the enemy. The AI re-chooses its enemy every think and may switch to a closer one. It never keeps an enemy on its own team. |
| `SetSchedule(name)` | Starts a schedule. It runs until it finishes or is interrupted. |

To follow a moving target, call `MoveTo` again every half second:

```csharp
Timer.Every(500.Milliseconds(), () =>
{
    foreach (var trooper in troopers)
        trooper.MoveTo(pawn.Position);
});
```

:::note
`MoveTo` often fails for distant goals: most orders to a point more than 3000 units of path away fail. Nearer orders can fail partway, leaving the NPC standing in `SCHED_FAIL`. Order a long trip in legs along a [path](navigation#paths), and order again after a failure.
:::

## Schedules

A schedule is one of the AI's routines, such as `SCHED_IDLE_STAND` or `SCHED_TROOPER_RUN_DOWN_LANE`. `Schedule` is the one running.

```csharp
trooper.SetSchedule("SCHED_IDLE_STAND");
```

Override `OnNpcSelectSchedule` to replace the schedule the game picks. `e.Schedule` is the game's choice; leave `e.Override` null to keep it. This keeps every trooper where it stands:

```csharp
public override void OnNpcSelectSchedule(NpcSelectScheduleEvent e)
{
    if (e.Npc.As<CNPC_Trooper>() != null)
        e.Override = "SCHED_IDLE_STAND";
}
```

:::note
A schedule the NPC's class does not have runs `SCHED_IDLE_STAND` instead and logs "No CASE for Schedule Type".
:::

## Minions

A minion works for a hero, like Necro's skeletons. Its damage and kills count for the hero, and it also attacks neutral creeps.

```csharp
trooper.SetMinion(true);
trooper.SetSummoner(pawn);
```

Minions are removed with the hero's pawn, for example on a hero swap. They survive the hero's death.

## See also

- [NPC demo plugin](https://github.com/Deadworks-net/deadworks/tree/main/examples/plugins/NpcDemoPlugin): chat commands that try the NPC, navigation and bot API in game.
- [Navigation](navigation)
- [Bots](bots)
- [`CAI_BaseNPC`](/api-reference/entities/cai_basenpc), [`CAI_CitadelNPC`](/api-reference/entities/cai_citadelnpc), [`NpcSelectScheduleEvent`](/api-reference/events/npcselectscheduleevent)
