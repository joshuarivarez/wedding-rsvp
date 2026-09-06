import { Invitation } from './rsvp.models';

// Fictional invitations for the preview. Keep the real guest list on your API.
export const MOCK_INVITATIONS: readonly Invitation[] = [
  {
    id: 'demo-dela-cruz',
    label: 'Juan & Maria Dela Cruz',
    greeting: 'Juan & Maria',
    guests: [
      { id: 'demo-juan-dela-cruz', name: 'Juan Dela Cruz', relationship: 'Primary guest' },
      { id: 'demo-maria-dela-cruz', name: 'Maria Dela Cruz', relationship: 'Spouse' },
    ],
  },
  {
    id: 'demo-sofia-reyes',
    label: 'Sofia Reyes',
    greeting: 'Sofia',
    guests: [{ id: 'demo-sofia-reyes', name: 'Sofia Reyes', relationship: 'Primary guest' }],
  },
  {
    id: 'demo-santos-family',
    label: 'The Santos Family',
    greeting: 'the Santos family',
    guests: [
      { id: 'demo-roberto-santos', name: 'Roberto Santos', relationship: 'Primary guest' },
      { id: 'demo-elena-santos', name: 'Elena Santos', relationship: 'Spouse' },
      { id: 'demo-isabel-santos', name: 'Isabel Santos', relationship: 'Daughter' },
    ],
  },
  {
    id: 'demo-juan-mendoza',
    label: 'Juan Mendoza',
    greeting: 'Juan',
    guests: [{ id: 'demo-juan-mendoza', name: 'Juan Mendoza', relationship: 'Primary guest' }],
  },
];
