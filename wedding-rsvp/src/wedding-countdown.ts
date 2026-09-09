import { Component, OnDestroy, signal } from '@angular/core';

export const WEDDING_TIME = Date.parse('2027-02-08T16:00:00+08:00');

export function countdownParts(now: number) {
  const seconds = Math.max(0, Math.floor((WEDDING_TIME - now) / 1000));
  return [
    { label: 'Days', value: Math.floor(seconds / 86400) },
    { label: 'Hours', value: Math.floor(seconds / 3600) % 24 },
    { label: 'Minutes', value: Math.floor(seconds / 60) % 60 },
    { label: 'Seconds', value: seconds % 60 },
  ];
}

@Component({
  selector: 'wedding-countdown',
  standalone: true,
  template: `
    <div class="countdown" role="timer" aria-label="Countdown to our wedding" aria-live="off">
      @for (part of parts(); track part.label; let last = $last) {
        <div class="countdown-part"><span class="countdown-value">{{ part.value.toString().padStart(2, '0') }}</span><span class="countdown-label">{{ part.label }}</span></div>
        @if (!last) { <span class="countdown-separator" aria-hidden="true">:</span> }
      }
    </div>
    <time datetime="2027-02-08T16:00:00+08:00" aria-label="February 8, 2027">02.08.2027</time>
  `,
  styles: [`
    :host { display: block; max-width: 390px; margin: 25px 0; }
    .countdown { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr; padding: 17px 0; }
    .countdown-part { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .countdown-separator { font-family: 'Cormorant Garamond', serif; font-size: clamp(30px, 4vw, 43px); line-height: 1; color: var(--mocha); }
    .countdown-value { font-family: 'Cormorant Garamond', serif; font-size: clamp(30px, 4vw, 43px); line-height: 1; font-variant-numeric: tabular-nums; color: var(--mocha); }
    .countdown-label { font-size: 8px; letter-spacing: 1.4px; text-transform: uppercase; }
    time { display: block; text-align: center; margin-top: 13px; font-size: 11px; letter-spacing: 3px; color: var(--terracotta); }
  `],
})
export class WeddingCountdown implements OnDestroy {
  readonly parts = signal(countdownParts(Date.now()));
  private readonly timer = setInterval(() => this.parts.set(countdownParts(Date.now())), 1000);
  ngOnDestroy() { clearInterval(this.timer); }
}
