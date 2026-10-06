---
title: "Install plugins"
sidebar_label: "2. Install plugins"
---

# Install plugins

Find plugins on the [Deadworks Discord](https://discord.gg/d3JHnVGA26).

## Add a plugin

1. Copy the plugin's `.dll` file, and any other `.dll` files it comes with, into `game\bin\win64\managed\plugins\`.
2. Start the server, or, if it's running, wait a moment: Deadworks loads new and changed plugins without a restart.

Deadworks only looks at the top of `plugins\`, not inside folders.

The server console confirms each plugin it loads:

```text
[PluginLoader] Scanning ...\managed\plugins (1 DLLs found)
```

## See what's installed

Run this in the server console:

```text
dw_plugin list
```

`dw_plugin commands <plugin>` lists a plugin's commands. `dw_help` lists every command on the server.

## Change a plugin's settings

A plugin with settings creates a file the first time it loads, at `game\bin\win64\configs\<Plugin>\<Plugin>.jsonc`. Edit it, then run:

```text
dw_reloadconfig <Plugin>
```

The server console prints the file, line and column of any mistake. The plugin keeps its previous settings until the file is fixed.

## Turn a plugin off

```text
dw_plugin disable <Plugin>
dw_plugin enable <Plugin>
```

The setting is remembered across restarts. To remove a plugin for good, delete its `.dll`.

## Limit who can use a plugin's commands

A plugin's commands work for everyone unless the plugin gives them a permission. To require one yourself, see [overrides.jsonc](../../guides/admins-and-permissions#overridesjsonc).

## Next

**[3. Set up admins](set-up-admins)**
