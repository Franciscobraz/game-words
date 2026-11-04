# m4-1-playtest proofs

**HEAD**: fd31734
**Tree**: clean
**Result**: 137 pass, 2 fail; mutations 0 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `npx vitest run packages/core/src/room/results.test.ts -t "counts the unique words and the shared ones each pla` | 1 | 1 | pass |
| C2 | `npx vitest run packages/core/src/room/results.test.ts -t "adds up the words of the match after each round"` | 1 | 1 | pass |
| C3 | `npx vitest run packages/core/src/room/results.test.ts -t "ends the round on the words with the results only to` | 2 | 2 | pass |
| C4 | `npx vitest run packages/core/src/room/state.test.ts -t "starts a new room with the music on"` | 1 | 1 | pass |
| C5 | `npx vitest run packages/core/src/room/settings.test.ts -t "turns the music on in a room stored without it"` | 1 | 1 | pass |
| C6 | `npx vitest run packages/core/src/room/settings.test.ts -t "changes the music only in the lobby"` | 1 | 1 | pass |
| C7 | `npx vitest run packages/core/src/room/protocol.test.ts -t "parses the host list commands and refuses any other` | 1 | 1 | pass |
| C8 | `npx vitest run packages/core/src/room/reveal.test.ts -t "refuses scroll and show-result from anyone but the ho` | 1 | 1 | pass |
| C9 | `npx vitest run packages/core/src/room/reveal.test.ts -t "relays the host scroll to the tv only"` | 1 | 1 | pass |
| C10 | `npx vitest run packages/core/src/room/reveal.test.ts -t "opens the results in the middle of the match on show-` | 1 | 1 | pass |
| C11 | `npx vitest run packages/core/src/room/reveal.test.ts -t "opens the podium after the last round on show-result"` | 1 | 1 | pass |
| C12 | `npx vitest run packages/core/src/room/reveal.test.ts -t "refuses a second show-result"` | 2 | 2 | pass |
| C13 | `npx vitest run packages/core/src/room/reveal.test.ts -t "goes back to the lobby from the words"` | 1 | 1 | pass |
| C14 | `npx vitest run packages/core/src/room/reveal.test.ts -t "keeps the next round ready and makes a newcomer a spe` | 1 | 1 | pass |
| C15 | `npx vitest run packages/core/src/room/machine.test.ts -t "sends the tv that connects on the words the results ` | 1 | 1 | pass |
| C16 | `npx vitest run packages/core/src/room/machine.test.ts -t "sends a phone that connects after show-result the re` | 2 | 2 | pass |
| C17 | `npx vitest run packages/core/src/room/machine.test.ts -t "sends no word of the round to a phone or a guest on ` | 1 | 1 | pass |
| C18 | `npx vitest run packages/core/src/room/machine.test.ts -t "sends a phone that connects on the words only the we` | 1 | 1 | pass |
| C19 | `npx vitest run packages/server/test/match.test.ts -t "never sends round words to phones before the results"` | 1 | 1 | pass |
| C20 | `npx vitest run packages/server/test/match.test.ts -t "plays a 2-round match with a TV and 3 phones"` | 1 | 1 | pass |
| C21 | `npx vitest run packages/core/src/client/synth.test.ts -t "plays the check as short rising notes"` | 1 | 1 | pass |
| C22 | `npx vitest run packages/core/src/client/room-connection.test.ts -t "keeps one offline deadline when a socket d` | 1 | 1 | pass |
| C23 | `npx vitest run packages/phone/src/model/screen.test.ts -t "shows look at the tv on the words to players, spect` | 1 | 1 | pass |
| C24 | `npx vitest run packages/phone/src/state/room.test.ts -t "sends scroll and show-result for the host buttons"` | 1 | 1 | pass |
| C25 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/look-at-tv.spec.ts -g "tells eve` | 1 | - | pass |
| C26 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/look-at-tv.spec.ts -g "shows the` | 1 | - | pass |
| C27 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/look-at-tv.spec.ts -g "gives the` | 1 | - | pass |
| C28 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/look-at-tv.spec.ts -g "shows loo` | 1 | - | pass |
| C29 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "opens the ro` | 1 | - | pass |
| C30 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "opens the pod` | 1 | - | pass |
| C31 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "keeps the pod` | 1 | - | pass |
| C32 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/reconnect.spec.ts -g "shows the ` | 1 | - | pass |
| C33 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/full-match.spec.ts -g "plays a t` | 1 | - | pass |
| C34 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/exit.spec.ts -g "enter another r` | 1 | - | pass |
| C35 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/entry.spec.ts -g "shows the code` | 1 | - | pass |
| C36 | `npx vitest run packages/phone/src/state/prefs.test.ts -t "starts with vibrate and sound on without saved prefe` | 1 | 1 | pass |
| C37 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/prefs.spec.ts -g "keeps the pref` | 1 | - | pass |
| C38 | `npx vitest run packages/phone/src/state/round.test.ts -t "vibrates 50 ms on a valid word when the preference i` | 1 | 1 | pass |
| C39 | `npx vitest run packages/phone/src/device/hit-sound.test.ts -t "plays the check of the tv words list"` | 1 | 1 | pass |
| C40 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "colors each ve` | 1 | - | pass |
| C41 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "paints the pat` | 1 | - | pass |
| C42 | `npx vitest run packages/tv/src/state/reveal.test.ts -t "never opens the result while the room is on the words"` | 1 | 1 | pass |
| C43 | `npx vitest run packages/tv/src/model/word-scroll.test.ts -t "stops a step at the top and with the last word wh` | 1 | 1 | pass |
| C44 | `npx vitest run packages/tv/src/model/word-scroll.test.ts -t "highlights the word on the reading line while the` | 1 | 1 | pass |
| C45 | `npx vitest run packages/tv/src/model/word-scroll.test.ts -t "highlights a list that fits one word a second and` | 1 | 1 | pass |
| C46 | `npx vitest run packages/tv/src/device/audio.test.ts -t "plays the check of the shared recipe at the room volum` | 1 | 1 | pass |
| C47 | `npx vitest run packages/tv/src/state/word-scroll.test.ts -t "plays a check each time a word becomes highlighte` | 1 | 1 | pass |
| C48 | `npx vitest run packages/tv/src/state/word-scroll.test.ts -t "drops the highlight and the check after the host'` | 1 | 1 | pass |
| C49 | `npx vitest run packages/tv/src/state/word-scroll.test.ts -t "starts every list in the automatic mode"` | 1 | 1 | pass |
| C50 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "scrolls one line a s` | 1 | - | pass |
| C51 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "does not move a list` | 1 | - | pass |
| C52 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "stops with the last ` | 1 | - | pass |
| C53 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "moves half a panel d` | 1 | - | pass |
| C54 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "moves half a panel u` | 1 | - | pass |
| C55 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "shows the result whe` | 1 | - | pass |
| C56 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "restarts the list fr` | 1 | - | pass |
| C57 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "highlights with colo` | 1 | - | pass |
| C58 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "scrolls to the end a` | 1 | - | pass |
| C59 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "says when no word wa` | 1 | - | pass |
| C60 | `npx vitest run packages/tv/src/model/standings.test.ts -t "shows the round words and points between rounds"` | 1 | 1 | pass |
| C61 | `npx vitest run packages/tv/src/model/standings.test.ts -t "shows the match sums after the last round"` | 1 | 1 | pass |
| C62 | `npx vitest run packages/tv/src/model/standings.test.ts -t "orders and places by the round points between round` | 1 | 1 | pass |
| C63 | `npx vitest run packages/tv/src/model/standings.test.ts -t "orders and places by the match after the last round` | 1 | 1 | pass |
| C64 | `npx vitest run packages/tv/src/model/standings.test.ts -t "puts a late joiner last with 0 in the round and the` | 1 | 1 | pass |
| C65 | `npx vitest run packages/tv/src/model/score-label.test.ts -t "writes plvr and pt in the singular and plvrs and ` | 1 | 1 | pass |
| C66 | `npx vitest run packages/tv/src/model/result-header.test.ts -t "titles the standings by the round between round` | 1 | 1 | pass |
| C67 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "shows words and poi` | 1 | - | pass |
| C68 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "shows the longest w` | 1 | - | pass |
| C69 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "shows only the code` | 1 | - | pass |
| C70 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "ranks by the round ` | 1 | - | pass |
| C71 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "ranks by the match ` | 1 | - | pass |
| C72 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "keeps the words and` | 1 | - | pass |
| C73 | `browser captures/tv-round-result.running.png` | - | - | **not judged** (screens.md) |
| C74 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/full-match.spec.ts -g "plays a whole m` | 1 | - | pass |
| C75 | `npx vitest run packages/tv/src/model/music.test.ts -t "plays the lobby music on the lobby, the opening and the` | 1 | 1 | pass |
| C76 | `npx vitest run packages/tv/src/model/music.test.ts -t "plays the match music on the countdown, the round, the ` | 1 | 1 | pass |
| C77 | `npx vitest run packages/tv/src/model/music.test.ts -t "speeds the match music up 1.5 times from 15 seconds bef` | 1 | 1 | pass |
| C78 | `npx vitest run packages/tv/src/model/music.test.ts -t "brings the match music back to its tempo on the next co` | 1 | 1 | pass |
| C79 | `npx vitest run packages/tv/src/model/music.test.ts -t "plays the jingle on the result between rounds"` | 1 | 1 | pass |
| C80 | `npx vitest run packages/tv/src/model/songs.test.ts -t "loops the jingle every 30 seconds"` | 1 | 1 | pass |
| C81 | `npx vitest run packages/tv/src/model/music-clock.test.ts -t "resumes the match music where it stopped after a ` | 1 | 1 | pass |
| C82 | `npx vitest run packages/tv/src/device/music.test.ts -t "plays every track at half the gain of the effects"` | 4 | 4 | pass |
| C83 | `npx vitest run packages/tv/src/device/music.test.ts -t "starts after the unlock at the point the music would b` | 1 | 1 | pass |
| C84 | `npx vitest run packages/tv/src/state/music.test.ts -t "silences every track and leaves the other sounds playin` | 1 | 1 | pass |
| C85 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "switches ` | 1 | - | pass |
| C86 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/music.spec.ts -g "loads no audio file"` | 1 | - | pass |
| C87 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/music.spec.ts -g "plays the music of e` | 1 | - | pass |
| C125 | `npx vitest run packages/tv/src/device/music.test.ts -t "keeps the pitch and shortens the steps at 1.5 times th` | 1 | 1 | pass |
| C126 | `npx vitest run packages/tv/src/model/music.test.ts -t "plays the finale on the result of the last round"` | 1 | 1 | pass |
| C127 | `npx vitest run packages/tv/src/model/music.test.ts -t "plays nothing on the replaced tab"` | 1 | 1 | pass |
| C128 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/music.spec.ts -g "keeps the music of t` | 1 | - | pass |
| C129 | `npx vitest run packages/tv/src/model/music.test.ts -t "plays no track on any screen with the music off"` | 1 | 1 | pass |
| C130 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "plays only the` | 1 | - | pass |
| C131 | `npx vitest run packages/tv/src/model/music-clock.test.ts -t "starts the jingle and the finale from the top on ` | 1 | 1 | pass |
| C132 | `npx vitest run packages/tv/src/model/songs.test.ts -t "wraps a window across the end of each song to its start` | 4 | 4 | pass |
| C88 | `npx vitest run packages/tv/src/state/awake.test.ts -t "holds a screen wake lock while the page is open and vis` | 1 | 1 | pass |
| C89 | `npx vitest run packages/tv/src/state/awake.test.ts -t "asks for the wake lock again when the page comes back"` | 1 | 1 | pass |
| C90 | `npx vitest run packages/tv/src/state/awake.test.ts -t "goes on when the browser refuses the wake lock"` | 1 | 1 | pass |
| C91 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/awake.spec.ts -g "plays a muted loopin` | 1 | - | pass |
| C92 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/awake.spec.ts -g "shows no error when ` | 1 | - | pass |
| C93 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/awake.spec.ts -g "keeps every pixel of` | 1 | - | pass |
| C94 | `npx vitest run packages/server/e2e/assets.test.ts -t "serves the tv at the root"` | 1 | 1 | pass |
| C95 | `npx vitest run packages/server/e2e/assets.test.ts -t "serves the tv at /tv"` | 1 | 1 | pass |
| C96 | `npx vitest run packages/server/e2e/assets.test.ts -t "serves the phone code entry at /join"` | 1 | 1 | pass |
| C97 | `npx vitest run packages/server/e2e/assets.test.ts -t "serves the phone at a room code"` | 1 | 1 | pass |
| C98 | `npx vitest run packages/server/e2e/assets.test.ts -t "never serves the language pack"` | 1 | 1 | pass |
| C99 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "shows the code and t` | 1 | - | pass |
| C100 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "shows the empty lobb` | 1 | - | pass |
| C101 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/zoom.spec.ts -g "keeps the zoom ` | 21 | - | pass |
| C102 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/zoom.spec.ts -g "keeps the zoom ` | 1 | - | pass |
| C103 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/zoom.spec.ts -g "counts each tap` | 1 | - | pass |
| C104 | `npx vitest run packages/phone/src/styles/styles.test.ts -t "keeps every text field at 16 px or more"` | 1 | 1 | pass |
| C105 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "keeps the code ` | 1 | - | pass |
| C106 | `node -e "const t=require('fs').readFileSync('packages/phone/playwright.config.ts','utf8');process.exit(/worker` | count unknown | - | pass |
| C107 | `node -e "const t=require('fs').readFileSync('docs/DESIGN.md','utf8');process.exit(t.includes('wrangler.jsonc')` | count unknown | - | pass |
| C111 | `npx vitest run packages/server/test/persistence.test.ts -t "counts 0 words for players stored without them"` | 1 | 1 | pass |
| C112 | `npx vitest run packages/tv/src/model/words-players.test.ts -t "starts every player of the round at 0 points wi` | 1 | 1 | pass |
| C113 | `npx vitest run packages/tv/src/model/words-players.test.ts -t "adds the highlighted word to whoever found it"` | 1 | 1 | pass |
| C114 | `npx vitest run packages/tv/src/model/words-players.test.ts -t "shows the full round points under manual contro` | 1 | 1 | pass |
| C115 | `npx vitest run packages/tv/src/model/words-players.test.ts -t "ends at the round points of the result"` | 1 | 1 | pass |
| C116 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "animates the players` | 1 | - | pass |
| C117 | `npx vitest run packages/tv/src/model/words-players.test.ts -t "orders the players by points, ties by joining o` | 1 | 1 | pass |
| C118 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "slides the whole car` | 1 | - | pass |
| C119 | `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "keeps the panel and ` | 1 | - | pass |
| C120 | `npx vitest run packages/tv/src/model/words-players.test.ts -t "tags the disconnected and leaves out who did no` | 1 | 1 | pass |
| C121 | `npx vitest run packages/tv/src/model/words-players.test.ts -t "marks the first two places"` | 1 | 1 | pass |
| C122 | `npx vitest run packages/tv/src/model/words-players.test.ts -t "writes words and points in full, singular at on` | 1 | 1 | pass |
| C123 | `browser captures/tv-words.running.png` | - | - | **not judged** (screens.md) |
| C124 | `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "paints a valid` | 1 | - | pass |
| C108 | `walk - caminhada do user na TV real, depois do deploy que ele pedir; resultado em **Walked:**` | - | - | pass (Walked) |
| C109 | `walk - caminhada do user no Safari do iPhone; resultado em **Walked:**` | - | - | pass (Walked) |
| C110 | `walk - caminhada do user na TV e num celular reais; resultado em **Walked:**` | - | - | pass (Walked) |
| Build | `npx tsc -b` | - | - | pass |
| Build | `npm run lint -w @bwords/phone` | - | - | pass |
| Build | `npm run lint -w @bwords/tv` | - | - | pass |
| Build | `npx vitest run` | - | - | pass |
| Build | `npx playwright test` | - | - | pass |
| Build | `npx playwright test -c packages/phone/playwright.config.ts` | - | - | pass |
| Build | `npx playwright test -c packages/tv/playwright.config.ts` | - | - | pass |
