# m3-phone proofs

**HEAD**: 5c3cff3
**Tree**: clean
**Result**: 117 pass, 12 fail; mutations 0 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `browser captures/phone-join.running.png` | - | - | **not judged** (screens.md) |
| C2 | `browser captures/phone-code.running.png` | - | - | **not judged** (screens.md) |
| C3 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/entry.spec.ts -g "uppercases a t` | 1 | - | pass |
| C4 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/entry.spec.ts -g "continue with ` | 1 | - | pass |
| C5 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/entry.spec.ts -g "shows room not` | 1 | - | pass |
| C6 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "returns straigh` | 1 | - | pass |
| C7 | `npx vitest run packages/phone/src/state/room.test.ts -t "drops the saved token on bad-token and shows the join` | 1 | 1 | pass |
| C8 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "counts nickname` | 1 | - | pass |
| C9 | `npx vitest run packages/phone/src/model/colors.test.ts -t "lists the ten palette colors and a custom slot"` | 1 | 1 | pass |
| C10 | `npx vitest run packages/phone/src/model/colors.test.ts -t "locks a color owned by another player with the owne` | 1 | 1 | pass |
| C11 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "updates the TV ` | 1 | - | pass |
| C12 | `npx vitest run packages/phone/src/state/room.test.ts -t "sends join with the trimmed nickname and the color"` | 1 | 1 | pass |
| C13 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "shows the nickn` | 1 | - | pass |
| C14 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "shows nickname ` | 1 | - | pass |
| C15 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "names the playe` | 1 | - | pass |
| C16 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "says the color ` | 1 | - | pass |
| C17 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "says the room i` | 1 | - | pass |
| C18 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "saves the token` | 1 | - | pass |
| C19 | `browser captures/phone-lobby.running.png` | - | - | **not judged** (screens.md) |
| C20 | `npx vitest run packages/phone/src/model/players.test.ts -t "crowns the players with the most wins and nobody a` | 1 | 1 | pass |
| C21 | `npx vitest run packages/phone/src/model/players.test.ts -t "tags the host and the player themselves"` | 1 | 1 | pass |
| C22 | `npx vitest run packages/phone/src/model/players.test.ts -t "dims disconnected players"` | 1 | 1 | pass |
| C23 | `npx vitest run packages/phone/src/model/players.test.ts -t "tags spectators"` | 1 | 1 | pass |
| C24 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/lobby.spec.ts -g "updates the ru` | 1 | - | pass |
| C25 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/lobby.spec.ts -g "updates the li` | 1 | - | pass |
| C26 | `browser captures/phone-host-lobby.running.png` | - | - | **not judged** (screens.md) |
| C27 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "sends the` | 1 | - | pass |
| C28 | `npx vitest run packages/phone/src/model/settings.test.ts -t "steps the round time by 30 seconds between 30 and` | 1 | 1 | pass |
| C29 | `npx vitest run packages/phone/src/model/settings.test.ts -t "disables minus at 30 seconds and plus at 180 seco` | 1 | 1 | pass |
| C30 | `npx vitest run packages/phone/src/model/settings.test.ts -t "steps rounds by one between 1 and 5"` | 1 | 1 | pass |
| C31 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "sends the` | 1 | - | pass |
| C32 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "toggles t` | 1 | - | pass |
| C33 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "sends the` | 1 | - | pass |
| C34 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "offers Po` | 1 | - | pass |
| C35 | `browser captures/phone-host-actions.running.png` | - | - | **not judged** (screens.md) |
| C36 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "transfe` | 1 | - | pass |
| C37 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "kicks o` | 1 | - | pass |
| C38 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "cancel ` | 1 | - | pass |
| C39 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "start sen` | 1 | - | pass |
| C40 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "closes ` | 1 | - | pass |
| C41 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "swaps l` | 1 | - | pass |
| C42 | `browser captures/phone-countdown.running.png` | - | - | **not judged** (screens.md) |
| C43 | `npx vitest run packages/phone/src/model/screen.test.ts -t "keeps the countdown screen until startsAt on the se` | 1 | 1 | pass |
| C44 | `npx vitest run packages/phone/src/net/clock-sync.test.ts -t "keeps the offset of the lowest round trip"` | 1 | 1 | pass |
| C45 | `browser captures/phone-board.running.png` | - | - | **not judged** (screens.md) |
| C46 | `npx vitest run packages/phone/src/model/path.test.ts -t "extends the path with a neighbor in any of the eight ` | 1 | 1 | pass |
| C47 | `npx vitest run packages/phone/src/model/hit-test.test.ts -t "counts a touch only inside the central circle"` | 1 | 1 | pass |
| C48 | `npx vitest run packages/phone/src/model/path.test.ts -t "drops the last tile when the finger returns to the on` | 1 | 1 | pass |
| C49 | `npx vitest run packages/phone/src/model/path.test.ts -t "ignores tiles that are not neighbors or already used"` | 1 | 1 | pass |
| C50 | `npx vitest run packages/phone/src/model/path.test.ts -t "builds the word with Qu as q and u"` | 1 | 1 | pass |
| C51 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "shows the feed` | 1 | - | pass |
| C52 | `npx vitest run packages/phone/src/model/judge.test.ts -t "judges a matching hash as valid with the core points` | 1 | 1 | pass |
| C53 | `npx vitest run packages/phone/src/model/judge.test.ts -t "judges a word already in the list as already found"` | 1 | 1 | pass |
| C54 | `npx vitest run packages/phone/src/model/judge.test.ts -t "judges a non-matching hash as invalid"` | 1 | 1 | pass |
| C55 | `npx vitest run packages/phone/src/state/round.test.ts -t "shows too short and queues nothing below the minimum` | 1 | 1 | pass |
| C56 | `npx vitest run packages/phone/src/state/round.test.ts -t "clears the feedback after 500 ms"` | 1 | 1 | pass |
| C57 | `npx vitest run packages/phone/src/model/submit-queue.test.ts -t "waits 500 ms or sends at once in the last 3 s` | 1 | 1 | pass |
| C58 | `npx vitest run packages/phone/src/model/found.test.ts -t "removes a refused word and its points"` | 1 | 1 | pass |
| C59 | `npx vitest run packages/phone/src/model/clock.test.ts -t "formats the remaining time as MM:SS"` | 1 | 1 | pass |
| C60 | `npx vitest run packages/phone/src/model/clock.test.ts -t "turns the timer to alert at 10 seconds left"` | 1 | 1 | pass |
| C61 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "does not scrol` | 1 | - | pass |
| C62 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "lists found wo` | 1 | - | pass |
| C63 | `npx vitest run packages/phone/src/state/round.test.ts -t "vibrates 50 ms on a valid word when the preference i` | 1 | 1 | pass |
| C64 | `npx vitest run packages/phone/src/state/round.test.ts -t "plays the hit sound on a valid word when the prefere` | 1 | 1 | pass |
| C65 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "locks the boar` | 1 | - | pass |
| C66 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-match.spec.ts -g "shows the` | 1 | - | pass |
| C67 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-match.spec.ts -g "goes back` | 1 | - | pass |
| C68 | `browser captures/phone-spectator.running.png` | - | - | **not judged** (screens.md) |
| C69 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/spectator.spec.ts -g "shows the ` | 1 | - | pass |
| C70 | `npx vitest run packages/phone/src/model/players.test.ts -t "orders the quick scoreboard and puts spectators la` | 1 | 1 | pass |
| C70 | `browser captures/phone-round-result.running.png` | - | - | **not judged** (screens.md) |
| C71 | `npx vitest run packages/phone/src/model/results.test.ts -t "summarizes round points, total and position"` | 1 | 1 | pass |
| C72 | `npx vitest run packages/phone/src/model/results.test.ts -t "shows spellings in parentheses when the server sen` | 1 | 1 | pass |
| C73 | `npx vitest run packages/phone/src/model/results.test.ts -t "marks unique words with double points and the base` | 1 | 1 | pass |
| C74 | `npx vitest run packages/phone/src/model/results.test.ts -t "marks shared words as em comum"` | 1 | 1 | pass |
| C75 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "next round b` | 1 | - | pass |
| C76 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "goes back to` | 1 | - | pass |
| C77 | `npx vitest run packages/phone/src/model/players.test.ts -t "finds the player's place, total and session wins"` | 1 | 1 | pass |
| C78 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "non-host wai` | 1 | - | pass |
| C79 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "spectator se` | 1 | - | pass |
| C80 | `browser captures/phone-podium.running.png` | - | - | **not judged** (screens.md) |
| C81 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "shows confett` | 1 | - | pass |
| C82 | `npx vitest run packages/phone/src/model/players.test.ts -t "orders the podium and puts spectators last with ze` | 1 | 1 | pass |
| C83 | `npx vitest run packages/phone/src/model/match-summary.test.ts -t "counts the player's words across rounds"` | 1 | 1 | pass |
| C84 | `npx vitest run packages/phone/src/model/match-summary.test.ts -t "keeps the longest word with spellings, point` | 1 | 1 | pass |
| C85 | `npx vitest run packages/phone/src/state/match.test.ts -t "counts only the rounds seen after a reload"` | 1 | 1 | pass |
| C86 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "scrolls the w` | 1 | - | pass |
| C87 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "play again se` | 1 | - | pass |
| C88 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "back to lobby` | 1 | - | pass |
| C89 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "closes the ro` | 1 | - | pass |
| C90 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "non-host wait` | 1 | - | pass |
| C91 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "a spectator o` | 1 | - | pass |
| C92 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/layout.spec.ts -g "fits every wi` | 1 | - | pass |
| C93 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/layout.spec.ts -g "shows only th` | 1 | - | pass |
| C94 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/layout.spec.ts -g "keeps every b` | 1 | - | pass |
| C95 | `browser captures/phone-kicked.running.png` | - | - | **not judged** (screens.md) |
| C96 | `npx vitest run packages/phone/src/model/messages.test.ts -t "maps idle and tv-gone to the room closed text"` | 1 | 1 | pass |
| C97 | `browser captures/phone-room-closed.running.png` | - | - | **not judged** (screens.md) |
| C98 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/exit.spec.ts -g "enter another r` | 1 | - | pass |
| C99 | `npx vitest run packages/phone/src/net/room-connection.test.ts -t "does not reconnect after replaced"` | 1 | 1 | pass |
| C100 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/reconnect.spec.ts -g "keeps the ` | 1 | - | pass |
| C101 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/reconnect.spec.ts -g "restores f` | 1 | - | pass |
| C102 | `npx vitest run packages/phone/src/net/room-connection.test.ts -t "reconnects with the token after an unexpecte` | 1 | 1 | pass |
| C103 | `npx vitest run packages/phone/src/styles/styles.test.ts -t "animates only transform and opacity, with no blur"` | 1 | 1 | pass |
| C104 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/prefs.spec.ts -g "hides Vibrar w` | 1 | - | pass |
| C105 | `npx vitest run packages/phone/src/net/room-connection.test.ts -t "goes offline after 30 seconds without reconn` | 1 | 1 | pass |
| C106 | `npx vitest run packages/phone/src/state/prefs.test.ts -t "holds the wake lock in the lobby and the round and a` | 1 | 1 | pass |
| C107 | `npx vitest run packages/phone/src/model/messages.test.ts -t "has a string for every error code and close reaso` | 1 | 1 | pass |
| C108 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/prefs.spec.ts -g "opens the pref` | 1 | - | pass |
| C109 | `npx vitest run packages/phone/src/state/prefs.test.ts -t "keeps preferences across reloads"` | 1 | 1 | pass |
| C110 | `npx vitest run packages/phone/src/state/round.test.ts -t "ignores a release with a single tile"` | 1 | 1 | pass |
| C111 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "leaving the bo` | 1 | - | pass |
| C112 | `npx vitest run packages/phone/src/state/round.test.ts -t "drops pending paths when the results arrive"` | 1 | 1 | pass |
| C113 | `npx vitest run packages/phone/src/styles/styles.test.ts -t "uses no CSS grid and no gap"` | 1 | 1 | pass |
| C114 | `npx vitest run packages/phone/src/styles/styles.test.ts -t "uses only theme variables for colors"` | 1 | 1 | pass |
| C115 | `npx vitest run packages/phone/src/model/room-view.test.ts -t "ignores wrong-phase and not-host errors"` | 1 | 1 | pass |
| C116 | `npx vitest run packages/phone/src/model/room-view.test.ts -t "keeps the last settings from the server"` | 1 | 1 | pass |
| C117 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/full-match.spec.ts -g "plays a t` | 1 | - | pass |
| C119 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "fits the whole` | 1 | - | pass |
| C120 | `npx vitest run packages/phone/src/styles/styles.test.ts -t "sizes containers only with relative units"` | 1 | 1 | pass |
| C121 | `walk - o sub-agente de telas abre cada tela com capture a 320 e 480 px e compara composição e ordem com a capt` | - | - | pass (Walked) |
| C122 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/layout.spec.ts -g "scales propor` | 1 | - | pass |
| C123 | `npx vitest run packages/phone/src/net/room-connection.test.ts -t "stops reconnecting after room-not-found"` | 1 | 1 | pass |
| C118 | `walk - cada foto em captures/uncaptured/ com a resposta do user em ## Handoff` | - | - | pass (Walked) |
| Build | `npx tsc -b` | - | - | pass |
| Build | `npm run lint -w @bwords/phone` | - | - | pass |
| Build | `npx vitest run` | - | - | pass |
| Build | `npx playwright test` | - | - | pass |
| Build | `npx playwright test -c packages/phone/playwright.config.ts` | - | - | pass |
