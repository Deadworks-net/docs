---
title: "ConVar"
sidebar_label: "ConVar"
sidebar_position: 11
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# ConVar

> **Namespace:** `DeadworksManaged.Api`

Wraps a Source 2 console variable (cvar). Use `String)` to look up existing cvars or `Boolean)` to register new ones.

## Methods

| Method | Description |
|--------|-------------|
| `Find(string arg0)` | Looks up an existing ConVar by name. Returns null if not found. |
| `Create(string arg0, string arg1, string arg2, bool arg3)` | Creates a new ConVar registered with the engine. Returns null if creation fails. |
| `SetInt(int arg0)` | Sets the cvar's value as an integer. |
| `SetFloat(float arg0)` | Sets the cvar's value as a float. |
