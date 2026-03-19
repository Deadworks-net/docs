---
title: "Console Commands & ConVars"
sidebar_label: "Console Commands"
---

# Console Commands & ConVars

> **Namespace:** `DeadworksManaged.Api`

## ConCommandAttribute

Marks a method as a console command handler. The method must have signature `void Handler(ConCommandContext ctx)`.

```csharp
[ConCommand("dw_killme")]
public void OnKillMe(ConCommandContext ctx)
{
    var pawn = ctx.Controller?.GetHeroPawn();
    if (pawn == null) return;

    pawn.Hurt(99999, pawn, pawn, pawn);
}
```

## ConCommandContext

Context passed to `[ConCommand]` handlers.

| Property | Type | Description |
|----------|------|-------------|
| `CallerSlot` | `int` | Player slot of the caller, or `-1` if invoked from server console |
| `Command` | `string` | The command name that was typed (args[0]) |
| `Args` | `string[]` | All arguments including the command name at index 0 |
| `ArgString` | `string` | The argument string after the command name. Empty if no args |
| `IsServerCommand` | `bool` | `true` when invoked from server console (no player) |
| `Controller` | `CCitadelPlayerController?` | The player controller, or `null` if invoked from server console |

## ConVarAttribute

Marks a property as a console variable. Supports `int`, `float`, `bool`, and `string` types.

Typing the name in console prints the current value; typing with an argument sets it.

```csharp
[ConVar("my_plugin_enabled")]
public bool Enabled { get; set; } = true;

[ConVar("my_plugin_damage")]
public float DamageMultiplier { get; set; } = 1.0f;
```

## ConVar Class

Programmatic access to Source 2 console variables.

### Static Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `Find(string name)` | `ConVar?` | Looks up an existing ConVar by name. **Verified working** |
| `Create(string name, string defaultValue, string description, bool notify)` | `ConVar?` | Creates and registers a new ConVar. **Currently returns null — use `[ConVar]` attribute instead** |

### Instance Methods

| Method | Description |
|--------|-------------|
| `SetInt(int value)` | Sets the cvar's value as an integer |
| `SetFloat(float value)` | Sets the cvar's value as a float |

### Example: Modifying Game Settings

```csharp
public override void OnStartupServer()
{
    // Modify existing game convars
    ConVar.Find("citadel_trooper_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_npc_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_allow_duplicate_heroes")?.SetInt(1);
    ConVar.Find("citadel_player_starting_gold")?.SetInt(0);
    ConVar.Find("citadel_voice_all_talk")?.SetInt(1);
}
```

## Server.ClientCommand

Send a console command to a specific client:

```csharp
Server.ClientCommand(playerSlot, "echo Hello from the server!");
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slot` | `int` | The player slot to send the command to |
| `command` | `string` | The console command string (e.g. `"echo hello"`, `"playgamesound ..."`) |

## Blocking Client Commands

Use the `OnClientConCommand` hook to intercept and block specific client console commands. This is useful for preventing players from performing certain actions.

### Known Client Commands

| Command | Description |
|---------|-------------|
| `selecthero` | Player selects/changes hero |
| `citadel_hero_pick` | Hero pick during selection |
| `sellitem` | Player sells an item. Args: `[sellitem, <ability_name>]` |

### Blocking Item Sales

Prevent players from selling specific items by checking the `sellitem` command and its arguments:

```csharp
private static readonly HashSet<string> _blockedItems = new(StringComparer.OrdinalIgnoreCase) {
    "upgrade_critshot",
    "upgrade_unstable_concoction",
};

public override HookResult OnClientConCommand(ClientConCommandEvent e)
{
    // Block selling specific items
    if (e.Command == "sellitem" && e.Args.Length >= 2 && _blockedItems.Contains(e.Args[1]))
        return HookResult.Stop;

    return HookResult.Continue;
}
```

### Blocking Hero Changes Outside Spawn

```csharp
public override HookResult OnClientConCommand(ClientConCommandEvent e)
{
    if (e.Command == "selecthero")
    {
        var pawn = e.Controller?.GetHeroPawn()?.As<CCitadelPlayerPawn>();
        if (pawn != null && !pawn.InRegenerationZone && pawn.Health > 0)
            return HookResult.Stop;
    }
    return HookResult.Continue;
}
```

### ClientConCommandEvent

| Property | Type | Description |
|----------|------|-------------|
| `Command` | `string` | The command name (e.g. `"sellitem"`, `"selecthero"`) |
| `Args` | `string[]` | All arguments including the command name at index 0 |
| `Controller` | `CCitadelPlayerController?` | The player who sent the command |

## See Also

- [Chat Commands](chat-commands) — Player chat commands (`[ChatCommand]`)
- [Plugin Base](plugin-base) — `OnClientConCommand` hook for intercepting client commands
