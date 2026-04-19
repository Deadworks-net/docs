---
title: "Server Hosting"
sidebar_label: "Server Hosting"
---

# Server Hosting

:::info Windows only
This guide covers running a Deadworks dedicated server on **Windows**. Linux is not supported — Valve hasn't published a native Linux server binary for Deadlock, so every path below assumes a Windows host (local machine or Windows VPS).

Docker support is experimental and will be coming soon.
:::

This guide covers launch options, ports, firewalls, and the operational quirks that surface once real players try to connect.

## Installing the Server

Deadworks can be run using a normal game installation, but when running an actual server, it is recommended to create a separate install using [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD).

1. Download SteamCMD for Windows: https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip
2. Create a folder for SteamCMD. Example: D:\steamcmd
3. Extract the contents of the zip to the folder.

To install Deadlock via SteamCMD:

```
force_install_dir my_deadworks_server
app_update 1422450 validate
```

The same process is used for updating the server.

## Launching the Server

`deadworks.exe` replaces `deadlock.exe` for launching. All regular Source launch arguments that `deadlock.exe` accepts also work.

When started with no flags, Deadworks uses these defaults:

```
-dedicated -console -dev -insecure -allow_no_lobby_connect
+tv_citadel_auto_record 0 +spec_replay_enable 0 +tv_enable 0
+citadel_upload_replay_enabled 0
+hostport 27015
+map dl_midtown
```

Override any of them on the command line. `+hostport` is the port the server listens on for game traffic (UDP).

### Example: `run-server.bat`

A simple batch file that launches Deadworks on a custom port, map, and tickrate. Save this next to `deadworks.exe` and double-click it:

```batch
@echo off
cd /d "%~dp0"

deadworks.exe ^
  -dedicated -console -insecure -allow_no_lobby_connect ^
  +hostport 27015 ^
  +map dl_midtown

pause
```


## Opening the Firewall (Windows / VPS)

On a fresh Windows VPS the port you configured is almost certainly blocked by the Windows Firewall, even if the VPS provider's network-level firewall is open. Run this in PowerShell (as Administrator) once:

```powershell
New-NetFirewallRule -DisplayName "Deadworks TCP 27015" `
  -Direction Inbound -LocalPort 27015 -Protocol TCP -Action Allow

New-NetFirewallRule -DisplayName "Deadworks UDP 27015" `
  -Direction Inbound -LocalPort 27015 -Protocol UDP -Action Allow
```


## Port Forwarding

Forward UDP/TCP `27015` (or your chosen port) on your router or VPS firewall to let players outside your LAN connect. Players then connect with:

```
connect your.public.ip:27015
```
