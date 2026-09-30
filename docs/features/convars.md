---
title: "ConVars"
sidebar_label: "ConVars"
---

# ConVars

> **Namespace:** `DeadworksManaged.Api`

A ConVar is a named setting you can read or change from the console. The game has thousands of them, and changing them is how a plugin changes the rules of the game.

## Change a game setting

Find the game's ConVar by name and set it. `OnStartupServer` is a good place, because it runs every time a map starts.

```csharp
public override void OnStartupServer()
{
    ConVar.Find("citadel_allow_duplicate_heroes")?.SetInt(1);
    ConVar.Find("citadel_player_starting_gold")?.SetInt(0);
    ConVar.Find("citadel_voice_all_talk")?.SetInt(1);
}
```

Use `SetInt` or `SetFloat`, depending on the setting.

The [ConVar database](https://deadworks.net/db/convars) lists every ConVar in the game.

## Read a game setting

```csharp
var convar = ConVar.Find("citadel_player_starting_gold");
if (convar == null) return;

int gold = convar.GetInt();
```

Use `GetInt`, `GetFloat` or `GetString`, depending on the setting. `Find` returns `null` when there is no ConVar with that name.

## Add your own ConVar

Put `[ConVar]` on a property, and start the name with `dw_`.

```csharp
public class MyPlugin : DeadworksPluginBase
{
    public override string Name => "My Plugin";

    [ConVar("dw_my_plugin_damage", Description = "Damage multiplier")]
    public float DamageMultiplier { get; set; } = 1.0f;
}
```

The value you give the property is the default. The property can be an `int`, `float`, `bool` or `string`.

In your code, read the property. It always holds the current value.

## Change your ConVar from the console

Type the name by itself to see the current value. Type the name and a value to change it.

```text
dw_my_plugin_damage
dw_my_plugin_damage 1.5
```

To only let the server console change it, add `ServerOnly = true`:

```csharp
[ConVar("dw_my_plugin_damage", Description = "Damage multiplier", ServerOnly = true)]
public float DamageMultiplier { get; set; } = 1.0f;
```
