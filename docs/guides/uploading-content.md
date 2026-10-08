---
title: "Custom Content"
sidebar_label: "Custom Content"
---

# Custom Content

Custom content (Panorama addons, models, maps) reaches players through the launcher, which downloads whatever your server advertises before the game starts. There are three steps: put the file on the server, list it in the config, and put a compressed copy somewhere players can download it from. That can be your own web host or Deadworks' free one.

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

VPKs the server mounts and clients download. On startup the server advertises the list to connecting clients and mounts each entry from `game/citadel/deadworks_mods/vpks/<name>.vpk`. The launcher puts the client's copy in `citadel/deadworks_addons/vpks/`.

### `extra_maps`

Maps cannot be mounted at runtime the way an addon can, so they are listed separately and fetched ahead of time. The server reads each one from `citadel/maps/<name>.vpk`, and the launcher downloads it to the same place under the same name before the game launches. Name only, no extension. The map the server is currently running is advertised too, so it does not have to be listed.

## Rented servers

On a server rented from Deadworks there is nothing to host or configure. Put the file on the server and list it; the files are hosted for you and `fastdl_url` is already set. Leave `fastdl_url` as it is unless you want to use a host of your own.

## Free hosting

If you have no web host of your own, Deadworks will host your files:

1. Go to `https://deadworks.net/content` and sign in.
2. Copy the URL the page shows into your config as `fastdl_url`. It is the same for every server you run.
3. Compress each `.vpk` with bzip2 (`bzip2 -k myaddon.vpk`) and upload the `.vpk.bz2`.

```jsonc
{
  "serverbrowser": {
    "content_addons": ["myaddon"],
    "fastdl_url": "https://api.deadworks.net/fastdl/u/444595d9f5ac…"
  }
}
```

Your uploads are your own. Nobody claims a name: someone else can host a `dl_harbor` of their own, and your players still get yours, saved as `dl_harbor.vpk`. Uploading a name again replaces your previous file.

- Upload again whenever the file on your server changes. Launchers check each download against the build your server runs, and warn players when the two differ.
- A compressed addon can be up to 300 MB, a compressed map up to 1 GB, and an account 3 GB in total.
- Maps that ship with the game cannot be uploaded. Players already have them.

## Hosting content yourself (fastDL)

You can serve your content from any web host instead, much like `sv_downloadurl` in Source 1, by setting `fastdl_url` to it:

```jsonc
{
  "serverbrowser": {
    "fastdl_url": "https://dl.example.com/deadworks"
  }
}
```

Each file is a bzip2 of the `.vpk`, named after its version, which is the first 16 hex digits of the file's SHA-256:

```
https://dl.example.com/deadworks/addons/myaddon_9330149c74886724.vpk.bz2
https://dl.example.com/deadworks/maps/my_map_731883278598f7be.vpk.bz2
```

You don't need to work these names out. When `fastdl_url` is set, the server logs the exact files it expects at startup and whenever the list changes. Any bzip2 tool works, including parallel ones like `pbzip2`.

A new build of an addon gets a new file name, so old and new builds can sit side by side and a file never changes once published, which makes them safe to cache indefinitely. Launchers check every download against the version the server advertises, so a stale upload is caught rather than installed quietly: players are told your download host disagrees with your server, and may be offered the choice to install it anyway.

The format servers advertise, and its limits, are specified in [Content Discovery](./content-discovery.md).

## Gotchas

- **`unlisted` and `-nomaster` are not the same.** `"unlisted": true` keeps the server out of the Deadworks server browser. It still appears in Steam's server list and still advertises its content, so players who have its address get its content as usual. `-nomaster` goes further: the server is left out of Steam's list and answers no server queries at all, so launchers cannot discover its content and players need it installed already.
- **Listing and hosting are separate steps.** Listing a name that is not on your download host gives players nothing to fetch, and a file nobody lists is never downloaded.
- **Names are lowercase.** Use only `a-z`, `0-9` and `_`. Launchers refuse anything else rather than build a file path from it.
- **Names must match.** The string in the config is the VPK's filename without `.vpk`.
