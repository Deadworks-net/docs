---
title: "Console Commands"
---

# Console Commands

> **Namespace:** `DeadworksManaged.Api`

Use [`[Command]`](commands) when you want to create a console command in your plugin.

If you name the command `heal`, Deadworks gives you:

- `/heal` in chat
- `!heal` in chat
- `dw_heal` in the console

The console version always starts with `dw_`.

If you only want the console version and do not want chat commands, set `ConsoleOnly = true`:

```csharp
[Command("heal", ConsoleOnly = true)]
public void CmdHeal()
{
    Console.WriteLine("Healing command ran.");
}
```

To limit who can run a command, give it a [permission](permissions):

```csharp
[Command("heal", ConsoleOnly = true, Permission = "healing.heal")]
```

The server console (and RCON) can always run every command.

For plugin settings, see [ConVars](convars).

## Built-in Commands

| Command | Who can run it | Description |
|---------|----------------|-------------|
| `dw_help` | Anyone | Lists the commands you're allowed to run |
| `dw_plugin <list\|enable\|disable\|commands> [name]` | Server console, or `deadworks.plugins.manage` | Manage plugins |
| `dw_reloadconfig [name]` | Server console, or `deadworks.config.reload` | Reload plugin configs |
| `dw_perm_*`, `dw_role_*` | See [How Permissions Work](../guides/admins-and-permissions#console-commands) | Manage roles and permissions |
