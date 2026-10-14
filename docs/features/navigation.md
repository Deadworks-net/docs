---
title: "Navigation"
sidebar_label: "Navigation"
---

# Navigation

> **Namespace:** `DeadworksManaged.Api`

The navmesh is the map of walkable ground the game's NPCs and bots path on. [`Nav`](/api-reference/navigation/nav) queries it directly, with no NPC needed: find paths, snap points onto the ground, test straight lines and pick random reachable spots.

## Choose a hull

A hull is the body size a query plans for. Each hull has its own navmesh areas, so a point one hull reaches may be unreachable for another.

| Hull | Used by |
|---|---|
| `0` | Heroes, including bot heroes. The default for every query. |
| `1` | Lane troopers. |

`Nav.GetHull(entity)` returns the hull an NPC or hero uses. `FindPath` and `GetNearestPoint` also take the entity itself in place of a hull.

## Find a path

```csharp
NavPath? path = Nav.FindPath(start, goal, pawn);
if (path == null)
    return; // No path, or a point is off the navmesh

foreach (var waypoint in path.Waypoints)
    Console.WriteLine($"{waypoint.Position} by {waypoint.Traverse}");
```

`Waypoints` starts at `start` and ends at the goal. `Traverse` says how each waypoint is reached: `Ground`, `Jump`, `Climb`, `Ladder` or `Link`. `Length` is the walking distance.

By default the path is simplified to its corners. Pass `simplify: false` for every navmesh area it crosses. A path holds at most `256` waypoints.

Both ends must be on the navmesh. Snap a point that might be in the air or inside a wall first:

```csharp
var goal = Nav.GetNearestPoint(target, pawn);
```

`allowPartial: true` returns a path to the reachable point closest to an unreachable goal.

:::tip
A path across the whole map takes about `1` ms. Find a path once and find a new one when the goal moves, not every tick.
:::

## Follow a path

[`NavPathFollower`](/api-reference/navigation/navpathfollower) tracks progress along a path. Call `Update` with the current position each tick. It returns the waypoint to head for, or null at the end:

```csharp
var follower = new NavPathFollower(path);

// Each tick:
Vector3? next = follower.Update(pawn.Position);
bool jump = follower.ShouldJump(pawn.Position);
```

`DistanceFromPath` is how far the walker has strayed from its route. Find a new path when it grows large. To drive a bot hero along the path, see [Bots](bots#steer-a-bot-yourself).

## Check a straight line

`Raycast` tests whether something can walk in a straight line from one point to another without leaving the navmesh:

```csharp
if (Nav.Raycast(from, to, out Vector3 stoppedAt))
{
    // Walkable all the way
}
```

When it returns `false`, `stoppedAt` is where the line left the navmesh.

## Find the ground and the area at a point

```csharp
float? groundZ = Nav.GetGroundHeight(position);
NavArea? area = Nav.GetArea(position);
```

`GetGroundHeight` returns the height of the navmesh under a point. [`NavArea`](/api-reference/navigation/navarea) describes the area there: its `Id`, `Center`, `Attributes`, `Flags` and whether it is blocked.

## Pick a random reachable point

```csharp
Vector3? spot = Nav.GetRandomPoint(pawn.Position, minDistance: 300f, maxDistance: 1200f);
```

The point is connected to the origin by navmesh, so a path reaches it. Each call takes about `1` ms. The largest distance is `6000`.

## Block an area

`CreateBlocker` cuts a box out of the navmesh. NPCs, bots and `FindPath` route around it:

```csharp
var blocker = Nav.CreateBlocker(center, halfExtents: new Vector3(200, 200, 120));

// Later, to open the area again:
blocker?.Remove();
```

The navmesh changes a moment after the blocker spawns, not during the call.

## See also

- [NPCs](npcs): send NPCs somewhere with the game's own pathfinding.
- [Bots](bots): move bot heroes along a path.
- [Tracing](tracing): lines through the world's collision, not the navmesh.
