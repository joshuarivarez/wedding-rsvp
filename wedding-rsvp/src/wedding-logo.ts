import { Component, signal } from '@angular/core';

@Component({
  selector: 'wedding-logo',
  standalone: true,
  template: `
    <img src="assets/wedding-logo.png" alt="Joshua and Judy Ann floral wedding monogram"
      width="2000" height="2000" [class.loaded]="loaded()"
      (load)="loaded.set(true)" (error)="loaded.set(false)">
    <span class="logo-fallback" [hidden]="loaded()" aria-label="Joshua and Judy Ann">J <i>&</i> J</span>
  `,
  styles: `
    :host { display: block; position: relative; width: 80px; aspect-ratio: 1; }
    img { display: block; width: 100%; height: 100%; object-fit: contain; opacity: 0; }
    img.loaded { opacity: 1; }
    .logo-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 3px; font: 36px 'Cormorant Garamond', serif; }
    .logo-fallback[hidden] { display: none; }
    i { color: var(--terracotta); font-size: 25px; }
    @media (max-width: 650px) { :host { width: 64px; } }
  `
})
export class WeddingLogo {
  loaded = signal(false);
}
