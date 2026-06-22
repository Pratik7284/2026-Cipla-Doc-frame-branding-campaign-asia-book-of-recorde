/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserSession, Manager } from '../types';
import { getAllManagers } from './db-service';

// Predefined Admins
const ADMINS = [
  { name: 'Pratik Tiwari', username: 'Pratik Tiwari', password: 'Pratik@1234' },
  { name: 'Anusha Ramani', username: 'Anusha Ramani', password: 'Anusha@1234' },
  { name: 'Alok Dubey', username: 'Alok Dubey', password: 'Alok@1234' },
  { name: 'Vaibhav Sipla', username: 'Vaibhav Sipla', password: 'Vaibhav@1234' }
];

export async function loginUser(usernameInput: string, passwordInput: string): Promise<UserSession> {
  const username = usernameInput.trim();
  const password = passwordInput.trim();

  // 1. Check Pre-configured Admins
  const matchedAdmin = ADMINS.find(admin => 
    admin.username.toLowerCase() === username.toLowerCase() && 
    admin.password === password
  );

  if (matchedAdmin) {
    const session: UserSession = {
      userId: `admin-${matchedAdmin.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: matchedAdmin.name,
      username: matchedAdmin.username,
      role: 'admin'
    };
    localStorage.setItem('cipla_hep_session', JSON.stringify(session));
    return session;
  }

  // 2. Check Managers in DB
  const managers = await getAllManagers();
  const matchedManager = managers.find((mgr: Manager) => 
    (mgr.username.toLowerCase() === username.toLowerCase() || 
     mgr.employeeCode.toLowerCase() === username.toLowerCase() || 
     mgr.email.toLowerCase() === username.toLowerCase()) && 
    (mgr.password === password || password === 'Cipla@1234') // Default fallback for preseeded logins
  );

  if (matchedManager) {
    if (!matchedManager.active) {
      throw new Error("Your manager profile is deactivated. Please contact administrator.");
    }
    const session: UserSession = {
      userId: matchedManager.id,
      name: matchedManager.name,
      username: matchedManager.username,
      role: 'manager',
      employeeCode: matchedManager.employeeCode,
      region: matchedManager.region,
      headquarters: matchedManager.headquarters
    };
    localStorage.setItem('cipla_hep_session', JSON.stringify(session));
    return session;
  }

  throw new Error("Invalid username or password. Please verify your credentials.");
}

export function getCurrentSession(): UserSession | null {
  const cached = localStorage.getItem('cipla_hep_session');
  if (!cached) return null;
  try {
    return JSON.parse(cached) as UserSession;
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem('cipla_hep_session');
}
