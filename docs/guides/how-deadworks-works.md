---
title: "How Deadworks Works"
sidebar_label: "How Deadworks Works"
---

# How Deadworks Works

Deadworks is a Deadlock server that can run plugins. You start `deadworks.exe` where you would normally start `deadlock.exe`. It runs the same game, and players connect to it like any other server.

```text
Players' games
      ↕
deadworks.exe
  ├── The Deadlock server
  ├── Deadworks
  └── Your plugins
```

Deadworks sits between the game and your plugins. When something happens in the game, such as a player taking damage, Deadworks tells your plugin. When your plugin wants something done, such as healing a player, Deadworks tells the game.

## Your plugin

A plugin is a C# project built into a `.dll` file. Put the file in the `managed/plugins/` folder and Deadworks loads it. See [Your First Plugin](../getting-started/first-plugin).

Plugins run on the server only. Players don't install anything to join a server that uses them.

## Why a game update can break Deadworks

Deadworks works by finding specific pieces of the game's code and attaching to them. Deadlock isn't built to be modded, so Deadworks has to find those pieces itself.

When Valve updates the game:

- A small update usually changes nothing Deadworks relies on, and everything keeps working.
- A bigger update can move or change a piece Deadworks attaches to. Deadworks then can't find it, and plugins stop loading. The server log says `signature not found`.

When that happens, a new Deadworks release fixes it. Download it, extract it over your install, and you are running again.

## What a plugin can't do

A plugin runs on the server. Some things only happen in each player's own game, where a plugin can't reach:

- **The HUD.** A plugin can show its own panels, but only to players who joined through the Deadworks launcher. See [UI Panels](../features/ui).
- **The camera.** A plugin can ask a player's game to move the camera, but it can't take full control of it.
- **Visual effects.** A plugin can create particles and lights, but each player's game draws them.
- **Input.** A plugin only sees the buttons the game already uses, such as jump or an ability. It can't see other keys.

Most game modes need none of this. If yours needs custom models, sounds or UI, players have to download them. See [Uploading Content](uploading-content).
