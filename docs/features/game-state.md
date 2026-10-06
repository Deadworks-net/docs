---
title: "Game state"
sidebar_label: "Game state"
---

# Game state

> **Namespace:** `DeadworksManaged.Api`

A match moves through stages: waiting for players, picking heroes, playing, and finishing. `GameRules` reports the current stage. It also changes it.

## Find out what stage the match is at

```csharp
if (GameRules.GameState == EGameState.GameInProgress)
{
    // The match is being played
}
```

The stages, in order:

- `WaitingForPlayersToJoin`
- `HeroSelection`
- `MatchIntro`
- `PreGameWait`
- `GameInProgress`
- `PostGame`
- `End`

## Run code when the stage changes

Override `OnGameStateChanged`.

```csharp
public override void OnGameStateChanged(EGameState newState)
{
    Console.WriteLine($"The match is now at {newState}");
}
```

## Run code when the match starts or ends

```csharp
public override void OnGameStateChanged(EGameState newState)
{
    if (newState == EGameState.GameInProgress)
        Chat.PrintToChatAll("The match has started!");

    if (newState == EGameState.PostGame)
        Chat.PrintToChatAll("The match is over!");
}
```

## Stop the match moving to the next stage

Override `OnGameStateChanging` and return `false`.

```csharp
public override bool OnGameStateChanging(EGameState currentState, EGameState newState)
{
    // Don't leave hero selection until there are at least two players
    if (currentState == EGameState.HeroSelection && Players.GetAll().Count() < 2)
        return false;

    return true;
}
```

:::note
`OnGameStateChanging` only blocks stage changes the game makes by itself. It doesn't block `GameRules.ChangeGameState`.
:::

## Move the match to a stage yourself

```csharp
GameRules.ChangeGameState(EGameState.GameInProgress);
```

## End the match with a winner

Set `GameRules.WinningTeam` to the team that won. Team `2` is Amber. Team `3` is Sapphire.

```csharp
GameRules.WinningTeam = 2;
```

While the match is still being played, `GameRules.WinningTeam` is `-1`.

## Read the match clock

`GameRules.GameClock` is how long the match has been going, in seconds. It doesn't count time spent paused.

```csharp
float seconds = GameRules.GameClock;

Chat.PrintToChatAll($"The match has been going for {(int)(seconds / 60)} minutes.");
```

## Find out whether the game is paused

```csharp
if (GameRules.GamePaused)
{
    // ...
}
```

## Find out which game mode is running

```csharp
if (GameRules.GameMode == ECitadelGameMode.Sandbox)
{
    // ...
}
```

## Start every map with the countdown and ziplines

By default only `dl_midtown` starts a match with a countdown in base and a ride down the zipline. Set `GameRules.MatchStartOnAnyMap` to `true` to give every map that start.

```csharp
public override void OnLoad(bool isReload)
{
    GameRules.MatchStartOnAnyMap = true;
}

public override void OnUnload()
{
    GameRules.MatchStartOnAnyMap = false;
}
```

:::warning
`MatchStartOnAnyMap` stays on across map changes. Set it back to `false` in `OnUnload`, or it stays on after your plugin unloads.
:::

:::note
The countdown also needs the `citadel_match_intro_force_enabled` [cvar](convars) set to `1`.
:::
