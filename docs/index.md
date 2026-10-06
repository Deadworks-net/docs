---
title: "Deadworks documentation"
sidebar_label: "Overview"
slug: "/"
---

# Deadworks documentation

Deadworks is a .NET plugin framework for server-side mods for **Deadlock**, Valve's Source 2 game. Plugins are .NET DLLs that Deadworks loads at runtime. They have access to the game's entity system, networking, damage pipeline and other systems.

## Run a server

For server admins who want to host Deadlock with plugins and admin commands.

1. [Run a server](getting-started/server-admins/run-a-server): install Deadlock and Deadworks, start the server and let players connect
2. [Install plugins](getting-started/server-admins/install-plugins): add, configure and turn off plugins
3. [Set up admins](getting-started/server-admins/set-up-admins): make yourself admin and add your staff
4. [Use admin commands](getting-started/server-admins/use-admin-tools): kick, ban, gag, mute and change map

## Write plugins

For developers who want to build their own plugins.

1. [Project setup](getting-started/developers/setup): create a Visual Studio project, reference the API DLL and configure auto-deploy
2. [Your first plugin](getting-started/developers/first-plugin): build a minimal plugin with a command

Then see [Features](features/commands) for common tasks, and the [API reference](api-reference) for every type.
