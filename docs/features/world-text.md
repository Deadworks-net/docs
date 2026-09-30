---
title: "World Text"
sidebar_label: "World Text"
---

# World Text

> **Namespace:** `DeadworksManaged.Api`

World text is text that sits in the world, like a sign. Players see it when they are near it. To put text on a player's screen instead, see [Chat](chat) or [UI Panels](ui).

## Put text in the world

```csharp
var text = CPointWorldText.Create("Hello World", new Vector3(100, 200, 300));
```

`Create` returns `null` if the text couldn't be made, so check it before you use it.

## Change the text

```csharp
text.SetMessage("ROUND 2");
```

## Write more than one line

Put `\n` where you want a new line.

```csharp
var text = CPointWorldText.Create(
    "Every minute, each team\nis assigned a random hero!",
    new Vector3(100, 200, 300));
```

## Change the colour

Give `Create` a red, green and blue value, each from 0 to 255.

```csharp
var text = CPointWorldText.Create("GAME OVER", new Vector3(100, 200, 300),
    r: 255, g: 0, b: 0);
```

To change it later:

```csharp
text.SetColor(0, 255, 0);
```

## Change the size

`WorldUnitsPerPx` is how big the text is in the world. A larger number makes larger text.

```csharp
var text = CPointWorldText.Create("DEADWORKS", new Vector3(100, 200, 300));
if (text == null) return;

text.WorldUnitsPerPx = 0.5f;
```

## Change the font

```csharp
var text = CPointWorldText.Create("DEADWORKS", new Vector3(100, 200, 300),
    fontName: "Reaver");
```

## Centre the text

By default the text starts at the position you gave and runs to the right. To centre it on that position:

```csharp
text.JustifyHorizontal = HorizontalJustify.Center;
text.JustifyVertical = VerticalJustify.Center;
```

## Turn the text

Text faces one way and can only be read from the front. Turn it with `Teleport`.

```csharp
text.Teleport(angles: new Vector3(180, 0, 270));
```

Getting the angles right takes some trial and error.

## Make the text face whoever is looking

Pass `reorientMode: 1`, and the text turns to face each player's camera.

```csharp
var text = CPointWorldText.Create("Hello World", new Vector3(100, 200, 300),
    reorientMode: 1);
```

## Put a name above a player

Create the text above the player's head, then attach it to their hero so it follows them.

```csharp
public override void OnClientFullConnect(ClientFullConnectEvent args)
{
    var controller = args.Controller;
    var pawn = controller?.GetHeroPawn();
    if (controller == null || pawn == null) return;

    var text = CPointWorldText.Create(
        controller.PlayerName,
        pawn.Position + new Vector3(0, 0, 96),
        reorientMode: 1);
    if (text == null) return;

    text.JustifyHorizontal = HorizontalJustify.Center;
    text.SetParent(pawn);
}
```

Attached text is removed along with the hero, so you don't need to keep track of it.

## Hide and show the text

```csharp
text.Enabled = false;
text.Enabled = true;
```

## Remove the text

```csharp
text.Remove();
```

## Change something else

World text is a `point_worldtext` [entity](entities). Its [database page](https://deadworks.net/db/entities/point_worldtext) lists every setting and input it has, such as a background behind the text.

```csharp
text.AcceptInput("Toggle"); // hide it if it's showing, show it if it's hidden
```
