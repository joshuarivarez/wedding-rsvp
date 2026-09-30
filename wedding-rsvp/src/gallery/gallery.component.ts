import { Component, computed, ElementRef, HostListener, OnDestroy, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';

interface GalleryPhoto {
  src: string;
  alt: string;
  caption: string;
  date: { label: string; iso: string };
  layout: 'wide' | 'tall' | 'standard';
}

@Component({
  selector: 'wedding-gallery',
  standalone: true,
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css', './gallery-date.css'],
})
export class GalleryComponent implements OnDestroy {
  @ViewChildren('galleryButton') private galleryButtons?: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  readonly photos: readonly GalleryPhoto[] = [
    { src: 'assets/gallery-images/moment-to-remember.JPG', alt: 'A favorite moment from our photo collection', caption: 'A moment to remember', date: { label: '08.02.20', iso: '2020-08-02' }, layout: 'wide' },
    { src: 'assets/gallery-images/6R2.JPG', alt: 'A favorite moment from our photo collection', caption: 'Together, always', date: { label: '09.27.25', iso: '2025-09-27' }, layout: 'tall' },
    { src: 'assets/gallery-images/little-things.JPG', alt: 'A favorite moment from our photo collection', caption: 'The little things', date: { label: '09.08.19', iso: '2019-09-08' }, layout: 'standard' },
    { src: 'assets/gallery-images/hk.JPEG', alt: 'A favorite moment from our photo collection', caption: 'Our forever, our fairytale', date: { label: '10.13.25', iso: '2025-10-13' }, layout: 'standard' },
    { src: 'assets/gallery-images/favorite-memories.jpg', alt: 'A favorite moment from our photo collection', caption: 'A wish for a lifetime of us', date: { label: '03.20.26', iso: '2026-03-20' }, layout: 'tall' },
    { src: 'assets/gallery-images/treasure.jpg', alt: 'A favorite moment from our photo collection', caption: 'A lifetime of smiles and laughter', date: { label: '02.12.22', iso: '2022-02-12' }, layout: 'wide' },
    { src: 'assets/gallery-images/beginning.jpg', alt: 'A favorite moment from our photo collection', caption: 'The beginning of forever', date: { label: '02.07.26', iso: '2026-02-07' }, layout: 'tall' },
    { src: 'assets/gallery-images/5yrs.jpg', alt: 'A favorite moment from our photo collection', caption: 'A love that grows with every chapter', date: { label: '08.02.25', iso: '2025-08-02' }, layout: 'wide' },
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
