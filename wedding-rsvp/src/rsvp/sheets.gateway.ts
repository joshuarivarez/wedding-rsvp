import { Invitation, RsvpGateway, RsvpReceipt, RsvpResponse } from './rsvp.models';

export class SheetsRsvpGateway implements RsvpGateway {
  readonly mode = 'live' as const;
  constructor(private readonly url: string) {}

  private async request<T>(body: object): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.url, {
        method: 'POST',
        // A simple request avoids the preflight Apps Script does not handle.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        credentials: 'omit',
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw new Error('We could not confirm a response from the guest list. Please try again.');
    }
    if (!response.ok) throw new Error('The guest list is unavailable. Please try again.');
    let result: { ok: boolean; data: T; error?: string };
    try { result = await response.json(); }
    catch { throw new Error('The guest list returned an unexpected response. Please contact the couple.'); }
    if (result.ok !== true) throw new Error(result.error || 'We could not complete your request.');
    return result.data;
  }

  findInvitations(name: string): Promise<Invitation[]> {
    return this.request({ action: 'search', name });
  }

  submit(response: RsvpResponse): Promise<RsvpReceipt> {
    return this.request({ action: 'submit', response });
  }
}
