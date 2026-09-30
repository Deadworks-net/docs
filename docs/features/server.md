---
title: "Server"
sidebar_label: "Server"
---

# Server

> **Namespace:** `DeadworksManaged.Api`

`Server` is for things that affect the whole server: the map, console commands, kicking players and adding bots.

## Find out which map is running

```csharp
string map = Server.MapName; // "dl_midtown"
```

## Change the map

```csharp
Server.ChangeLevel("dl_midtown");
```

Everyone stays connected and loads into the new map.

While the map is changing, `Server.IsChangingLevel` is `true`. Anything you do to players during that time is lost, so check it first.

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

This runs the command as if it were typed in the server console. To change a setting, [ConVars](convars) are usually neater.

## Run a command on a player's game

```csharp
Server.ClientCommand(controller.Slot, "echo Hello from the server!");
```

This runs the command in that player's own console.

## Kick a player

```csharp
controller.Kick();
```

The player is sent back to the main menu and isn't told why. Tell them first if they should know:

```csharp
Chat.PrintToChat(controller, "You are being kicked for being idle.");

Timer.Once(3.Seconds(), () => controller.Kick());
```

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

Override `OnGameFrame`. Check `simulating` first, so your code only runs while the game is actually running.

```csharp
public override void OnGameFrame(bool simulating, bool firstTick, bool lastTick)
{
    if (!simulating) return;

    // ...
}
```

This runs very often, so keep it quick. For anything slower than every tick, use a [timer](timers).

## Find out what time it is in the game

`GlobalVars.CurTime` is the game's clock, in seconds. Use it to measure how long something took.

```csharp
float started = GlobalVars.CurTime;

// Later
float seconds = GlobalVars.CurTime - started;
```

`GlobalVars.TickCount` is how many ticks the game has run, and `GlobalVars.IntervalPerTick` is how long one tick lasts.

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

Your method is called with every line the game engine logs.
