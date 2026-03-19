---
title: "Chat Commands"
sidebar_label: "Chat Commands"
sidebar_position: 2
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# ChatCommandAttribute

> **Namespace:** `DeadworksManaged.Api`

Marks a plugin method as a handler for a chat command (e.g. `"!mycommand"`). Can be applied multiple times to map multiple commands to the same method.

## Constructors

| Method | Description |
|--------|-------------|
| `ChatCommandAttribute(string command)` | *command*: The command string to match, including any prefix character. |

## Properties

| Property | Description |
|----------|-------------|
| `Command` | The chat command string this attribute matches, including the prefix (e.g. `"!mycommand"`). |

---

## ChatCommandContext

> **Namespace:** `DeadworksManaged.Api`

Provides context for an invoked chat command, including the originating message, parsed command name, and arguments.

### Properties

| Property | Description |
|----------|-------------|
| `Message` | The raw chat message that triggered this command. |
| `Command` | The matched command string (e.g. `"!mycommand"`). |
| `Args` | Arguments following the command, split by whitespace. |
| `Controller` | The player controller who sent the command, or `null` if unavailable. |

---

## ChatMessage

> **Namespace:** `DeadworksManaged.Api`

Incoming chat message from a player. Passed to `ChatMessage)`.
