---
title: "How Deadworks Works"
sidebar_label: "How Deadworks Works"
---

# How Deadworks Works

A mental model of what Deadworks is, what it isn't, and why certain things behave the way they do.


```
          ┌──────────────────────────────────────────────────┐
          │                  deadworks.exe                   │
          │                                                  │
          │   ┌──────────────────────────────────────────┐   │
          │   │   Deadlock engine + game DLLs (server)   │   │
          │   │   (server.dll, engine2.dll, …)           │   │
          │   └──────────────────────────────────────────┘   │
          │          ↕  function hooks & signatures          │
          │   ┌──────────────────────────────────────────┐   │
          │   │    Deadworks native layer (C++)          │   │
          │   │    — hooks game functions                │   │
          │   │    — exposes them to .NET                │   │
          │   └──────────────────────────────────────────┘   │
          │          ↕  P/Invoke                             │
          │   ┌──────────────────────────────────────────┐   │
          │   │    DeadworksManaged.Api  (.NET 10)       │   │
          │   │    — CBaseEntity, events, timers, …      │   │
          │   └──────────────────────────────────────────┘   │
          │          ↕                                       │
          │   ┌──────────────────────────────────────────┐   │
          │   │    Your plugin DLLs                      │   │
          │   │    (loaded from managed/plugins/)        │   │
          │   └──────────────────────────────────────────┘   │
          └──────────────────────────────────────────────────┘
                               ↕ UDP
                           Deadlock clients
```

When you launch `deadworks.exe`, it loads the same game DLLs Deadlock's own `deadlock.exe -dedicated` would, then installs function hooks so plugin code can intercept and mutate game behavior before or after the engine sees it. Clients connect to this process just as they would a normal, unmodified server.

## Why Small Patches Sometimes Break Deadworks

Plugin code never touches private game symbols directly. The native layer finds game functions by **signature scanning**: looking for a unique byte pattern that identifies a function's start address inside `server.dll` / `engine2.dll` / etc. Each hook in Deadworks has an associated signature stored in [`config/deadworks_mem.jsonc`](#signatures-and-offsets).

When Valve ships a patch:

- If they only change inlining, unrelated code, or constants, signatures usually survive — your plugins keep working
- If they edit a function Deadworks hooks, its signature stops matching and that specific hook breaks
- A broken signature typically appears in the log as `signature not found` and stops plugin loading

Minor Deadlock patches leave Deadworks alone most of the time. Larger patches require updating a handful of signatures. The maintainers publish a new Deadworks release with fixes on patch day; updating is `download release → extract → done`.

## Signatures and Offsets

Two kinds of game-binary references live in `config/deadworks_mem.jsonc`:

- **Signatures** — byte patterns that identify a function's start address. Robust to most small patches.
- **Offsets** — relative positions *inside* a function (e.g. the call-site of a particular helper). More fragile than signatures — an instruction reordering can break them even when the enclosing function's signature is intact.

## What Runs On The Client vs Server

A lot of gameplay code lives on the client, and plugins cannot reach into it:

- **HUD / Panorama UI** — client only. No server-side injection path.
- **Camera** — client only. The server can only send certain messages to the client to manipulate the camera position and access limited angle data.
- **Rich presence / Steam overlay** — client only.
- **Rendering / particles** — the server can spawn entities such as particles, lights, etc., but visual effects are rendered on each client.
- **Input** — the server only sees buttons that have been bound to an in-game action (enumerated in `InputBitMask_t`).

The practical implication: if your plugin idea requires UI changes, per-client visuals, or custom fonts, every player has to install a matching client-side mod too. For most server-only game modes (BR, bhop, tag, prop hunt, custom items), nothing client-side is needed.

## Managed vs Native

A practical split for your code:

| Do in .NET | Do in native (Deadworks C++) |
|---|---|
| Game logic, control flow, plugin state, HTTP, file I/O | Function signature scanning and hook installation |
| Entity/player lookups, schema reads/writes | Protocol-level hooks, message interception before dispatch |
| Timer scheduling | Memory-unsafe fast paths |
| Event handling (`OnTakeDamage`, chat commands, …) | Adding a new hook surface to expose to .NET |

If you need functionality that crosses the P/Invoke boundary (new hook, new helper), the typical pattern is:

1. Find the native function via signature scanning in `deadworks/src`
2. Add a `NativeCallbacks` entry + `NativeInterop` pointer
3. Expose it through a `DeadworksManaged.Api` type

Contributing to the framework itself is separate from writing a plugin — most plugin authors never need to cross this boundary.

## See Also

- [Project Setup](../getting-started/setup.md) — installing Deadworks
- [Server Hosting](server-hosting.md) — running dedicated servers
- [Plugin Lifecycle](plugin-lifecycle.md) — what runs when
