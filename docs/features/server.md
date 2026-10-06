---
title: "Server"
sidebar_label: "Server"
---

# Server

> **Namespace:** `DeadworksManaged.Api`

`Server` controls things that affect the whole server: the map, console commands, kicking players and adding bots.

## Find out which map is running

```csharp
string map = Server.MapName; // "dl_midtown"
```

## Change the map

```csharp
if (!Server.ChangeMap(mapName))
    throw new CommandException($"There's no map called {mapName}.");
```

Everyone stays connected and loads into the new map. `ChangeMap` checks the name with `Server.IsMapValid` first. It returns `false` if the map doesn't exist, so it's safe to pass a name a player typed. `Server.ChangeLevel(map)` changes map without checking.

`Server.GetMapList()` returns the maps you can change to: the game's own maps, plus any listed under `serverbrowser.extra_maps` in `configs/deadworks.jsonc`, sorted by name.

While the map is changing, `Server.IsChangingLevel` is `true`.

:::warning
Changes you make to players while the map is changing are lost. Check `Server.IsChangingLevel` first and return early.
:::

```csharp
if (Server.IsChangingLevel) return;
```

## Run code when a map starts

Override `OnStartupServer`. It runs every time a map starts, including the first.

```csharp
public override void OnStartupServer()
{
    Console.WriteLine($"Now playing on {Server.MapName}");
}
```

## Run a console command

```csharp
Server.ExecuteCommand("sv_cheats 1");
```

`ExecuteCommand` runs the command as if it were typed in the server console.

:::tip
To change a setting, set a [cvar](convars) instead.
:::

To read the command's output, pass a callback. The callback runs on a later frame, because console commands run on the next frame.

```csharp
Server.ExecuteCommand("status", output => caller.Reply(output));
```

Setting a cvar prints nothing, so its output is empty.

## Run a command on a player's game

```csharp
Server.ClientCommand(controller.Slot, "echo Hello from the server!");
```

`ClientCommand` runs the command in that player's game console.

## Kick a player

```csharp
controller.Kick("You were kicked for being idle.");
```

`Kick` prints the message in the player's chat and game console. It then passes the message to the engine as the disconnect reason.

:::note
Deadlock doesn't show the disconnect reason on the main menu. The player only sees the message if they read it before the disconnect. To give them time, warn them first.
:::

```csharp
Chat.PrintToChat(controller, "You'll be kicked in 3 seconds for being idle.");

Timer.Once(3.Seconds(), () => controller.Kick("You were kicked for being idle."));
```

`Server.Kick(slot, message)` does the same for a slot. `controller.Kick()` with no message kicks the player without a message.

To turn a player away while they're connecting, see [Refusing a connection with a reason](admin-api#refusing-a-connection-with-a-reason). To ban them, see [Penalties](admin-api#penalties).

## Add a bot

```csharp
int slot = Server.CreateFakeClient("Bot");

if (slot == -1)
    Console.WriteLine("There was no free slot for a bot.");
```

`CreateFakeClient` returns the bot's slot, or `-1` when the server has no slot free.

To tell bots from real players, check `IsBot`:

```csharp
foreach (var controller in Players.GetAll())
{
    if (controller.IsBot) continue;

    // Real players only
}
```

## Run code every tick

Override `OnGameFrame`. Check `simulating` first, so your code only runs while the game is running.

```csharp
public override void OnGameFrame(bool simulating, bool firstTick, bool lastTick)
{
    if (!simulating) return;

    // ...
}
```

`OnGameFrame` runs every tick, so keep it fast. For anything slower than every tick, use a [timer](timers).

## Find out what time it is in the game

`GlobalVars.CurTime` is the game's clock, in seconds. Use it to measure how long something took.

```csharp
float started = GlobalVars.CurTime;

// Later
float seconds = GlobalVars.CurTime - started;
```

`GlobalVars.TickCount` is how many ticks the game has run. `GlobalVars.IntervalPerTick` is how long one tick lasts.

## Read what the server logs

```csharp
public override void OnLoad(bool isReload)
{
    Server.AddEngineLogListener(OnLog);
}

public override void OnUnload()
{
    Server.RemoveEngineLogListener(OnLog);
}

private void OnLog(string message)
{
    if (message.Contains("error"))
    {
        // ...
    }
}
```

The game engine calls your method with every line it logs.
