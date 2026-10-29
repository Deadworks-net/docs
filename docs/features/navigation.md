---
title: "Navigation"
sidebar_label: "Navigation"
---

# Navigation

> **Namespace:** `DeadworksManaged.Api`

The navmesh is the walkable surface NPCs and bots path over. [`Nav`](/api-reference/navigation/nav) queries it without an NPC.

## Hulls

A hull is a body size. Each hull has its own navmesh areas, so a point one hull can reach may be out of reach for another.

| Hull | Used by |
|---|---|
| `0` | Heroes, including bot heroes. Default for every query. |
| `1` | Lane troopers. |

`Nav.GetHull(entity)` returns an NPC's or hero's hull. `FindPath` and `GetNearestPoint` also take the entity in place of a hull.

## Paths

`FindPath` returns a [`NavPath`](/api-reference/navigation/navpath), or null if there is no path or an end is off the navmesh:

```csharp
NavPath? path = Nav.FindPath(start, goal, pawn);
if (path == null)
    return;

foreach (var waypoint in path.Waypoints)
    Console.WriteLine($"{waypoint.Position} by {waypoint.Traverse}");
```

- `Waypoints` runs from `start` to the goal, up to `256` points. `Traverse` says how each is reached: `Ground`, `Jump`, `Climb`, `Ladder` or `Link`.
- `Length` is the walking distance.
- `simplify: false` adds a waypoint per area crossed, not only the corners.
- `allowPartial: true` returns a path to the reachable point nearest an unreachable goal.

Snap an end in the air or inside a wall onto the navmesh first:

```csharp
var goal = Nav.GetNearestPoint(target, pawn);
```

:::tip
A path across the whole map takes about `1` ms. Re-path when the goal moves, not every tick.
:::

## Following a path

[`NavPathFollower`](/api-reference/navigation/navpathfollower) tracks progress along a path. Call `Update` with the current position each tick; it returns the next waypoint, or null at the end:

```csharp
var follower = new NavPathFollower(path);

// Each tick:
Vector3? next = follower.Update(pawn.Position);
bool jump = follower.ShouldJump(pawn.Position);
```

`DistanceFromPath` is how far the walker has strayed; re-path when it grows. To drive a bot hero with a follower, see [Bots](bots#steering-a-bot).

## Queries

| Method | Returns |
|---|---|
| `Raycast(from, to, out stoppedAt)` | `true` if a straight walk stays on the navmesh. Otherwise `stoppedAt` is where it leaves. |
| `GetGroundHeight(position)` | Navmesh height under the point. |
| `GetArea(position)` | The [`NavArea`](/api-reference/navigation/navarea) there: `Id`, `Center`, `Attributes`, `Flags` and whether it is blocked. |
| `GetRandomPoint(origin, minDistance, maxDistance)` | A random point reachable from the origin. About `1` ms per call; `maxDistance` is capped at `6000`. |

```csharp
Vector3? spot = Nav.GetRandomPoint(pawn.Position, minDistance: 300f, maxDistance: 1200f);
```

## Blocking an area

`CreateBlocker` cuts a box out of the navmesh. NPCs, bots and `FindPath` route around it from shortly after the call:

```csharp
var blocker = Nav.CreateBlocker(center, halfExtents: new Vector3(200, 200, 120));

blocker?.Remove(); // Opens the area again
```

## See also

- [NPCs](npcs)
- [Bots](bots)
- [Tracing](tracing): lines through world collision rather than the navmesh.
