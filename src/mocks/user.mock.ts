export type UserRole = 'END_USER' | 'RESELLER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string;
  occupation: string;
  deviceId: string;
  role: UserRole;
  isActive: boolean;
  registrationDate: string;
  resellerId?: string; // If End User was onboarded by a Reseller
}

// Current Logged-in User (Mock End User)
export const mockCurrentUser: User = {
  id: '12345678',
  name: 'Umar',
  email: 'umar@example.com',
  phone: '+1234567890',
  country: 'UK',
  occupation: 'Subscriber',
  deviceId: 'A1:B2:C3:D4:E5:F6',
  role: 'END_USER',
  isActive: true,
  registrationDate: '2026-07-28T00:00:00Z',
};

// Mock Reseller Profile
export const mockResellerUser: User = {
  id: 'RES-492019',
  name: 'Bilal',
  email: 'bilal.iptv@example.com',
  phone: null,
  country: 'UAE',
  occupation: 'IPTV Operator',
  deviceId: 'IPTV-B8292C92X',
  role: 'RESELLER',
  isActive: true,
  registrationDate: '2026-01-15T00:00:00Z',
};
