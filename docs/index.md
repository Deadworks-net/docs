---
title: "Deadworks API Documentation"
sidebar_label: "Overview"
slug: "/"
---

# Deadworks Scripting API Documentation

Deadworks is a .NET plugin framework for creating server-side mods for **Deadlock** (Valve's Source 2 game). Plugins are compiled as .NET DLLs and loaded at runtime, with full access to the game's entity system, networking, damage pipeline, and more.

## Quick Start

- [Project Setup](getting-started/setup.md) — Create a Visual Studio project, reference the API DLL, and configure auto-deploy
- [Your First Plugin](getting-started/first-plugin.md) — Build a minimal plugin with a chat command

## API Reference

| Topic | Description |
|-------|-------------|
| [Plugin Base](api-reference/plugin-base.md) | `DeadworksPluginBase`, lifecycle hooks, `IDeadworksPlugin` interface |
| [Chat Commands](api-reference/chat-commands.md) | `[ChatCommand]` attribute, `ChatCommandContext` |
| [Console Commands & ConVars](api-reference/console-commands.md) | `[ConCommand]`, `[ConVar]`, `ConVar` class |
| [Timers](api-reference/timers.md) | `Timer.Once`, `Timer.Every`, `Timer.Sequence`, `Duration` |
| [Entities](api-reference/entities.md) | `CBaseEntity`, entity creation, schema access, `EntityData<T>` |
| [Players](api-reference/players.md) | `CCitadelPlayerController`, `CCitadelPlayerPawn`, `Players` helpers |
| [Networking](api-reference/networking.md) | `NetMessages.Send`, `RecipientFilter`, message hooks |
| [Particles](api-reference/particles.md) | `CParticleSystem`, fluent builder API |
| [Modifiers](api-reference/modifiers.md) | `AddModifier`, `KeyValues3`, `EModifierState` |
| [Damage](api-reference/damage.md) | `OnTakeDamage`, `CTakeDamageInfo`, `Hurt()` |
| [Game Events](api-reference/game-events.md) | `[GameEventHandler]`, `GameEvents`, `GameEvent` |
| [Entity I/O](api-reference/entity-io.md) | `EntityIO.HookOutput`, `EntityIO.HookInput` |
| [Configuration](api-reference/configuration.md) | `IPluginConfig<T>`, `BasePluginConfig`, JSON serialization |
| [Heroes](api-reference/heroes.md) | `Heroes` enum, `HeroTypeExtensions`, `CitadelHeroData` |
| [Precaching](api-reference/precaching.md) | `Precache.AddResource`, `Precache.AddHero` |
| [Tracing](api-reference/tracing.md) | `Trace.Ray`, `TraceShape`, `CGameTrace`, collision filtering |
| [World Text](api-reference/world-text.md) | `CPointWorldText`, 3D text panels and nametags |
| [Sound](api-reference/sound.md) | `EmitSound`, `point_soundevent`, soundevent discovery |

## Guides

- [How Deadworks Works](guides/how-deadworks-works.md) — Architecture, signatures, what's client vs server
- [Plugin Lifecycle](guides/plugin-lifecycle.md) — Load/unload flow, hot-reloading, resource precaching
- [Server Hosting](guides/server-hosting.md) — Launch options, firewalls, SDR, port conflicts, Linux
- [Team & Hero Management](guides/team-and-hero-management.md) — Balancing teams, forcing hero selection, currency control
- [Chat & HUD Messaging](guides/chat-and-hud.md) — Sending chat messages, HUD announcements, world text

## Example Plugins

Full annotated breakdowns of real plugins:

- [Roll The Dice](examples/roll-the-dice.md) — Random effects via chat command (particles, modifiers, timers)
- [Item Rotation](examples/item-rotation.md) — Timed item set rotation with JSON config
- [Scourge](examples/scourge.md) — Damage-over-time effect using `OnTakeDamage` + timer sequences

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
