# m2-room-server proofs

**HEAD**: fe7ee0f
**Tree**: clean
**Result**: 97 pass, 0 fail; mutations 3 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `npx vitest run packages/server/test/worker.test.ts -t "creates a room with a 4-letter code and a TV token"` | 1 | 1 | pass |
| C2 | `npx vitest run packages/core/src/room/codes.test.ts -t "draws again until a code is free"` | 1 | 1 | pass |
| C3 | `npx vitest run packages/core/src/room/machine.test.ts -t "sends the full state to a TV with the room token"` | 2 | 2 | pass |
| C4 | `npx vitest run packages/core/src/room/machine.test.ts -t "rejects a TV with a wrong token"` | 1 | 1 | pass |
| C5 | `npx vitest run packages/core/src/room/machine.test.ts -t "a new TV connection replaces the old one"` | 1 | 1 | pass |
| C6 | `npx vitest run packages/core/src/room/join.test.ts -t "registers a player, returns a token and announces the j` | 1 | 1 | pass |
| C7 | `npx vitest run packages/core/src/room/join.test.ts -t "accepts 2 to 12 characters after trimming"` | 1 | 1 | pass |
| C8 | `npx vitest run packages/core/src/room/join.test.ts -t "rejects a nickname equal ignoring case and accents"` | 1 | 1 | pass |
| C9 | `npx vitest run packages/core/src/room/join.test.ts -t "rejects a color that is not #RRGGBB"` | 1 | 1 | pass |
| C10 | `npx vitest run packages/core/src/room/join.test.ts -t "rejects a color below 3:1 on the TV background"` | 1 | 1 | pass |
| C11 | `npx vitest run packages/core/src/room/join.test.ts -t "rejects a color closer than 20 to another player"` | 1 | 1 | pass |
| C12 | `npx vitest run packages/core/src/room/join.test.ts -t "rejects the 11th player with room-full"` | 1 | 1 | pass |
| C13 | `npx vitest run packages/core/src/room/round.test.ts -t "turns spectators into players at the next countdown"` | 1 | 1 | pass |
| C14 | `npx vitest run packages/core/src/room/join.test.ts -t "joins as a spectator during countdown, round and result` | 3 | 3 | pass |
| C15 | `npx vitest run packages/server/test/worker.test.ts -t "answers room-not-found for a code without a room"` | 3 | 3 | pass |
| C17 | `npx vitest run packages/core/src/room/colors.test.ts -t "palette has 10 legible colors at least 20 apart"` | 1 | 1 | pass |
| C18 | `npx vitest run packages/core/src/room/host.test.ts -t "makes the first player the host"` | 1 | 1 | pass |
| C19 | `npx vitest run packages/core/src/room/host.test.ts -t "keeps exactly one host through every change"` | 1 | 1 | pass |
| C20 | `npx vitest run packages/core/src/room/host.test.ts -t "transfers the host role and announces it"` | 1 | 1 | pass |
| C21 | `npx vitest run packages/core/src/room/host.test.ts -t "rejects every host command from a non-host"` | 8 | 8 | pass |
| C22 | `npx vitest run packages/core/src/room/deadlines.test.ts -t "hands the host role over after 30 s offline"` | 3 | 3 | pass |
| C23 | `npx vitest run packages/core/src/room/deadlines.test.ts -t "gives the host role to the first player who reconn` | 2 | 2 | pass |
| C24 | `npx vitest run packages/core/src/room/deadlines.test.ts -t "keeps a host who reconnects within 30 s"` | 1 | 1 | pass |
| C25 | `npx vitest run packages/core/src/room/host.test.ts -t "kick removes the player and closes with kicked"` | 1 | 1 | pass |
| C26 | `npx vitest run packages/core/src/room/host.test.ts -t "a kicked player joins again as a new player"` | 1 | 1 | pass |
| C27 | `npx vitest run packages/core/src/room/host.test.ts -t "rejects a host kicking themself"` | 1 | 1 | pass |
| C31 | `npx vitest run packages/core/src/room/state.test.ts -t "creates rooms with the default settings"` | 1 | 1 | pass |
| C32 | `npx vitest run packages/core/src/room/settings.test.ts -t "applies a valid change in the lobby and broadcasts ` | 1 | 1 | pass |
| C33 | `npx vitest run packages/core/src/room/state.test.ts -t "rejects out-of-range settings"` | 18 | 18 | pass |
| C34 | `npx vitest run packages/core/src/room/settings.test.ts -t "rejects settings changes outside the lobby"` | 3 | 3 | pass |
| C35 | `npx vitest run packages/core/src/room/state.test.ts -t "accepts volume 0-100 and a boolean mute only"` | 11 | 11 | pass |
| C36 | `npx vitest run packages/core/src/room/round.test.ts -t "start sends the board and the round timestamps"` | 3 | 3 | pass |
| C37 | `npx vitest run packages/core/src/room/round.test.ts -t "phones get the salt and hash prefixes, never words"` | 1 | 1 | pass |
| C38 | `npx vitest run packages/core/src/room/submit.test.ts -t "validates a batch in order and answers once"` | 1 | 1 | pass |
| C39 | `npx vitest run packages/core/src/room/submit.test.ts -t "accepts paths only between startsAt and endsAt \+ 300` | 4 | 4 | pass |
| C40 | `npx vitest run packages/core/src/room/submit.test.ts -t "rejects paths from spectators"` | 1 | 1 | pass |
| C41 | `npx vitest run packages/core/src/room/submit.test.ts -t "rate-limits beyond 10 paths per second"` | 2 | 2 | pass |
| C42 | `npx vitest run packages/core/src/room/counts.test.ts -t "sends tv counts at most once per second when changed"` | 1 | 1 | pass |
| C43 | `npx vitest run packages/core/src/room/results.test.ts -t "sends the final counts before the results"` | 1 | 1 | pass |
| C44 | `npx vitest run packages/core/src/room/results.test.ts -t "orders shared words and players as specified"` | 2 | 2 | pass |
| C45 | `npx vitest run packages/core/src/room/results.test.ts -t "attaches real spellings only when they differ"` | 1 | 1 | pass |
| C46 | `npx vitest run packages/core/src/room/results.test.ts -t "includes the longest word with its path and finders"` | 1 | 1 | pass |
| C47 | `npx vitest run packages/core/src/room/machine.test.ts -t "answers a clock sync with both timestamps"` | 1 | 1 | pass |
| C48 | `npx vitest run packages/server/test/alarms.test.ts -t "ends the round on the alarm with no socket open"` | 1 | 1 | pass |
| C28 | `npx vitest run packages/core/src/room/results.test.ts -t "prepares the next board when rounds remain"` | 1 | 1 | pass |
| C49 | `npx vitest run packages/core/src/room/flow.test.ts -t "next starts the countdown with the prepared board"` | 1 | 1 | pass |
| C50 | `npx vitest run packages/core/src/room/flow.test.ts -t "next after the last round sends the podium"` | 1 | 1 | pass |
| C51 | `npx vitest run packages/core/src/room/flow.test.ts -t "play-again starts a new match with zeroed scores"` | 2 | 2 | pass |
| C52 | `npx vitest run packages/core/src/room/flow.test.ts -t "close-room closes with closed-by-host"` | 1 | 1 | pass |
| C53 | `npx vitest run packages/core/src/room/flow.test.ts -t "rejects flow commands outside their phase"` | 10 | 10 | pass |
| C54 | `npx vitest run packages/server/test/persistence.test.ts -t "stores the state before the client sees it"` | 1 | 1 | pass |
| C55 | `npx vitest run packages/server/test/persistence.test.ts -t "rebuilds a room mid-round after eviction"` | 1 | 1 | pass |
| C94 | `npx vitest run packages/server/test/persistence.test.ts -t "marks players and the TV disconnected when their s` | 1 | 1 | pass |
| C56 | `npx vitest run packages/server/test/persistence.test.ts -t "keeps sockets open across hibernation"` | 1 | 1 | pass |
| C57 | `npx vitest run packages/server/test/alarms.test.ts -t "schedules every deadline on the durable object alarm"` | 1 | 1 | pass |
| C58 | `npx vitest run packages/server/test/room-do.test.ts -t "answers ping with pong through the auto-response"` | 1 | 1 | pass |
| C59 | `npx vitest run packages/core/src/room/machine.test.ts -t "sends the full state to a returning player"` | 1 | 1 | pass |
| C60 | `npx vitest run packages/core/src/room/machine.test.ts -t "rejects an unknown player token"` | 1 | 1 | pass |
| C61 | `npx vitest run packages/core/src/room/machine.test.ts -t "marks a closed player disconnected and keeps their d` | 1 | 1 | pass |
| C62 | `npx vitest run packages/core/src/room/machine.test.ts -t "a new player connection replaces the old one"` | 1 | 1 | pass |
| C63 | `npx vitest run packages/core/src/room/deadlines.test.ts -t "keeps the round running while the TV is gone"` | 1 | 1 | pass |
| C64 | `npx vitest run packages/server/test/config.test.ts -t "reads both timeouts with defaults 30 and 10"` | 1 | 1 | pass |
| C67 | `npx vitest run packages/core/src/room/deadlines.test.ts -t "closes an idle room"` | 2 | 2 | pass |
| C68 | `npx vitest run packages/core/src/room/deadlines.test.ts -t "closes a room whose TV is gone"` | 2 | 2 | pass |
| C69 | `npx vitest run packages/core/src/room/deadlines.test.ts -t "never closes when a timeout is 0"` | 2 | 2 | pass |
| C66 | `npx vitest run packages/server/test/alarms.test.ts -t "closing notifies, closes sockets, wipes storage and fre` | 1 | 1 | pass |
| C65 | `npx vitest run packages/server/test/config.test.ts -t "falls back to the default for invalid values"` | 4 | 4 | pass |
| C70 | `npx vitest run packages/core/src/room/protocol.test.ts -t "exports every message type, error code and reason"` | 1 | 1 | pass |
| C71 | `npx vitest run packages/core/src/room/protocol.test.ts -t "rejects malformed messages"` | 14 | 14 | pass |
| C72 | `npx vitest run packages/core/src/room/protocol.test.ts -t "rejects messages over 4096 bytes before parsing"` | 2 | 2 | pass |
| C73 | `npx vitest run packages/core/src/room/machine.test.ts -t "rejects every command outside its phase"` | 4 | 4 | pass |
| C74 | `npx vitest run packages/core/src/room/protocol.test.ts -t "uses only the English protocol names"` | 1 | 1 | pass |
| C16 | `npx vitest run packages/server/test/match.test.ts -t "never sends round words to phones before the results"` | 1 | 1 | pass |
| C75 | `npx vitest run packages/core/src/room/results.test.ts -t "a word found by two players is shared"` | 1 | 1 | pass |
| C76 | `npx vitest run packages/core/src/room/submit.test.ts -t "rejects a word the player already found"` | 1 | 1 | pass |
| C77 | `npx vitest run packages/core/src/room/machine.test.ts -t "sends codes, never display text"` | 1 | 1 | pass |
| C78 | `npx vitest run packages/core/src/room/results.test.ts -t "leaves a player kicked mid-round out of the results"` | 1 | 1 | pass |
| C79 | `npx vitest run packages/core/src/room/machine.test.ts -t "keeps a disconnected lobby player listed"` | 1 | 1 | pass |
| C80 | `npx vitest run packages/core/src/room/codes.test.ts -t "draws codes only from the unambiguous alphabet"` | 1 | 1 | pass |
| C81 | `npx vitest run packages/server/test/match.test.ts -t "plays a 2-round match with a TV and 3 phones"` | 1 | 1 | pass |
| C82 | `npx vitest run packages/core/src/room/results.test.ts -t "has no longest word when the board has no solution"` | 1 | 1 | pass |
| C84 | `npx vitest run packages/core/src/room/flow.test.ts -t "back-to-lobby cancels the match and returns to the lobb` | 4 | 4 | pass |
| C85 | `npx vitest run packages/core/src/room/flow.test.ts -t "awards a win to every top scorer at the podium"` | 1 | 1 | pass |
| C86 | `npx vitest run packages/core/src/room/flow.test.ts -t "awards no win when the top score is 0"` | 1 | 1 | pass |
| C87 | `npx vitest run packages/core/src/room/flow.test.ts -t "awards no win to a cancelled match"` | 3 | 3 | pass |
| C88 | `npx vitest run packages/core/src/room/wins.test.ts -t "lists every player's wins to the TV and phones"` | 1 | 1 | pass |
| C89 | `npx vitest run packages/core/src/room/flow.test.ts -t "keeps wins when scores reset"` | 2 | 2 | pass |
| C90 | `npx vitest run packages/core/src/room/wins.test.ts -t "crowns every player with the most wins and nobody at 0"` | 6 | 6 | pass |
| C91 | `npx vitest run packages/server/test/persistence.test.ts -t "keeps wins across reconnection and eviction"` | 1 | 1 | pass |
| C92 | `npx vitest run packages/core/src/room/flow.test.ts -t "kick discards the player's wins"` | 1 | 1 | pass |
| C93 | `npx vitest run packages/server/e2e/assets.test.ts -t "answers 404 to any language pack file over HTTP"` | 5 | 5 | pass |
| C95 | `npx vitest run packages/core/src/room/results.test.ts -t "sends the players list with the new scores after the` | 1 | 1 | pass |
| C96 | `npx vitest run packages/core/src/room/flow.test.ts -t "sends the updated players list after the results and th` | 1 | 1 | pass |
| C83 | `npx vitest run packages/server/test/alarms.test.ts -t "ends the round on the alarm with no socket open"` | 1 | 1 | pass |
| Build | `npx tsc -b` | - | - | pass |
| Build | `npx vitest run` | - | - | pass |
| Build | `npx playwright test` | - | - | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| player view leaks each player's round words in players and welcome | `packages\core\src\room\effects.ts:94` | yes |
| rebuilt room keeps players whose sockets died marked connected | `packages\server\src\room-do.ts:39` | yes |
| static assets served before the Worker (pack public over HTTP) | `packages\server\wrangler.jsonc:9` | yes |
