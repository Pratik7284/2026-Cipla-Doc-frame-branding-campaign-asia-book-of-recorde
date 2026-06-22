/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'manager';

export interface UserSession {
  userId: string;
  name: string;
  username: string;
  role: UserRole;
  employeeCode?: string;
  region?: string;
  headquarters?: string;
}

export interface Manager {
  id: string; // matches employeeCode or firestore doc id
  name: string;
  employeeCode: string;
  email: string;
  mobile: string;
  region: string;
  headquarters: string;
  username: string;
  password?: string; // plain text for creation/validation
  targetDoctors: number;
  active: boolean;
  createdAt: string;
}

export interface Doctor {
  id?: string;
  doctorName: string;
  specialization: string;
  hospitalName: string;
  city: string;
  contactNumber: string;
  language: string;
  photoUrl: string; // base64 representation of original photo
  frameId: string;  // id of the selected campaign frame
  creativeUrl: string; // base64 representation of final rendered image
  status: 'Draft' | 'Processing' | 'Generated' | 'Downloaded';
  createdDate: string;
  updatedDate: string;
  managerId: string;
  managerName: string;
}

export interface CampaignFrame {
  id: string;
  name: string;
  theme: string;
  primaryColor: string; // brand-maroon
  secondaryColor: string; // brand-accent
  tagline: string; // "Defeat Hepatitis", "Tenvir AF - Shield of Protection"
  badgeText?: string;
}

export interface ManagerAnalytics {
  managerId: string;
  managerName: string;
  assignedTarget: number;
  totalDoctors: number;
  remainingTarget: number;
  completionPercentage: number;
  creativesGenerated: number;
  pendingCreatives: number;
  failedCreatives: number;
}
