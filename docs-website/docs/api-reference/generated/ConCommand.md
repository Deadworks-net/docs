---
title: "Console Commands"
sidebar_label: "Console Commands"
sidebar_position: 3
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# ConCommandAttribute

> **Namespace:** `DeadworksManaged.Api`

Marks a method as a console command handler. The method must have signature `void Handler(ConCommandContext ctx)`.

---

## ConCommandContext

> **Namespace:** `DeadworksManaged.Api`

Context passed to [ConCommand] and [ConVar] handlers.

### Properties

| Property | Description |
|----------|-------------|
| `CallerSlot` | Player slot of the caller, or -1 if invoked from server console. |
| `Command` | The command name that was typed (args[0]). |
| `Args` | All arguments including the command name at index 0. |
| `ArgString` | The argument string after the command name. Empty if no args. |
| `IsServerCommand` | True when invoked from server console (no player). |
| `Controller` | The player controller, or null if invoked from server console. |

---

## ConVarAttribute

> **Namespace:** `DeadworksManaged.Api`

Marks a property as a console variable. Supports int, float, bool, and string. Typing the name in console prints the current value; typing with an argument sets it.
