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
    { src: 'assets/gallery-images/moment-to-remember.JPG', alt: 'A favorite moment from our photo collection', caption: 'A moment to remember', layout: 'wide' },
    { src: 'assets/gallery-images/6R2.JPG', alt: 'A favorite moment from our photo collection', caption: 'Together, always', layout: 'tall' },
    { src: 'assets/gallery-images/little-things.JPG', alt: 'A favorite moment from our photo collection', caption: 'The little things', layout: 'standard' },
    { src: 'assets/gallery-images/hk.JPEG', alt: 'A favorite moment from our photo collection', caption: 'Our forever, our fairytale', layout: 'standard' },
    { src: 'assets/gallery-images/favorite-memories.jpg', alt: 'A favorite moment from our photo collection', caption: 'A wish for a lifetime of us', layout: 'tall' },
    { src: 'assets/gallery-images/treasure.jpg', alt: 'A favorite moment from our photo collection', caption: 'A lifetime of smiles and laughter', layout: 'wide' },
    { src: 'assets/gallery-images/beginning.jpg', alt: 'A favorite moment from our photo collection', caption: 'The beginning of forever', layout: 'tall' },
    { src: 'assets/gallery-images/5yrs.jpg', alt: 'A favorite moment from our photo collection', caption: 'A love that grows with every chapter', layout: 'wide' },
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
