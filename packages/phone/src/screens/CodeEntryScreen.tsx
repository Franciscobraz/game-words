import type { TargetedKeyboardEvent, TargetedSubmitEvent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ArrowForwardIcon, ErrorIcon } from '../components/icons.tsx';
import { Logo } from '../components/Logo.tsx';
import { PrimaryButton } from '../components/PrimaryButton.tsx';
import { type CodeBoxes, completeCode, EMPTY_CODE_BOXES, typeCodeLetter } from '../model/room-code.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/code-entry.css';

/**
 * "Entrar numa sala": four boxes, one letter each, typed with the system keyboard;
 * "CONTINUAR" opens the room, and a code with no room shows "Sala não encontrada"
 * (ENTRY-01 AC 2-5, phone-code.png).
 */
export function CodeEntryScreen() {
  const { room } = useStore();
  const view = room.room.value;
  const isNotFound = view.joinError === 'room-not-found';
  // After "Sala não encontrada" the boxes keep the code, for the player to fix it.
  const [boxes, setBoxes] = useState<CodeBoxes>(() => (view.code === null ? EMPTY_CODE_BOXES : [...view.code]));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const firstEmptyBox = () => Math.max(0, boxes.indexOf(''));
  // Only on arrival: later the focus follows the typing.
  const arrivalBox = useRef(firstEmptyBox());

  const focusBox = (index: number) => inputs.current[index]?.focus();

  useEffect(() => {
    inputs.current[arrivalBox.current]?.focus();
  }, []);

  function typeAt(index: number, input: HTMLInputElement): void {
    const letter = input.value.slice(-1);
    const next = typeCodeLetter(boxes, index, letter);
    // A key outside the room alphabet leaves the box as it was.
    input.value = next[index] ?? '';
    if (next === boxes) return;
    setBoxes(next);
    if (letter !== '') focusBox(index + 1);
  }

  function goBackFrom(index: number, event: TargetedKeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Backspace' || boxes[index] !== '' || index === 0) return;
    event.preventDefault();
    setBoxes(typeCodeLetter(boxes, index - 1, ''));
    focusBox(index - 1);
  }

  function submit(event: TargetedSubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const code = completeCode(boxes);
    if (code === null) {
      focusBox(firstEmptyBox());
      return;
    }
    history.pushState(null, '', `/${code}`);
    room.openRoom(code);
  }

  return (
    <main class="screen code-entry">
      <div class="code-entry__logo">
        <Logo boxed />
      </div>
      <h1 class="code-entry__title">{STRINGS.enterRoom}</h1>
      <p class="code-entry__hint">{STRINGS.enterRoomHint}</p>
      <form class="code-entry__form" onSubmit={submit}>
        <div class="code-entry__boxes">
          {boxes.map((letter, index) => (
            <input
              key={index}
              ref={(input) => {
                inputs.current[index] = input;
              }}
              class="code-entry__box"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellcheck={false}
              placeholder="_"
              aria-label={STRINGS.codeLetter(index + 1)}
              value={letter}
              onInput={(event) => typeAt(index, event.currentTarget)}
              onKeyDown={(event) => goBackFrom(index, event)}
            />
          ))}
        </div>
        {isNotFound && (
          <p class="code-entry__error" role="alert">
            <ErrorIcon />
            {STRINGS.roomNotFound}
          </p>
        )}
        <div class="code-entry__continue">
          <PrimaryButton tone="action" type="submit">
            {STRINGS.continue}
            <ArrowForwardIcon />
          </PrimaryButton>
        </div>
      </form>
    </main>
  );
}
