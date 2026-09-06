import { Injectable, InjectionToken } from '@angular/core';
import { MOCK_INVITATIONS } from './mock-invitations';
import { Invitation, RsvpGateway, RsvpReceipt, RsvpResponse } from './rsvp.models';

export const RSVP_GATEWAY = new InjectionToken<RsvpGateway>('RSVP_GATEWAY');
export const MOCK_RSVP_STORAGE_KEY = 'wedding-rsvp:mock:v1';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('en').replace(/&/g, ' and ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const delay = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds));

@Injectable()
export class MockRsvpGateway implements RsvpGateway {
  readonly mode = 'mock' as const;

  async findInvitations(name: string): Promise<Invitation[]> {
    await delay(250);
    const query = normalize(name);
    if (query.length < 3) throw new Error('Please enter at least 3 letters from the name on your invitation.');
    const tokens = query.split(' ').filter(token => token !== 'and');
    if (!tokens.length) return [];
    return MOCK_INVITATIONS.filter(invitation => {
      const searchable = normalize([invitation.label, ...invitation.guests.map(guest => guest.name)].join(' '));
      return tokens.every(token => searchable.split(' ').some(word => word.startsWith(token)));
    }).map(invitation => structuredClone(invitation));
  }

  async submit(response: RsvpResponse): Promise<RsvpReceipt> {
    await delay(450);
    const invitation = MOCK_INVITATIONS.find(item => item.id === response.invitationId);
    if (!invitation) throw new Error('Please find your invitation again before confirming.');
    if (!['accepts', 'declines'].includes(response.attendance)) throw new Error('Please choose your attendance.');
    const allowedIds = new Set(invitation.guests.map(guest => guest.id));
    if (!Array.isArray(response.guestIds) || response.guestIds.some(id => !allowedIds.has(id)) ||
      new Set(response.guestIds).size !== response.guestIds.length) {
      throw new Error('Please select only the guests listed on your invitation.');
    }
    if (response.attendance === 'accepts' && !response.guestIds.length) {
      throw new Error('Please select at least one guest, or choose “Regretfully declines.”');
    }
    if (response.attendance === 'declines' && response.guestIds.length) {
      throw new Error('A declined invitation cannot include attending guests.');
    }
    for (const [field, limit] of [['dietary', 500], ['allergies', 500], ['song', 150], ['message', 1000]] as const) {
      if (typeof response[field] !== 'string' || response[field].length > limit) {
        throw new Error('Please shorten your notes before confirming.');
      }
    }
    const receipt: RsvpReceipt = { id: `mock-${invitation.id}`, savedAt: new Date().toISOString(), mode: this.mode };
    try {
      const raw = localStorage.getItem(MOCK_RSVP_STORAGE_KEY);
      const records = raw ? JSON.parse(raw) : {};
      if (!records || typeof records !== 'object' || Array.isArray(records)) throw new Error('Invalid saved records');
      records[invitation.id] = { ...response, receipt };
      localStorage.setItem(MOCK_RSVP_STORAGE_KEY, JSON.stringify(records));
    } catch {
      throw new Error('We couldn’t save your preview RSVP. Please allow browser storage and try again. Your choices are still here.');
    }
    return receipt;
  }
}
