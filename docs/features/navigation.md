---
title: "Navigation"
sidebar_label: "Navigation"
---

# Navigation

> **Namespace:** `DeadworksManaged.Api`

The navmesh is the map of walkable ground that NPCs and bots path on. [`Nav`](/api-reference/navigation/nav) queries it directly, without an NPC.

## Hulls

A hull is the body size a query plans for. Each hull has its own navmesh areas, so a point reachable with one hull may be unreachable with another.

| Hull | Used by |
|---|---|
| `0` | Heroes, including bot heroes. Default for every query. |
| `1` | Lane troopers. |

`Nav.GetHull(entity)` returns an NPC's or hero's hull. `FindPath` and `GetNearestPoint` also accept the entity in place of a hull.

## Paths

`FindPath` returns a [`NavPath`](/api-reference/navigation/navpath), or null if there is no path or either end is off the navmesh:

```csharp
NavPath? path = Nav.FindPath(start, goal, pawn);
if (path == null)
    return;

foreach (var waypoint in path.Waypoints)
    Console.WriteLine($"{waypoint.Position} by {waypoint.Traverse}");
```

- `Waypoints` runs from `start` to the goal, at most `256` of them. `Traverse` is how each is reached: `Ground`, `Jump`, `Climb`, `Ladder` or `Link`.
- `Length` is the walking distance.
- `simplify: false` returns every area crossed instead of only the corners.
- `allowPartial: true` returns a path to the reachable point nearest an unreachable goal.

Snap an end that may be in the air or inside a wall onto the navmesh first:

```csharp
var goal = Nav.GetNearestPoint(target, pawn);
```

:::tip
A path across the whole map takes about `1` ms. Find a new one when the goal moves, not every tick.
:::

## Following a path

[`NavPathFollower`](/api-reference/navigation/navpathfollower) tracks progress along a path. Call `Update` with the current position each tick; it returns the waypoint to head for, or null at the end.

```csharp
var follower = new NavPathFollower(path);

// Each tick:
Vector3? next = follower.Update(pawn.Position);
bool jump = follower.ShouldJump(pawn.Position);
```

`DistanceFromPath` is how far the walker has strayed. Find a new path when it grows large. To drive a bot hero with it, see [Bots](bots#steering-a-bot).

## Queries

| Method | Returns |
|---|---|
| `Raycast(from, to, out stoppedAt)` | `true` if a straight walk stays on the navmesh. Otherwise `stoppedAt` is where it leaves. |
| `GetGroundHeight(position)` | The height of the navmesh under the point. |
| `GetArea(position)` | The [`NavArea`](/api-reference/navigation/navarea) there: `Id`, `Center`, `Attributes`, `Flags` and whether it is blocked. |
| `GetRandomPoint(origin, minDistance, maxDistance)` | A random point connected to the origin, so a path reaches it. About `1` ms per call. The largest distance is `6000`. |

```csharp
Vector3? spot = Nav.GetRandomPoint(pawn.Position, minDistance: 300f, maxDistance: 1200f);
```

## Blocking an area

`CreateBlocker` cuts a box out of the navmesh. NPCs, bots and `FindPath` route around it. The navmesh changes a moment after the call, not during it.

```csharp
var blocker = Nav.CreateBlocker(center, halfExtents: new Vector3(200, 200, 120));

blocker?.Remove(); // Opens the area again
```

## See also

- [NPCs](npcs)
- [Bots](bots)
- [Tracing](tracing): lines through world collision rather than the navmesh.
