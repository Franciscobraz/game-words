import '../styles/waiting-dots.css';

/** Three dots that blink one after the other while the room waits for the host (animated with opacity only, UI-01 AC 4). */
export function WaitingDots() {
  return (
    <span class="waiting-dots" aria-hidden="true">
      <span class="waiting-dots__dot waiting-dots__dot--action" />
      <span class="waiting-dots__dot waiting-dots__dot--secondary" />
      <span class="waiting-dots__dot waiting-dots__dot--valid" />
    </span>
  );
}
