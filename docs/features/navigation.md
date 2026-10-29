---
title: "Navigation"
sidebar_label: "Navigation"
---

# Navigation

> **Namespace:** `DeadworksManaged.Api`

The **navmesh** is the walkable surface NPCs and bots path over. [`Nav`](/api-reference/navigation/nav) queries it without an NPC.

## Hulls

A **hull** is a body size. Each hull has its own navmesh, so a point one hull can reach may be unreachable for another.

| Hull | Used by |
|---|---|
| `0` | Heroes, including bots. Default for every query. |
| `1` | Lane troopers. |

`Nav.GetHull(entity)` returns an entity's hull. `FindPath` and `GetNearestPoint` also take the entity instead of a hull.

## Paths

`FindPath` returns a [`NavPath`](/api-reference/navigation/navpath), or null if there is no path:

```csharp
NavPath? path = Nav.FindPath(start, goal, pawn);
if (path == null)
    return;

foreach (var waypoint in path.Waypoints)
    Console.WriteLine($"{waypoint.Position} by {waypoint.Traverse}");
```

- `Waypoints` – points from the start to the goal, at most `256`. `Traverse` is how each is reached: `Ground`, `Jump`, `Climb`, `Ladder` or `Link`.
- `Length` – walking distance.
- `simplify: false` – one waypoint per area crossed, not only the corners.
- `allowPartial: true` – a path to the nearest reachable point when the goal is unreachable.

Both ends must be on the navmesh. Snap a point in the air or inside a wall with `GetNearestPoint`:

```csharp
var goal = Nav.GetNearestPoint(target, pawn);
```

:::tip
A path across the whole map takes about `1` ms. Re-path when the goal moves, not every tick.
:::

## Following a path

[`NavPathFollower`](/api-reference/navigation/navpathfollower) tracks progress along a path. `Update` takes the current position and returns the next waypoint, or null at the end:

```csharp
var follower = new NavPathFollower(path);

// Each tick:
Vector3? next = follower.Update(pawn.Position);
bool jump = follower.ShouldJump(pawn.Position);
```

`DistanceFromPath` is how far the walker has strayed. Find a new path when it grows. See [Bots](bots#steering-a-bot) to drive a bot with a follower.

## Queries

| Method | Description |
|---|---|
| `Raycast(from, to, out stoppedAt)` | Returns `true` if a straight walk stays on the navmesh. Otherwise `stoppedAt` is where it leaves. |
| `GetGroundHeight(position)` | Returns the navmesh height below the point. |
| `GetArea(position)` | Returns the [`NavArea`](/api-reference/navigation/navarea) at the point. |
| `GetRandomPoint(origin, minDistance, maxDistance)` | Returns a random reachable point in that distance range. `maxDistance` is capped at `6000`. About `1` ms per call. |

```csharp
Vector3? spot = Nav.GetRandomPoint(pawn.Position, minDistance: 300f, maxDistance: 1200f);
```

## Blocking an area

`CreateBlocker` blocks a box of the navmesh. NPCs, bots and `FindPath` route around it. Remove the blocker to unblock the area:

```csharp
var blocker = Nav.CreateBlocker(center, halfExtents: new Vector3(200, 200, 120));

blocker?.Remove();
```

:::note
The navmesh updates shortly after `CreateBlocker`, not during the call.
:::

## See also

- [NPCs](npcs)
- [Bots](bots)
- [Tracing](tracing) – lines through world collision instead of the navmesh.
