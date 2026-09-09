export interface InvitedGuest {
  id: string;
  name: string;
  relationship: string;
}

export interface Invitation {
  id: string;
  label: string;
  greeting: string;
  guests: readonly InvitedGuest[];
}

export type Attendance = 'accepts' | 'declines';

export interface RsvpResponse {
  invitationId: string;
  attendance: Attendance;
  guestIds: string[];
  message?: string;
}

export interface RsvpReceipt {
  id: string;
  savedAt: string;
  mode: 'mock' | 'live';
}

export interface RsvpGateway {
  readonly mode: 'mock' | 'live';
  findInvitations(name: string): Promise<Invitation[]>;
  submit(response: RsvpResponse): Promise<RsvpReceipt>;
}
