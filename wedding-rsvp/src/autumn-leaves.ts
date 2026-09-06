import { Component } from '@angular/core';

@Component({
  selector: 'autumn-leaves',
  standalone: true,
  template: `
    <div class="leaves" aria-hidden="true">
      @for (leaf of leaves; track leaf) {
        <div class="fall" [style.left.%]="(leaf * 29 + 3) % 100"
          [style.--duration]="(22 + leaf % 5 * 4) + 's'"
          [style.--delay]="(-leaf * 7) + 's'"
          [style.--size]="(18 + leaf % 4 * 5) + 'px'"
          [style.color]="colors[leaf % colors.length]">
          <svg viewBox="0 0 64 72" focusable="false">
            <path fill="currentColor" d="M32 3 39 19 48 13 46 29 60 25 54 39 62 43 40 54 34 59 33 69 30 69 30 57 8 47 14 41 3 29 20 31 16 15 26 20Z" />
            <path d="M32 14V59M32 38 23 28M32 46 46 35M32 51 18 43" fill="none" stroke="#77503c" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </div>
      }
    </div>
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
    .leaves { position: absolute; inset: 0; overflow: hidden; }
    .fall { position: absolute; top: -60px; width: var(--size); opacity: 0;
      animation: fall var(--duration) var(--delay) linear infinite; }
    svg { display: block; width: 100%; height: auto;
      animation: flutter 7s var(--delay) ease-in-out infinite alternate; }
    @keyframes fall {
      0% { transform: translate3d(-25px, 0, 0); opacity: 0; }
      8%, 88% { opacity: .26; }
      100% { transform: translate3d(65px, calc(100vh + 120px), 0); opacity: 0; }
    }
    @keyframes flutter {
      from { transform: translateX(-18px) rotate(-35deg) rotateY(0deg); }
      to { transform: translateX(18px) rotate(65deg) rotateY(55deg); }
    }
    @media (max-width: 650px) { .fall:nth-child(n + 9) { display: none; } }
    @media (prefers-reduced-motion: reduce) { :host { display: none; } }
  `,
})
export class AutumnLeaves {
  readonly leaves = Array.from({ length: 14 }, (_, index) => index);
  readonly colors = ['#aa624b', '#bb956c', '#b7783d', '#8b957f'];
}
