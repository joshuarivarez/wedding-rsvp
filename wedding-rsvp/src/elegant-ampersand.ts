import { Component } from '@angular/core';

@Component({
  selector: 'elegant-ampersand',
  standalone: true,
  template: `
    <svg viewBox="0 0 116 126" role="img" aria-label="and" focusable="false">
      <path class="heart-stroke" d="M101 117 C101 106 88 94 72 80 L31 43 C18 31 13 21 17 13 C21 4 31 3 39 7 C46 10 52 17 58 25 C64 17 70 10 78 7 C88 3 98 7 100 16 C103 28 94 40 81 51 C69 62 53 73 41 83 C29 93 21 103 25 112 C29 123 46 125 61 121 C83 116 99 98 99 78" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      width: .68em;
      height: .78em;
      margin-inline: .04em;
      color: var(--terracotta);
      vertical-align: -.13em;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .heart-stroke {
      fill: none;
      stroke: currentColor;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class ElegantAmpersand {}
