import { type Handler, reject } from './effects.ts';
import { type RoomState, validateSettingsPatch } from './state.ts';

/**
 * `settings` from the host in the lobby (the dispatcher already refused other
 * phases with `wrong-phase`): applies an allowed patch and sends the new settings
 * to every connection; any value out of range is `bad-settings` and changes nothing.
 */
export const handleSettings: Handler<'settings'> = ({ state, conn }, msg) => {
  const patch = validateSettingsPatch(msg.patch);
  if (patch === null) return reject(state, conn, 'bad-settings');
  const next: RoomState = { ...state, settings: { ...state.settings, ...patch } };
  return {
    state: next,
    effects: [
      { kind: 'persist', keys: ['room'] },
      { kind: 'broadcast', msg: { type: 'settings', settings: next.settings } },
    ],
  };
};
