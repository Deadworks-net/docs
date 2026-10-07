---
title: "Content Discovery"
sidebar_label: "Content Discovery"
unlisted: true
---

# Content Discovery

A Deadworks server describes the addons and maps it runs in its **A2S_RULES** reply, over the game port, so a launcher can find out what to download straight from the server, with no intermediary. This page specifies that format for anyone writing a launcher or server browser. Server operators want [Uploading Content](./uploading-content.md) instead.

## Finding servers

Deadworks servers are listed in Steam's master server list for Deadlock (app 1422450) and carry the `dw1` tag. Steam's list needs a Web API key, so Deadworks proxies it:

```
GET https://api.deadworks.net/api/steam/servers?deadworks=1
```

Each server's `gametype` field is its tag string. Besides `dw1`, a server with content addons carries `dwa<digest>`, the same value as its `dw_digest` rule (below). Servers with identical addons share a digest.

A server started with `-nomaster` is not listed and answers no A2S queries at all, so nothing on this page applies to it.

The list at `GET /api/servers` predates all of this and is deprecated. See [The older server registry](#the-older-server-registry) for how the two fit together while both exist.

## Querying the rules

Send a standard A2S_RULES request to the server's game port:

```
FF FF FF FF 56 FF FF FF FF
```

A server may answer with a challenge (`FF FF FF FF 41` followed by 4 bytes); send the request again with those 4 bytes in place of the final `FF FF FF FF`. The reply is `FF FF FF FF 45`, a little-endian `uint16` rule count, then that many null-terminated key/value pairs. A Deadworks server keeps its reply inside a single datagram.

The rules are served by Steam, not by the game. A server that has not published any rules answers nothing at all, which looks exactly like a timeout: treat no reply as "does not advertise".

## The rules

| Key | Value |
|---|---|
| `dw_ver` | `1`. Ignore everything else if this is missing or different. |
| `dw_addons` | Content addons as `name[:hash:size]` entries, comma-separated, in mount order. |
| `dw_addons_n` | How many addons the server really has. |
| `dw_maps` | Maps as `name[:hash:size]` entries: the current map first, then the rest of the rotation. |
| `dw_maps_n` | How many maps the server really has. |
| `dw_digest` | 8 hex digits identifying the addon set. Empty when there are no addons. |
| `dw_fastdl` | Optional. Base URL to download content from. |

The key order in the reply means nothing.

For example:

```
dw_ver       1
dw_addons    turbo:9330149c74886724:11965
dw_addons_n  1
dw_maps      dl_midtown:faf73184b902d52d:1053579891
dw_maps_n    1
dw_digest    8a1b839d
dw_fastdl    https://dl.example.com/deadworks
```

### Entries and hashes

`hash` is the first 16 lowercase hex digits of the SHA-256 of the **uncompressed** `.vpk`, computed by the server from the file it actually loads. It is the content's version: a new build is a new hash.

`size` is that file's length in bytes, also uncompressed: the server never sees the compressed copy on the fastDL host. It lets a client weight download progress before anything arrives, and reject a file that decompresses to any other length.

An entry with neither means the server could not read that file itself, so there is nothing to check a download against. Do not download it from fastDL.

A list can be shorter than its `_n` key says. Steam answers A2S_RULES without a challenge handshake, which makes every reply a reflection amplifier, so servers cap these lists and drop whole entries from the end. When that happens, the missing entries have to come from somewhere else.

### The digest

`dw_digest` is the first 8 hex digits of the SHA-256 of the addon entries exactly as listed, each lowercased, sorted by ordinal comparison, and joined with `,`:

```
dw_addons  ware,turbo:9330149c74886724:11965
canonical  turbo:9330149c74886724:11965,ware
dw_digest  cce084bf, the first 8 hex digits of its SHA-256
```

It covers content, not just names, so two servers share a digest only when their addon files are identical.

## Downloading

Everything is a bzip2-compressed `.vpk`, fetched from:

```
{dw_fastdl}/addons/{name}_{hash}.vpk.bz2
{dw_fastdl}/maps/{name}_{hash}.vpk.bz2
```

When a server sets no `dw_fastdl`, its content is on Deadworks' hosting. If [the older registry](#the-older-server-registry) has a record of the server, install from that record. Otherwise use `https://api.deadworks.net/fastdl` as the base URL. That host keeps only the latest upload of each name, so it can serve a different build than the server runs; the hash check below is what tells you when that has happened.

Files may contain several bzip2 streams, as parallel compressors like `pbzip2` produce, so decode all of them.

### What a client must check

- **Names.** Only accept names of 1 to 64 characters from `a-z`, `0-9` and `_`, and never a Windows device name such as `con`, `nul`, `com1` or `lpt1`. Skip anything else rather than building a path from it.
- **Hashes.** After decompressing, check that the SHA-256 starts with the advertised hash and that the length equals the advertised size. A file failing either is not the build the server runs; see [When a download does not match](#when-a-download-does-not-match).
- **Size.** Cap both the download and the decompressed size, since bzip2 can expand enormously. Your own hard cap always applies. An advertised size is a tighter one only while you are holding the file to the advertised hash, so drop it if you stop, or "larger than advertised" becomes a rejection you never meant to make.
- **What you replace.** Never overwrite a file you did not install yourself. A stock map with a different hash only means the server runs another build of it.

### When a download does not match

The hash says **which build**, not **whom to trust**. One operator chooses both the hash their server advertises and the host it points at, so an operator serving something they should not simply advertises a hash that matches it, and the check passes. Treat it as a version check, never as authentication.

What a mismatch does tell you is that the host is out of sync with the server, nearly always a `dw_fastdl` upload that was never refreshed. The file is still what that operator published. It is just an older build than the one the server loaded, so models, textures or geometry can differ from what everyone else in the match sees.

A client may install a mismatched file, but not silently:

- **Try another source first**, where you have one that covers the same content, such as [the older registry's record](#the-older-server-registry), before putting anything to the player.
- **Ask, and let them decline.** Say that the server's content and its download host disagree, that some custom content may be missing or broken, and that the server operator is the one who can fix it.
- **Keep the checks that were never about trust.** A decompression bomb, or a payload that is not a VPK at all, stays a hard failure whatever the player chose.
- **Do not record it as the advertised build.** Check again on the next join. That costs a re-download for as long as the host stays stale, and it is what lets the client pick the right file up by itself the moment the operator fixes it.

## The older server registry

Before servers advertised their own content, the Deadworks API was the only source. Servers registered with it and sent heartbeats, launchers listed them from `GET /api/servers`, and read what to download from `GET /api/servers/{id}/content`. That registry is **deprecated**. It still works, and servers still register with it by default, so existing launchers and servers carry on unchanged. It will be removed in a later release.

A client that supports both decides per server:

| The server advertises | The registry has a record | Install from |
| --- | --- | --- |
| a `dw_fastdl` of its own | either | the advertisement |
| content, but no `dw_fastdl` | yes | the registry's record |
| content, but no `dw_fastdl` | no | the advertisement, fetched from `https://api.deadworks.net/fastdl` |
| nothing | yes | the registry's record |

Setting `dw_fastdl` is how a server takes over from the registry. A server that sets none still keeps its content on Deadworks' hosting, and the registry's record is the list that matches what is stored there. Fetching the same file by its advertised hash would only reject it whenever the upload is older than the build the server runs.

Registry items are versioned by an upload counter, not a hash, so they cannot be checked against the server.

If installing from an advertisement fails, the registry's record can stand in only when it names everything the server advertised, apart from maps the player already has. A server that hosts its own content usually has nothing uploaded, and falling back to an empty record would let the player join with no content and no explanation.

## Where content goes

| Kind | Install path |
|---|---|
| Addon | `citadel/deadworks_addons/vpks/<name>.vpk` |
| Map | `citadel/maps/<name>.vpk` |

The game is told which addons to mount when it connects, by name, so an addon has to be installed under exactly that name.

### The UI bootstrap

Deadworks' Panorama UI needs one more addon that no server advertises: a bootstrap VPK, installed once at `citadel/deadworks_mods/pak01_dir.vpk`. Panorama starts before anything can be mounted at runtime, so the bootstrap has to be on a search path before the game launches, and it can only be replaced while the game is closed. Its manifest gives the download URL and the SHA-256 of the decompressed VPK to check it against:

```
GET https://api.deadworks.net/api/bootstrap
```

### gameinfo.gi

Both locations have to be declared in the `FileSystem` → `SearchPaths` block of `citadel/gameinfo.gi`, above the first `Game` entry:

```
Game        citadel/deadworks_mods
addonroot   citadel/deadworks_addons
```

A `Game` path placed ahead of vanilla's also moves `MOD` and `DEFAULT_WRITE_PATH`, so add `Mod citadel` and `Write citadel` too when the file does not already declare them.

- A `gameinfo.gi` holds only one `addonroot`, so every launcher must use this value or they will undo each other.
- Deadlock Mod Manager rewrites the whole `SearchPaths` block each time it launches the game, and Steam's file verification restores the original, so check the entries before every launch rather than once.
- Keep your paths away from `citadel/addons`: Deadlock Mod Manager treats any path starting with it as one of its own profiles.
