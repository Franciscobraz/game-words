import { cleanNickname, type ErrorCode, NICKNAME_MAX, PALETTE } from '@bwords/core';
import { useState } from 'preact/hooks';
import { ColorPicker } from '../components/ColorPicker.tsx';
import { BadgeIcon, CheckCircleIcon, ErrorIcon, LoginIcon, PaletteIcon, TuneIcon, TvIcon } from '../components/icons.tsx';
import { Logo } from '../components/Logo.tsx';
import { PlayerAvatar } from '../components/PlayerAvatar.tsx';
import { PrimaryButton } from '../components/PrimaryButton.tsx';
import { RoomTag } from '../components/RoomTag.tsx';
import { RuleChips } from '../components/RuleChips.tsx';
import { WaitingDots } from '../components/WaitingDots.tsx';
import { closestColorOwner, colorSlots, selectedSlot } from '../model/colors.ts';
import { errorKey, type JoinErrorPlace, joinErrorPlace } from '../model/messages.ts';
import { nicknameLength } from '../model/nickname.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/join.css';
import { ConnectionBanner } from './RoomTopBar.tsx';

/** The system picker's color before the player picks one; any off-palette start would do. */
const CUSTOM_COLOR_START = '#ffffff';

/**
 * The join screen: nickname with its "N/12" counter, the color picker, the TV
 * preview, the rules of the match and "ENTRAR"; the server's answer shows next to
 * the field it is about (ENTRY-01 AC 1, JOIN-01, phone-join.png).
 */
export function JoinScreen() {
  const { room } = useStore();
  const view = room.room.value;
  const slots = colorSlots(PALETTE, view.players, view.myId);
  const [nickname, setNickname] = useState('');
  // The first free color is picked from the start, so "ENTRAR" works right away.
  const [color, setColor] = useState<string | null>(() => slots.find((slot) => slot.kind === 'free')?.color ?? null);
  const [customColor, setCustomColor] = useState(CUSTOM_COLOR_START);
  const host = view.players.find((p) => p.id === view.hostId) ?? null;

  function pickColor(next: string): void {
    setColor(next);
    if (selectedSlot(slots, next) === slots.length - 1) setCustomColor(next);
  }

  /** The error text for `place`, or null when the server's error is about another field. */
  function errorAt(place: JoinErrorPlace): string | null {
    if (view.joinError === null || joinErrorPlace(view.joinError) !== place) return null;
    return joinErrorText(view.joinError, () => (color === null ? null : closestColorOwner(color, view.players)));
  }

  return (
    <main class="screen join">
      <header class="top-bar">
        <Logo />
        <RoomTag code={view.code ?? ''} />
      </header>
      <ConnectionBanner />

      <NicknameCard nickname={nickname} error={errorAt('nickname')} onChange={setNickname} />

      <section class="card join__colors">
        <h2 class="join__title join__title--large">
          <PaletteIcon />
          {STRINGS.chooseColor}
        </h2>
        <ColorPicker slots={slots} selected={selectedSlot(slots, color)} customColor={customColor} onPickColor={pickColor} />
        <FieldError text={errorAt('color')} />
        <section class="join__preview" aria-label={STRINGS.tvPreview}>
          <span class="join__label">
            <TvIcon />
            {STRINGS.tvPreview}
          </span>
          <span class="join__preview-player">
            <PlayerAvatar nickname={nickname} color={color ?? customColor} size="medium" />
            <span class="join__preview-name">{nickname.trim()}</span>
          </span>
        </section>
      </section>

      {view.settings !== null && (
        <section class="card">
          <h2 class="join__title">
            <TuneIcon />
            {STRINGS.matchRules}
          </h2>
          <RuleChips settings={view.settings} />
        </section>
      )}

      {host !== null && (
        <p class="card join__waiting">
          <WaitingDots />
          <span>
            {STRINGS.waitingBeforeHost} <strong class="join__host">{host.nickname}</strong> {STRINGS.waitingAfterHost}
          </span>
        </p>
      )}

      <FieldError text={errorAt('form')} />
      <div class="join__enter">
        <PrimaryButton tone="valid" onPress={() => room.join(nickname, color ?? '')}>
          <LoginIcon />
          {STRINGS.join}
        </PrimaryButton>
      </div>
    </main>
  );
}

interface NicknameCardProps {
  nickname: string;
  error: string | null;
  onChange: (nickname: string) => void;
}

/** "Seu Apelido" with the "N/12" counter and the check once the nickname is valid (JOIN-01 AC 1, 6-7). */
function NicknameCard({ nickname, error, onChange }: NicknameCardProps) {
  const isValid = cleanNickname(nickname) !== null;
  return (
    <section class="card">
      <div class="join__nickname-head">
        <label class="join__label" for="nickname">
          <BadgeIcon />
          {STRINGS.nicknameLabel}
        </label>
        <span class={`join__counter${isValid ? ' join__counter--valid' : ''}`}>{STRINGS.nicknameCounter(nicknameLength(nickname))}</span>
      </div>
      <div class="join__field">
        <input
          id="nickname"
          class="join__input"
          type="text"
          autoComplete="off"
          maxLength={NICKNAME_MAX}
          value={nickname}
          onInput={(event) => onChange(event.currentTarget.value)}
        />
        {isValid && (
          <span class="join__valid">
            <CheckCircleIcon />
          </span>
        )}
      </div>
      <FieldError text={error} />
    </section>
  );
}

interface FieldErrorProps {
  text: string | null;
}

function FieldError({ text }: FieldErrorProps) {
  if (text === null) return null;
  return (
    <p class="join__error" role="alert">
      <ErrorIcon />
      {text}
    </p>
  );
}

/** The text of a join error; "Muito parecida com a cor de <apelido>" names the closest color's owner (JOIN-01 AC 8). */
function joinErrorText(code: ErrorCode, closestOwner: () => string | null): string {
  if (code === 'color-too-similar') return STRINGS.colorTooSimilar(closestOwner() ?? '');
  const text = STRINGS[errorKey(code)];
  return typeof text === 'string' ? text : '';
}
