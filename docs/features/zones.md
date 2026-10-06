---
title: "Zones & beams"
sidebar_label: "Zones & beams"
---

# Zones & beams

> **Namespace:** `DeadworksManaged.Api.Utils` for zones, `DeadworksManaged.Api` for beams

A **zone** is an invisible box in the world that reports when a player walks into it or out of it. Use one for a finish line, a checkpoint or a safe area.

A **beam** is a glowing line in the world that every player can see. Use beams to show players where a zone is.

## Create a zone

Give it two opposite corners of the box.

```csharp
using DeadworksManaged.Api.Utils;

var finish = new Zone(new Vector3(-100, -100, 0), new Vector3(100, 100, 128));
```

The zone keeps working until you remove it or your plugin unloads.

## Find a position to use

Stand where you want the corner and print where you are.

```csharp
[Command("pos")]
public void CmdPos(Caller caller)
{
    var pawn = caller.Player?.GetHeroPawn();
    if (pawn == null)
        throw new CommandException("You need a hero to do that.");

    caller.Reply($"You are at {pawn.Position}");
}
```

## Run code when a player walks into a zone

```csharp
finish.Entered += (zone, player, pawn) =>
{
    Chat.PrintToChat(player, "You finished!");
};
```

`player` is the player's controller. `pawn` is their hero. `Entered` also fires when a player teleports or respawns inside the zone.

## Run code when a player leaves a zone

```csharp
finish.Left += (zone, player, pawn) =>
{
    Chat.PrintToChat(player, "You left the finish area.");
};
```

`Left` also fires when a player inside the zone dies. `pawn` is `null` if they no longer have a hero.

## Make a zone the right size

A player's position is at their hero's feet. Start the box a little below the floor and go up to about head height.

```csharp
var floor = new Vector3(0, 0, 64);

var area = Zone.FromOrigin(floor,
    new Vector3(-64, -64, -8),  // from just below the floor
    new Vector3(64, 64, 96));   // to about head height
```

:::warning
A fast player can pass straight through a thin zone without triggering it. Make a zone that players run through, like a finish line, at least 100 units deep.
:::

## Create a zone around a point

```csharp
var zone = Zone.FromCenter(
    center: new Vector3(0, 0, 100),
    size: new Vector3(200, 200, 200));
```

## Send players back when they fall into a pit

```csharp
var safeSpot = new Vector3(0, 0, 64);

var pit = new Zone(new Vector3(-500, -500, -300), new Vector3(500, 500, -200));

pit.Entered += (zone, player, pawn) =>
{
    pawn.Teleport(position: safeSpot);
};
```

## Find out who is in a zone

```csharp
foreach (var player in finish.Occupants)
{
    Chat.PrintToChat(player, "You are in the finish area.");
}

int count = finish.OccupantCount;

bool inside = finish.IsInside(controller);
```

## Use one method for several zones

Give each zone a `Tag`, and read it in the method.

```csharp
var checkpoint1 = new Zone(cornerA, cornerB) { Tag = 1 };
var checkpoint2 = new Zone(cornerC, cornerD) { Tag = 2 };

checkpoint1.Entered += OnCheckpoint;
checkpoint2.Entered += OnCheckpoint;

void OnCheckpoint(Zone zone, CCitadelPlayerController player, CCitadelPlayerPawn pawn)
{
    Chat.PrintToChat(player, $"Checkpoint {zone.Tag}!");
}
```

## Turn a zone off and on

```csharp
finish.Enabled = false;
finish.Enabled = true;
```

While a zone is off, everyone counts as outside it.

## Move a zone

```csharp
finish.MoveTo(new Vector3(500, 0, 64));
```

The zone keeps its size. Players it now covers count as having entered, and players it no longer covers count as having left.

## Remove a zone

```csharp
finish.Dispose();
```

## Show players where a zone is

Draw a box of beams around it.

```csharp
List<CBeam> outline = CBeam.CreateBox(finish.Mins, finish.Maxs);
```

## Draw a line

```csharp
var beam = CBeam.Create(
    start: new Vector3(0, 0, 100),
    end: new Vector3(500, 0, 100));
```

`Create` returns `null` if it can't create the beam.

## Draw a path

`CreatePolyline` joins a list of points. Pass `closed: true` to join the last point back to the first.

```csharp
var points = new List<Vector3>
{
    new(0, 0, 100),
    new(200, 0, 100),
    new(200, 200, 100),
    new(0, 200, 100),
};

List<CBeam> ring = CBeam.CreatePolyline(points, closed: true);
```

## Change a beam's colour or width

```csharp
using System.Drawing;

var beam = CBeam.Create(start, end, width: 4f, color: Color.Red);
```

To change it later:

```csharp
beam.RenderColor = Color.Lime;
beam.Width = 8f;
```

:::note
A beam glows, so it always looks partly transparent. A black beam is invisible.
:::

## Remove beams

```csharp
beam.Remove();

CBeam.RemoveAll(outline); // every beam in a list
```

Beams are also removed when the map changes.
