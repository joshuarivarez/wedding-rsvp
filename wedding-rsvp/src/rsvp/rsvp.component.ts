import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RSVP_GATEWAY } from './rsvp.gateway';
import { Attendance, Invitation, RsvpReceipt } from './rsvp.models';

@Component({
  selector: 'wedding-rsvp',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './rsvp.component.html',
  styleUrls: ['./rsvp.component.css', './search-results.css', './guest-checklist.css'],
})
export class RsvpComponent {
  private readonly gateway = inject(RSVP_GATEWAY);
  readonly isMock = this.gateway.mode === 'mock';
  @ViewChild('stepHeading') stepHeading?: ElementRef<HTMLElement>;
  readonly step = signal(1);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly matches = signal<Invitation[]>([]);
  readonly searched = signal(false);
  readonly invitation = signal<Invitation | null>(null);
  readonly selectedIds = signal<string[]>([]);
  readonly plusOneIds = signal<string[]>([]);
  readonly receipt = signal<RsvpReceipt | null>(null);
  readonly steps = ['Find', 'Invitation', 'Attendance', 'Guests'];
  query = '';
  attendance: Attendance | '' = '';
  message = '';
  private goTo(step: number) {
    this.error.set('');
    this.step.set(step);
    setTimeout(() => {
      const heading = this.stepHeading?.nativeElement;
      heading?.focus({ preventScroll: true });
      if (step === 5) heading?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  queryChanged(value: string) {
    this.query = value;
    this.matches.set([]);
    this.searched.set(false);
    this.error.set('');
  }

  async search() {
    if (this.busy()) return;
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
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'We couldn’t look up your invitation. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }

  chooseInvitation(invitation: Invitation) {
    this.invitation.set(invitation);
    this.selectedIds.set([]);
    this.plusOneIds.set([]);
    this.attendance = '';
    this.message = '';
    this.receipt.set(null);
    this.goTo(2);
  }

  findAgain() {
    if (this.busy()) return;
    this.invitation.set(null);
    this.selectedIds.set([]);
    this.matches.set([]);
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
    if (!checked) this.plusOneIds.update(ids => ids.filter(value => value !== id));
    this.error.set('');
  }

  togglePlusOne(id: string, event: Event) {
    const guest = this.invitation()?.guests.find(item => item.id === id);
    if (!guest?.havePlusOne || !this.selectedIds().includes(id)) return;
    const checked = (event.target as HTMLInputElement).checked;
    this.plusOneIds.update(ids => checked ? [...new Set([...ids, id])] : ids.filter(value => value !== id));
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
        plusOneGuestIds: this.attendance === 'accepts' ? this.plusOneIds() : [],
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
