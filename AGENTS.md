# AGENTS.md

Instructions for agents (and people) editing the Deadworks docs.

## Repo

- `docs/` holds the hand-written pages: `getting-started/`, `features/`, `guides/`, `index.md`.
- `docs/api-reference/` is generated. Don't edit it. Change the Deadworks source, or `api/notes/<Type>.md`, then regenerate:

  ```text
  dotnet run --project tools/api-extract -c Release -- <deadworks repo> <commit> api/api.json
  bun scripts/gen-api.ts
  ```

- `bun run dev` serves the site at http://localhost:3000. `bun run build` must finish without broken-link warnings.
- Renaming a heading changes its anchor. Search for `#<old-anchor>` links before you reword one.

## Voice and style

The docs follow the voice of the [Valve Developer Community wiki](https://developer.valvesoftware.com/wiki/), adapted for a task-oriented docs site. The wiki examples quoted below were collected from search excerpts of wiki pages (the wiki blocks automated reading), so treat them as near-verbatim.

### Voice

| Trait | Rule | Wiki example |
|---|---|---|
| Person | Reference text is third person about the subject. Steps are imperative, addressed to "you". | "point_servercommand is a logical entity available in all Source games." |
| Tense | Simple present. No "will" for normal behavior. | "Fired when the relay is triggered." |
| Mood | Declarative for facts, imperative for steps. | "Please use force_install_dir before logon." |
| Register | Plain and technical. No slang, marketing or exclamation marks. | "Its primary use is to install and update various dedicated servers available on Steam using a command-line interface." |
| Directness | Requirements are requirements: "must", not "you may want to". | "you must generate and include the Game Server Login Token (GSLT)" |
| Humor | None. | |
| Hedging | None. Verify a claim or cut it. | |
| Reasons | A restriction comes with its reason, in one clause. | "Due to high risk of abuse, the entity is controlled by the sv_allow_point_servercommand console variable." |

### Sentences

1. **Short declaratives, one fact each.** Aim for 8 to 20 words. Two facts are two sentences.
2. **Definitions lead with the name, then what kind of thing it is, then what it's for.** "A command runs a method in your plugin when someone types its name in chat or the console."
3. **Table cells and list items are fragments that start with a verb**, with no subject: "Reloads the permission files", not "This command reloads the permission files".
4. **Syntax first, then meaning.** Required arguments go in `<angle brackets>`, optional ones in `[square brackets]`: `dw_role_grant <player> <role> [--temp]`.
5. **Follow syntax with a real, runnable example** using realistic values: `dw_role_grant "Big Dave" admin`.
6. **List each value of a setting or enum with its effect.**
7. **State defaults as plain facts**: "Defaults to `90`." "`0` keeps them forever."
8. **State consequences, not feelings.** Say what happens to the server, the files or the players.
9. **Contractions are fine**: "can't", "don't", "isn't".
10. **Code style** for every command, cvar, launch option, file, path, JSON key, permission, type, member and literal value, spelled exactly as typed.
11. **Bold** at most one key term in a sentence. Never bold a whole sentence.
12. **Numbers as digits**, with units: `3` seconds, `90` days, slot `3`.

### Notes, tips and warnings

The wiki puts caveats in labeled boxes, not in the middle of paragraphs. Use Docusaurus admonitions:

| Wiki template | Admonition | Use for |
|---|---|---|
| `{{note}}` | `:::note` | A fact the reader needs that doesn't fit the flow |
| `{{tip}}` | `:::tip` | A better way to do something |
| `{{warning}}` | `:::warning` | A mistake that breaks something |
| (none) | `:::danger` | Anything that can lock players out or expose a public server |
| `{{bug}}` | `:::info` | A known issue |

Write the box as **fact, consequence, what to do instead**, in one or two sentences. Give it a title only when the title is the rule (`:::warning Don't use async void`). Never ship a `{{confirm}}` or `{{todo}}`: verify the claim or cut it.

### Pages

**Feature and guide pages** (task-oriented):

1. Open with one sentence saying what the subject is or what the page does. Don't repeat the title ("This page explains…").
2. State requirements up front.
3. Use task headings in sentence case: "Add a command", "Pick players".
4. Give numbered steps, each an imperative followed by its command or code block.
5. Put troubleshooting and failure modes after the steps.
6. End with `## See also` or `## Next`: links, each with at most one clause.

**Reference sections** (files, settings, commands): use noun headings ("Files", "Console commands"), a table with `Syntax`/`Field`, `Default` where one exists, and a description fragment.

**Series** keep their banner ("**Step 1 of 4** in …") and "Next" link.

### Terminology

- Use one word for one thing: *server console* (the dedicated server's console and RCON), *game console* (a player's console), *chat command* (`!name` / `/name`), *console command* (`dw_name`), *cvar*, *plugin*, *role*, *permission*, *immunity*, *penalty* (a ban, gag or mute).
- Commands *run*. Cvars are *set*. Events and outputs *fire*. Plugins *load* and *unload*.
- Spell out a term the first time, then use the short form: "Remote Console (RCON)".
- Keep Valve's spellings: SteamID64, `STEAM_0:1:11101`, `[U:1:22203]`, RCON, Deadlock, Source 2.
- Headings use sentence case: "Check that it worked", not "Check That It Worked".

### Avoid

- Marketing words: "powerful", "seamless", "simply", "just", "easily".
- Reassurance and feelings: "Don't worry", "you'll love", "It only takes a minute".
- Hedges: "should", "probably", "might want to", "basically".
- Future tense for normal behavior, and the passive when the actor is obvious.
- Preambles. The first sentence is already the definition.
- Summary paragraphs at the end. Link onward instead.

### Reviewer checklist

Run on every sentence:

1. Does the page or section open with what the subject is, in one sentence?
2. Is it simple present and active, with no "will" for normal behavior?
3. Does it make one claim? If it makes two, split it.
4. Is every command, cvar, file, path, key, permission and value in backticks, spelled exactly as typed?
5. Is syntax shown with `<required>` and `[optional]`, then a real example?
6. Is the default stated wherever a value is configurable?
7. Does each restriction give its reason in one clause?
8. Is each caveat that changes what the reader does in an admonition, as fact, consequence, fix?
9. Is it free of marketing words, reassurance, humor and hedges?
10. Is each term used with one meaning, with abbreviations spelled out on first use?
11. Do table cells start with a verb, with no "This command…"?
12. Is bold limited to one key term?
13. Is the heading in sentence case, task-shaped on guides and noun-shaped on reference sections?
14. Does the page end with See also or Next links, not a summary?
