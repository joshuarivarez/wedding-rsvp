import { Component, computed, ElementRef, HostListener, OnDestroy, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';

interface GalleryPhoto {
  src: string;
  alt: string;
  caption: string;
  layout: 'wide' | 'tall' | 'standard';
}

@Component({
  selector: 'wedding-gallery',
  standalone: true,
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
})
export class GalleryComponent implements OnDestroy {
  @ViewChildren('galleryButton') private galleryButtons?: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  readonly photos: readonly GalleryPhoto[] = [
    { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85', alt: 'Newlyweds walking together outdoors', caption: 'Hand in hand, always', layout: 'wide' },
    { src: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=85', alt: 'A couple sharing a joyful wedding moment', caption: 'The joy of finding you', layout: 'tall' },
    { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85', alt: 'Wedding rings and floral details', caption: 'A promise for a lifetime', layout: 'standard' },
    { src: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=900&q=85', alt: 'A couple holding hands on their wedding day', caption: 'Our favorite place is together', layout: 'standard' },
    { src: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=85', alt: 'Romantic wedding flowers and celebration details', caption: 'Little moments, lasting memories', layout: 'tall' },
    { src: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1200&q=85', alt: 'A couple celebrating beneath soft evening light', caption: 'The beginning of forever', layout: 'wide' },
  ];

  readonly activeIndex = signal<number | null>(null);
  readonly activePhoto = computed(() => {
    const index = this.activeIndex();
    return index === null ? null : this.photos[index];
  });
  private previousOverflow = '';

  open(index: number) {
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.activeIndex.set(index);
    setTimeout(() => this.closeButton?.nativeElement.focus());
  }

  close() {
    const index = this.activeIndex();
    if (index === null) return;
    document.body.style.overflow = this.previousOverflow;
    this.activeIndex.set(null);
    setTimeout(() => this.galleryButtons?.get(index)?.nativeElement.focus());
  }

  previous() {
    const index = this.activeIndex();
    if (index !== null) this.activeIndex.set((index - 1 + this.photos.length) % this.photos.length);
  }

  next() {
    const index = this.activeIndex();
    if (index !== null) this.activeIndex.set((index + 1) % this.photos.length);
  }

  backdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (this.activeIndex() === null) return;
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowLeft') this.previous();
    if (event.key === 'ArrowRight') this.next();
  }

  ngOnDestroy() {
    if (this.activeIndex() !== null) document.body.style.overflow = this.previousOverflow;
  }
}
