---
title: "Uploading Content"
sidebar_label: "Uploading Content"
---

# Uploading Content

Custom content (Panorama addons, models, maps) reaches players through the launcher, which downloads whatever your server advertises before the game starts. There are two steps: upload the file so clients can fetch it, then list it in the config so the server advertises it.

## Get your server token

Credentials are generated automatically the first time your server registers with the server browser:

```
game/bin/win64/configs/ServerBrowser/credentials.json
```

```json
{
  "server_id": "…",
  "server_token": "…"
}
```

Start the server once and let it register before looking for this file.

## Upload

Go to `https://deadworks.net/server/<server_id>/content`, paste your `server_token`, and upload your assets.

:::warning Names are globally unique
Addon and map names are claimed across all of Deadworks, not per server. If someone else has already uploaded content under a given name, that name is taken and you cannot reuse it. Pick something specific to your server or project.
:::

## List it in the config

`game/bin/win64/configs/deadworks.jsonc`, under `serverbrowser`. Names go in without the `.vpk` extension:

```jsonc
{
  "serverbrowser": {
    "content_addons": ["myaddon"],
    "extra_maps": ["dl_express"]
  }
}
```

The config is read once at startup, so restart the server after editing it.

### `content_addons`

VPKs the server mounts and clients download. On startup the server advertises the list to connecting clients and mounts each entry from `deadworks_mods/vpks/<name>.vpk`, so the VPK needs to be on the server as well as uploaded. The launcher puts the client's copy in `citadel/deadworks_addons/vpks/`.

### `extra_maps`

Maps cannot be mounted at runtime the way an addon can, so they are listed separately and fetched ahead of time. The launcher downloads them into `citadel/maps/` before the game launches. Name only, no extension.

## Gotchas

- **An unlisted server distributes nothing.** With `"unlisted": true` in the config (or `-nomaster` on the command line) the server never registers, never heartbeats, and never mounts content addons, so it never gets credentials either.
- **Upload and config are separate steps.** Uploading a file does not advertise it, and listing a name that was never uploaded gives clients nothing to download.
- **Names must match everywhere.** The string in `content_addons` is the VPK's filename without `.vpk`, on the server and in the upload alike.
