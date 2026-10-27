import { nextDeadline, type RoomState } from '@bwords/core';

/**
 * Points the Durable Object alarm at the room's next deadline (round end, host
 * handoff, TV counts flush, idle and TV timeouts), or deletes it when nothing is
 * pending (PERSIST-01 AC 4). An unchanged deadline writes nothing.
 */
export async function syncAlarm(storage: DurableObjectStorage, state: RoomState | null): Promise<void> {
  const deadline = state === null ? null : nextDeadline(state);
  const current = await storage.getAlarm();
  if (deadline === current) return;
  if (deadline === null) await storage.deleteAlarm();
  else await storage.setAlarm(deadline);
}
