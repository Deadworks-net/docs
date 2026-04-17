---
title: "Deadworks API Documentation"
sidebar_label: "Overview"
slug: "/"
---

# Deadworks Scripting API Documentation

Deadworks is a .NET plugin framework for creating server-side mods for **Deadlock** (Valve's Source 2 game). Plugins are compiled as .NET DLLs and loaded at runtime, with full access to the game's entity system, networking, damage pipeline, and more.

## Quick Start

- [Project Setup](getting-started/setup) — Create a Visual Studio project, reference the API DLL, and configure auto-deploy
- [Your First Plugin](getting-started/first-plugin) — Build a minimal plugin with a chat command

## API Reference

| Topic | Description |
|-------|-------------|
| [Plugin Base](api-reference/plugin-base) | `DeadworksPluginBase`, lifecycle hooks, `IDeadworksPlugin` interface |
| [Chat Commands](api-reference/chat-commands) | `[ChatCommand]` attribute, `ChatCommandContext` |
| [Console Commands & ConVars](api-reference/console-commands) | `[ConCommand]`, `[ConVar]`, `ConVar` class |
| [Timers](api-reference/timers) | `Timer.Once`, `Timer.Every`, `Timer.Sequence`, `Duration` |
| [Entities](api-reference/entities) | `CBaseEntity`, entity creation, schema access, `EntityData<T>` |
| [Players](api-reference/players) | `CCitadelPlayerController`, `CCitadelPlayerPawn`, `Players` helpers |
| [Networking](api-reference/networking) | `NetMessages.Send`, `RecipientFilter`, message hooks |
| [Particles](api-reference/particles) | `CParticleSystem`, fluent builder API |
| [Modifiers](api-reference/modifiers) | `AddModifier`, `KeyValues3`, `EModifierState` |
| [Damage](api-reference/damage) | `OnTakeDamage`, `CTakeDamageInfo`, `Hurt()` |
| [Game Events](api-reference/game-events) | `[GameEventHandler]`, `GameEvents`, `GameEvent` |
| [Entity I/O](api-reference/entity-io) | `EntityIO.HookOutput`, `EntityIO.HookInput` |
| [Configuration](api-reference/configuration) | `IPluginConfig<T>`, `BasePluginConfig`, JSON serialization |
| [Heroes](api-reference/heroes) | `Heroes` enum, `HeroTypeExtensions`, `CitadelHeroData` |
| [Precaching](api-reference/precaching) | `Precache.AddResource`, `Precache.AddHero` |
| [Tracing](api-reference/tracing) | `Trace.Ray`, `TraceShape`, `CGameTrace`, collision filtering |
| [World Text](api-reference/world-text) | `CPointWorldText`, 3D text panels and nametags |
| [Sound](api-reference/sound) | `EmitSound`, `point_soundevent`, soundevent discovery |

## Guides

- [How Deadworks Works](guides/how-deadworks-works) — Architecture, signatures, what's client vs server
- [Plugin Lifecycle](guides/plugin-lifecycle) — Load/unload flow, hot-reloading, resource precaching
- [Server Hosting](guides/server-hosting) — Launch options, firewalls, SDR, port conflicts, Linux
- [Damage System](guides/damage-system) — Intercepting and modifying damage, applying DOT effects
- [Team & Hero Management](guides/team-and-hero-management) — Balancing teams, forcing hero selection, currency control
- [Chat & HUD Messaging](guides/chat-and-hud) — Sending chat messages, HUD announcements, world text

## Example Plugins

Full annotated breakdowns of real plugins:

- [Roll The Dice](examples/roll-the-dice) — Random effects via chat command (particles, modifiers, timers)
- [Item Rotation](examples/item-rotation) — Timed item set rotation with JSON config
- [Deathmatch](examples/deathmatch) — Full game mode: spawn control, team balancing, custom commands
- [Scourge](examples/scourge) — Damage-over-time effect using `OnTakeDamage` + timer sequences

## Architecture

```
Your Plugin (.cs)
    │
    ├── inherits DeadworksPluginBase
    ├── references DeadworksManaged.Api.dll
    └── compiles to .NET DLL
         │
         └── deployed to: Deadlock/game/bin/win64/managed/plugins/
```

**Runtime:** .NET 10.0
**Dependencies:** `DeadworksManaged.Api.dll`, `Google.Protobuf.dll`
**Namespace:** `DeadworksManaged.Api`
