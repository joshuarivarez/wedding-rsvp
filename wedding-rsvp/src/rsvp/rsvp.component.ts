import { Component, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RSVP_GATEWAY } from './rsvp.gateway';
import { Attendance, Invitation, RsvpReceipt } from './rsvp.models';

@Component({
  selector: 'wedding-rsvp',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './rsvp.component.html',
  styleUrls: ['./rsvp.component.css', './autocomplete.css', './guest-checklist.css'],
})
export class RsvpComponent implements OnDestroy {
  private readonly gateway = inject(RSVP_GATEWAY);
  readonly isMock = this.gateway.mode === 'mock';
  @ViewChild('stepHeading') stepHeading?: ElementRef<HTMLElement>;
  readonly step = signal(1);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly matches = signal<Invitation[]>([]);
  readonly suggestions = signal<Invitation[]>([]);
  readonly suggestionsOpen = signal(false);
  readonly autocompleteBusy = signal(false);
  readonly activeSuggestion = signal(-1);
  readonly searched = signal(false);
  readonly invitation = signal<Invitation | null>(null);
  readonly selectedIds = signal<string[]>([]);
  readonly receipt = signal<RsvpReceipt | null>(null);
  readonly steps = ['Find', 'Invitation', 'Attendance', 'Guests'];
  query = '';
  attendance: Attendance | '' = '';
  dietary = '';
  allergies = '';
  song = '';
  message = '';
  private autocompleteTimer?: ReturnType<typeof setTimeout>;
  private autocompleteRequest = 0;

  ngOnDestroy() {
    clearTimeout(this.autocompleteTimer);
    this.autocompleteRequest++;
  }

  private goTo(step: number) {
    this.error.set('');
    this.step.set(step);
    setTimeout(() => this.stepHeading?.nativeElement.focus({ preventScroll: true }));
  }

  queryChanged(value: string) {
    this.query = value;
    this.matches.set([]);
    this.searched.set(false);
    this.error.set('');
    this.cancelAutocomplete();
    if (value.trim().length < 3) return;
    const request = this.autocompleteRequest;
    this.autocompleteTimer = setTimeout(() => this.loadSuggestions(value.trim(), request), 180);
  }

  searchFocused() {
    if (this.suggestions().length && this.query.trim().length >= 3) this.suggestionsOpen.set(true);
  }

  searchBlurred() {
    setTimeout(() => this.suggestionsOpen.set(false), 120);
  }

  searchKeydown(event: KeyboardEvent) {
    const suggestions = this.suggestions();
    if (event.key === 'Escape') {
      this.suggestionsOpen.set(false);
      this.activeSuggestion.set(-1);
      return;
    }
    if (!this.suggestionsOpen() || !suggestions.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      this.activeSuggestion.set((this.activeSuggestion() + direction + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' && this.activeSuggestion() >= 0) {
      event.preventDefault();
      this.selectSuggestion(suggestions[this.activeSuggestion()]);
    }
  }

  selectSuggestion(invitation: Invitation) {
    this.query = invitation.label;
    this.suggestionsOpen.set(false);
    this.chooseInvitation(invitation);
  }

  suggestionId(index: number) {
    return `invitation-suggestion-${index}`;
  }

  private cancelAutocomplete() {
    clearTimeout(this.autocompleteTimer);
    this.autocompleteRequest++;
    this.autocompleteBusy.set(false);
    this.suggestions.set([]);
    this.suggestionsOpen.set(false);
    this.activeSuggestion.set(-1);
  }

  private async loadSuggestions(query: string, request: number) {
    this.autocompleteBusy.set(true);
    try {
      const suggestions = await this.gateway.findInvitations(query);
      if (request !== this.autocompleteRequest || query !== this.query.trim()) return;
      this.suggestions.set(suggestions);
      this.activeSuggestion.set(suggestions.length ? 0 : -1);
      this.suggestionsOpen.set(suggestions.length > 0);
    } catch {
      if (request === this.autocompleteRequest) this.suggestions.set([]);
    } finally {
      if (request === this.autocompleteRequest) this.autocompleteBusy.set(false);
    }
  }

  async search() {
    if (this.busy()) return;
    this.cancelAutocomplete();
    this.error.set('');
    this.matches.set([]);
    this.searched.set(false);
    if (this.query.trim().length < 3) {
      this.error.set('Please enter at least 3 letters from the name on your invitation.');
      return;
    }
    this.busy.set(true);
    try {
      const matches = await this.gateway.findInvitations(this.query.trim());
      this.matches.set(matches);
      this.searched.set(true);
      if (matches.length === 1) this.chooseInvitation(matches[0]);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'We couldn’t look up your invitation. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }

  chooseInvitation(invitation: Invitation) {
    this.cancelAutocomplete();
    this.invitation.set(invitation);
    this.selectedIds.set(invitation.guests.map(guest => guest.id));
    this.attendance = '';
    this.dietary = this.allergies = this.song = this.message = '';
    this.receipt.set(null);
    this.goTo(2);
  }

  findAgain() {
    if (this.busy()) return;
    this.invitation.set(null);
    this.selectedIds.set([]);
    this.matches.set([]);
    this.cancelAutocomplete();
    this.searched.set(false);
    this.receipt.set(null);
    this.goTo(1);
  }

  confirmIdentity() {
    if (this.invitation()) this.goTo(3);
  }

  continueAttendance() {
    if (!this.attendance) {
      this.error.set('Please let us know whether you can join us.');
      return;
    }
    this.goTo(4);
  }

  toggleGuest(id: string, event: Event) {
    if (!this.invitation()?.guests.some(guest => guest.id === id)) return;
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.update(ids => checked ? [...new Set([...ids, id])] : ids.filter(value => value !== id));
    this.error.set('');
  }

  back() {
    if (!this.busy()) this.goTo(Math.max(2, this.step() - 1));
  }

  edit() {
    this.receipt.set(null);
    this.goTo(3);
  }

  async submit() {
    if (this.busy()) return;
    const invitation = this.invitation();
    if (!invitation || !this.attendance) return;
    if (this.attendance === 'accepts' && !this.selectedIds().length) {
      this.error.set('Please select at least one guest, or go back and choose “Regretfully declines.”');
      return;
    }
    this.error.set('');
    this.busy.set(true);
    try {
      const receipt = await this.gateway.submit({
        invitationId: invitation.id,
        attendance: this.attendance,
        guestIds: this.attendance === 'accepts' ? this.selectedIds() : [],
        dietary: this.attendance === 'accepts' ? this.dietary.trim() : '',
        allergies: this.attendance === 'accepts' ? this.allergies.trim() : '',
        song: this.attendance === 'accepts' ? this.song.trim() : '',
        message: this.message.trim(),
      });
      this.receipt.set(receipt);
      this.goTo(5);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'We couldn’t confirm your RSVP. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
