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

**Coming soon:** to limit who can run a command, give it a [permission](permissions):

```csharp
[Command("heal", ConsoleOnly = true, Permission = "healing.heal")]
```

The server console (and RCON) can always run every command.

For plugin settings, see [ConVars](convars).

## Built-in Commands

| Command | Who can run it | Description |
|---------|----------------|-------------|
| `dw_help` | Anyone | Lists the commands you can run (coming soon: only the ones you're allowed to) |
| `dw_plugin <list\|enable\|disable\|commands> [name]` | Server console (coming soon: or `deadworks.plugins.manage`) | Manage plugins |
| `dw_reloadconfig [name]` | Server console (coming soon: or `deadworks.config.reload`) | Reload plugin configs |
| `dw_perm_*`, `dw_role_*`, `dw_penalties_reload` (coming soon) | See [How Permissions Work](../guides/permissions#console-commands) | Manage roles, permissions and penalties |
