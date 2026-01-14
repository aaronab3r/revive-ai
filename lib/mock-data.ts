import { Lead, LeadStatus } from '@/types';

const firstNames = [
  'Sarah', 'Michael', 'Jennifer', 'David', 'Emily',
  'James', 'Amanda', 'Robert', 'Jessica', 'William',
  'Ashley', 'John', 'Stephanie', 'Christopher', 'Nicole'
];

const lastNames = [
  'Connor', 'Johnson', 'Williams', 'Brown', 'Garcia',
  'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson',
  'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Jackson'
];

const interests = [
  'Implants',
  'Teeth Whitening',
  'Root Canal',
  'Crown Replacement',
  'Invisalign',
  'Routine Checkup',
  'Deep Cleaning',
  'Veneers',
  'Wisdom Teeth',
  'Cavity Filling'
];

const statuses: LeadStatus[] = ['Pending', 'Calling', 'Booked', 'Voicemail'];

// Deterministic pseudo-random number generator for consistent mock data
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generatePhoneNumber(index: number): string {
  const r1 = pseudoRandom(index * 11 + 1);
  const r2 = pseudoRandom(index * 13 + 2);
  const r3 = pseudoRandom(index * 17 + 3);

  const areaCode = Math.floor(r1 * 900) + 100;
  const exchange = Math.floor(r2 * 900) + 100;
  const subscriber = Math.floor(r3 * 9000) + 1000;
  return `${areaCode}${exchange}${subscriber}`;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
  const r = pseudoRandom(index * 23 + 5);
  const domain = domains[Math.floor(r * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function getRandomDate(daysAgo: number, index: number): Date {
  const date = new Date();
  const r = pseudoRandom(index * 29 + 7);
  date.setDate(date.getDate() - Math.floor(r * daysAgo));
  return date;
}

function generateLead(index: number): Lead {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  const r = pseudoRandom(index * 31 + 11);
  const status = statuses[Math.floor(r * statuses.length)];
  
  // Ensure we have a good mix of statuses for demo
  const statusOverrides: LeadStatus[] = [
    'Pending', 'Calling', 'Booked', 'Voicemail', 'Pending',
    'Booked', 'Calling', 'Pending', 'Voicemail', 'Booked',
    'Pending', 'Calling', 'Booked', 'Pending', 'Voicemail'
  ];

  return {
    id: `lead-${index + 1}`,
    name: `${firstName} ${lastName}`,
    phone: generatePhoneNumber(index),
    email: generateEmail(firstName, lastName, index),
    status: statusOverrides[index] || status,
    lastContacted: statusOverrides[index] === 'Pending' ? null : getRandomDate(30, index),
    interest: interests[index % interests.length],
    notes: `Customer interested in ${interests[index % interests.length].toLowerCase()}`,
    createdAt: getRandomDate(60, index + 100),
  };
}

export function generateMockLeads(count: number = 15): Lead[] {
  return Array.from({ length: count }, (_, i) => generateLead(i));
}

export const mockLeads: Lead[] = generateMockLeads(15);

export const mockDashboardStats = {
  totalRevenueRecovered: 12500,
  callsMade: 142,
  appointmentsBooked: 18,
};
