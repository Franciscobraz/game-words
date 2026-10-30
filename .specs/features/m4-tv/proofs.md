# m4-tv proofs

**HEAD**: 7ddb1bb
**Tree**: clean
**Result**: 111 pass, 4 fail; mutations 0 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `npx vitest run packages/core/src/room/results.test.ts -t "lists who found each shared word"` | 2 | 2 | pass |
| C2 | `npx vitest run packages/core/src/room/results.test.ts -t "counts the possible words with the room minimum and ` | 1 | 1 | pass |
| C3 | `npx vitest run packages/core/src/room/results.test.ts -t "sends finders and possible words only in the results` | 1 | 1 | pass |
| C4 | `npx vitest run packages/core/src/room/flow.test.ts -t "ends the match when the last round ends"` | 2 | 2 | pass |
| C5 | `npx vitest run packages/core/src/room/machine.test.ts -t "sends the last results and the podium after the welc` | 2 | 2 | pass |
| C6 | `npx vitest run packages/core/src/room/machine.test.ts -t "refuses next on the podium"` | 1 | 1 | pass |
| C7 | `npx vitest run packages/core/src/room/flow.test.ts -t "counts the wins when the last round ends"` | 1 | 1 | pass |
| C8 | `npx vitest run packages/core/src/room/settings.test.ts -t "refuses fast mode as an unknown setting"` | 1 | 1 | pass |
| C9 | `npx vitest run packages/core/src/room/settings.test.ts -t "drops fast mode from stored settings"` | 1 | 1 | pass |
| C10 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "has no fa` | 1 | - | pass |
| C11 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "opens the pod` | 1 | - | pass |
| C12 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "never offers` | 1 | - | pass |
| C13 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "next round b` | 1 | - | pass |
| C14 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "host buttons ` | 1 | - | pass |
| C15 | `npx vitest run packages/server/e2e/assets.test.ts -t "serves the tv at /tv"` | 1 | 1 | pass |
| C16 | `npx vitest run packages/server/e2e/assets.test.ts -t "serves the phone at the root and at a room code"` | 1 | 1 | pass |
| C17 | `npx vitest run packages/server/e2e/assets.test.ts -t "serves the client files"` | 1 | 1 | pass |
| C18 | `npx vitest run packages/server/e2e/assets.test.ts -t "never serves the language pack"` | 1 | 1 | pass |
| C19 | `npx vitest run packages/server/test/worker.test.ts -t "keeps the room api routes"` | 1 | 1 | pass |
| C20 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "loads nothing from ` | 1 | - | pass |
| C21 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "scales the root fon` | 1 | - | pass |
| C22 | `npx vitest run packages/tv/src/state/room.test.ts -t "creates a room when there is no token"` | 1 | 1 | pass |
| C23 | `npx vitest run packages/tv/src/state/room.test.ts -t "resumes the room of a saved token"` | 1 | 1 | pass |
| C24 | `npx vitest run packages/tv/src/state/room.test.ts -t "creates a new room when the token is refused"` | 2 | 2 | pass |
| C25 | `npx vitest run packages/tv/src/state/room.test.ts -t "sends the token only in the hello"` | 1 | 1 | pass |
| C26 | `npx vitest run packages/tv/src/state/room.test.ts -t "retries every 5 seconds when the room cannot be created"` | 1 | 1 | pass |
| C27 | `npx vitest run packages/tv/src/model/lobby-rows.test.ts -t "lists the players with the count"` | 1 | 1 | pass |
| C28 | `npx vitest run packages/tv/src/model/lobby-rows.test.ts -t "marks a disconnected player"` | 1 | 1 | pass |
| C29 | `npx vitest run packages/tv/src/model/lobby-rows.test.ts -t "tags the host and crowns the leaders"` | 1 | 1 | pass |
| C30 | `npx vitest run packages/tv/src/model/lobby-rows.test.ts -t "fills the free slots up to ten"` | 1 | 1 | pass |
| C31 | `npx vitest run packages/tv/src/model/settings-chips.test.ts -t "finds the chip of the changed setting"` | 1 | 1 | pass |
| C32 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "the qr code reads th` | 1 | - | pass |
| C33 | `browser captures/tv-lobby.running.png` | - | - | **not judged** (screens.md) |
| C34 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "shows the code and t` | 1 | - | pass |
| C35 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "mirrors a settings c` | 1 | - | pass |
| C36 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "waits for the host i` | 1 | - | pass |
| C37 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "shows the empty lobb` | 1 | - | pass |
| C38 | `npx vitest run packages/tv/src/model/clock.test.ts -t "formats the clock as minutes and seconds"` | 1 | 1 | pass |
| C39 | `npx vitest run packages/tv/src/model/clock.test.ts -t "alerts from ten seconds down"` | 1 | 1 | pass |
| C40 | `npx vitest run packages/tv/src/model/clock.test.ts -t "counts down to the start"` | 1 | 1 | pass |
| C41 | `npx vitest run packages/tv/src/model/round-columns.test.ts -t "says word in the singular for one"` | 1 | 1 | pass |
| C42 | `npx vitest run packages/tv/src/model/round-columns.test.ts -t "leaves the spectators out"` | 1 | 1 | pass |
| C43 | `npx vitest run packages/tv/src/model/round-columns.test.ts -t "moves the sixth player to the right column"` | 1 | 1 | pass |
| C44 | `npx vitest run packages/tv/src/model/round-columns.test.ts -t "marks a disconnected player"` | 1 | 1 | pass |
| C45 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/round.spec.ts -g "hides the board duri` | 1 | - | pass |
| C46 | `browser captures/tv-round.running.png` | - | - | **not judged** (screens.md) |
| C47 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/round.spec.ts -g "updates the word cou` | 1 | - | pass |
| C48 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/round.spec.ts -g "fits larger boards i` | 1 | - | pass |
| C49 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/round.spec.ts -g "marks the end of the` | 1 | - | pass |
| C50 | `npx vitest run packages/tv/src/model/reveal.test.ts -t "starts the words two seconds after the end"` | 1 | 1 | pass |
| C51 | `npx vitest run packages/tv/src/model/reveal.test.ts -t "scrolls two words per second"` | 1 | 1 | pass |
| C52 | `npx vitest run packages/tv/src/model/reveal.test.ts -t "never scrolls for more than sixty seconds"` | 1 | 1 | pass |
| C53 | `npx vitest run packages/tv/src/model/reveal.test.ts -t "holds for five seconds after the last word"` | 1 | 1 | pass |
| C54 | `npx vitest run packages/tv/src/model/reveal.test.ts -t "waits five seconds when no word was found"` | 1 | 1 | pass |
| C55 | `npx vitest run packages/tv/src/model/word-rows.test.ts -t "lists shared words before unique words"` | 1 | 1 | pass |
| C56 | `npx vitest run packages/tv/src/model/word-rows.test.ts -t "orders each group by length and then by letter"` | 1 | 1 | pass |
| C57 | `npx vitest run packages/tv/src/model/word-rows.test.ts -t "fills each row with spellings finders and points"` | 1 | 1 | pass |
| C58 | `npx vitest run packages/tv/src/model/word-rows.test.ts -t "keeps the words of a kicked player"` | 1 | 1 | pass |
| C59 | `browser captures/tv-words.running.png` | - | - | **not judged** (screens.md) |
| C60 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "keeps the totals in ` | 1 | - | pass |
| C61 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "scrolls until the la` | 1 | - | pass |
| C62 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "says when no word wa` | 1 | - | pass |
| C63 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "follows the host dur` | 1 | - | pass |
| C64 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "restarts the scroll ` | 1 | - | pass |
| C65 | `npx vitest run packages/tv/src/model/standings.test.ts -t "puts up to three players on top"` | 1 | 1 | pass |
| C66 | `npx vitest run packages/tv/src/model/standings.test.ts -t "lists the others from the fourth player"` | 1 | 1 | pass |
| C67 | `npx vitest run packages/tv/src/model/standings.test.ts -t "shares places on a tie and keeps late players last"` | 1 | 1 | pass |
| C68 | `npx vitest run packages/tv/src/model/result-header.test.ts -t "shows the round between rounds"` | 1 | 1 | pass |
| C69 | `npx vitest run packages/tv/src/model/result-header.test.ts -t "shows the winner after the last round"` | 1 | 1 | pass |
| C70 | `npx vitest run packages/tv/src/model/result-header.test.ts -t "shows a tie after the last round"` | 1 | 1 | pass |
| C71 | `npx vitest run packages/tv/src/model/lit-tiles.test.ts -t "lights one tile every 400 ms in path order"` | 1 | 1 | pass |
| C72 | `browser captures/tv-round-result.running.png` | - | - | **not judged** (screens.md) |
| C73 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "marks a disconnecte` | 1 | - | pass |
| C74 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "shows who found the` | 1 | - | pass |
| C75 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "says when nobody fo` | 1 | - | pass |
| C76 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "hides the card when` | 1 | - | pass |
| C77 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "the small qr code r` | 1 | - | pass |
| C78 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "follows the host ou` | 1 | - | pass |
| C79 | `npx vitest run packages/tv/src/state/room.test.ts -t "opens a new room when the host closes it"` | 1 | 1 | pass |
| C80 | `npx vitest run packages/tv/src/state/room.test.ts -t "waits on the expired screen without creating a room"` | 2 | 2 | pass |
| C81 | `npx vitest run packages/tv/src/state/room.test.ts -t "opens a new room when asked on the expired screen"` | 2 | 2 | pass |
| C82 | `npx vitest run packages/tv/src/state/room.test.ts -t "stops reconnecting when replaced"` | 1 | 1 | pass |
| C83 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/exit.spec.ts -g "shows the expired and` | 1 | - | pass |
| C84 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "keeps the scree` | 1 | - | pass |
| C85 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "shows no connec` | 1 | - | pass |
| C86 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "removes the ban` | 1 | - | pass |
| C87 | `npx vitest run packages/tv/src/model/audio-cues.test.ts -t "plays each cue once"` | 3 | 3 | pass |
| C88 | `npx vitest run packages/tv/src/model/audio-cues.test.ts -t "whistles when the time is up"` | 1 | 1 | pass |
| C89 | `npx vitest run packages/tv/src/device/audio.test.ts -t "follows the room volume and mute"` | 4 | 4 | pass |
| C90 | `npx vitest run packages/tv/src/device/audio.test.ts -t "unlocks a suspended context"` | 1 | 1 | pass |
| C91 | `npx vitest run packages/tv/src/device/audio.test.ts -t "does nothing without web audio"` | 1 | 1 | pass |
| C92 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "asks to unlock the s` | 1 | - | pass |
| C93 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "fits every screen f` | 1 | - | pass |
| C94 | `npx vitest run packages/tv/src/styles/audit.test.ts -t "uses only flexbox and margins"` | 1 | 1 | pass |
| C95 | `npx vitest run packages/tv/src/styles/audit.test.ts -t "animates only transform and opacity"` | 1 | 1 | pass |
| C96 | `npx vitest run packages/tv/src/styles/audit.test.ts -t "has no literal colors"` | 1 | 1 | pass |
| C97 | `npx vitest run packages/tv/src/strings/pt-BR.test.ts -t "has a neutral text for every code"` | 1 | 1 | pass |
| C98 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "has none of the dec` | 1 | - | pass |
| C99 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "shows a twelve lett` | 1 | - | pass |
| C100 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "fits ten players on` | 1 | - | pass |
| C101 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "shows a single card` | 1 | - | pass |
| C102 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "keeps the circles i` | 1 | - | pass |
| C103 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "shows the right` | 1 | - | pass |
| C104 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/full-match.spec.ts -g "plays a whole m` | 1 | - | pass |
| C105 | `walk - cada foto de captures/uncaptured/ mostrada ao user, com a resposta dele em **Settled mid-build:**; defa` | - | - | pass (Walked) |
| C106 | `npx vitest run packages/tv/src/model/reconnect.test.ts -t "waits longer after each attempt up to one minute"` | 1 | 1 | pass |
| C107 | `npx vitest run packages/tv/src/model/reconnect.test.ts -t "stops trying after ten minutes"` | 1 | 1 | pass |
| C108 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "tries again aft` | 2 | - | pass |
| Build | `npx tsc -b` | - | - | pass |
| Build | `npm run lint -w @bwords/phone` | - | - | pass |
| Build | `npm run lint -w @bwords/tv` | - | - | pass |
| Build | `npx vitest run` | - | - | pass |
| Build | `npx playwright test` | - | - | pass |
| Build | `npx playwright test -c packages/phone/playwright.config.ts` | - | - | pass |
| Build | `npx playwright test -c packages/tv/playwright.config.ts` | - | - | pass |
