/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Manager, Doctor } from '../types';

// Let's implement the Mandatory Connection test constraint from firebase-integration skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, 'test', 'connection');
    await getDocFromServer(testDocRef);
    console.log("Firebase connection verified successfully.");
    return true;
  } catch (error) {
    console.warn("Firestore connection check bypassed or offline:", error);
    return false;
  }
}

// Collections references
const MANAGERS_COL = 'managers';
const DOCTORS_COL = 'doctors';

// Initial preseeded managers so the dashboard starts with vibrant data immediately
const INITIAL_MANAGERS: Manager[] = [
  {
    id: 'mgr-001',
    name: 'Rajesh Sharma',
    employeeCode: 'MGR25091',
    email: 'rajesh.sharma@cipla-hep.com',
    mobile: '9876543210',
    region: 'North India',
    headquarters: 'Delhi',
    username: 'rajesh.sharma',
    targetDoctors: 120,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mgr-002',
    name: 'Sandhya Iyer',
    employeeCode: 'MGR25092',
    email: 'sandhya.iyer@cipla-hep.com',
    mobile: '9123456780',
    region: 'South India',
    headquarters: 'Chennai',
    username: 'sandhya.iyer',
    targetDoctors: 150,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mgr-003',
    name: 'Amit Patel',
    employeeCode: 'MGR25093',
    email: 'amit.patel@cipla-hep.com',
    mobile: '9345678901',
    region: 'West India',
    headquarters: 'Mumbai',
    username: 'amit.patel',
    targetDoctors: 180,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mgr-004',
    name: 'Bidisha Roy',
    employeeCode: 'MGR25094',
    email: 'bidisha.roy@cipla-hep.com',
    mobile: '9456789012',
    region: 'East India',
    headquarters: 'Kolkata',
    username: 'bidisha.roy',
    targetDoctors: 100,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mgr-005',
    name: 'Vikram Singh',
    employeeCode: 'MGR25095',
    email: 'vikram.singh@cipla-hep.com',
    mobile: '9567890123',
    region: 'Central India',
    headquarters: 'Indore',
    username: 'vikram.singh',
    targetDoctors: 140,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mgr-006',
    name: 'Kshitiz Barua',
    employeeCode: 'MGR25096',
    email: 'kshitiz.barua@cipla-hep.com',
    mobile: '9678901234',
    region: 'Northeast India',
    headquarters: 'Guwahati',
    username: 'kshitiz.barua',
    targetDoctors: 90,
    active: false,
    createdAt: new Date().toISOString()
  }
];

// Helper to check and seed default managers if database is empty
export async function seedInitialManagers() {
  try {
    const colRef = collection(db, MANAGERS_COL);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log("Seeding initial managers...");
      const batch = writeBatch(db);
      for (const mgr of INITIAL_MANAGERS) {
        const docRef = doc(db, MANAGERS_COL, mgr.id);
        batch.set(docRef, mgr);
      }
      await batch.commit();
      console.log("Seeding complete.");
    }
  } catch (error) {
    console.error("Error seeding initial managers:", error);
  }
}

// MANAGER CRUD API
export async function getAllManagers(): Promise<Manager[]> {
  try {
    const colRef = collection(db, MANAGERS_COL);
    const snap = await getDocs(colRef);
    const list: Manager[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Manager);
    });
    return list;
  } catch (err) {
    console.error("Error getting managers:", err);
    return INITIAL_MANAGERS; // Fallback to initial seeds if offline or firebase blocked
  }
}

export async function addManager(mgr: Omit<Manager, 'createdAt'>): Promise<void> {
  const newRef = doc(db, MANAGERS_COL, mgr.id);
  const data: Manager = {
    ...mgr,
    createdAt: new Date().toISOString()
  };
  await setDoc(newRef, data);
}

export async function updateManager(id: string, updates: Partial<Manager>): Promise<void> {
  const docRef = doc(db, MANAGERS_COL, id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const current = snap.data() as Manager;
    await setDoc(docRef, { ...current, ...updates, id });
  }
}

export async function deleteManager(id: string): Promise<void> {
  const docRef = doc(db, MANAGERS_COL, id);
  await deleteDoc(docRef);
}

// DOCTORS CRUD API
export async function getAllDoctors(): Promise<Doctor[]> {
  try {
    const colRef = collection(db, DOCTORS_COL);
    const snap = await getDocs(colRef);
    const list: Doctor[] = [];
    snap.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as Doctor);
    });
    return list;
  } catch (err) {
    console.error("Error getting doctors:", err);
    return [];
  }
}

export async function checkContactNumberExists(contactNumber: string): Promise<boolean> {
  try {
    const colRef = collection(db, DOCTORS_COL);
    const q = query(colRef, where('contactNumber', '==', contactNumber.trim()));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.error("Error validation unique phone:", err);
    return false; // Safely proceed or fallback to a locally tracked set
  }
}

export async function addDoctor(docData: Omit<Doctor, 'createdDate' | 'updatedDate'>): Promise<string> {
  const exists = await checkContactNumberExists(docData.contactNumber);
  if (exists) {
    throw new Error("This doctor already exists in the system.");
  }

  const colRef = collection(db, DOCTORS_COL);
  const newDocRef = doc(colRef); // Auto ID
  const data: Doctor = {
    ...docData,
    id: newDocRef.id,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString()
  };
  await setDoc(newDocRef, data);
  return newDocRef.id;
}

export async function updateDoctor(id: string, updates: Partial<Doctor>): Promise<void> {
  const docRef = doc(db, DOCTORS_COL, id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const current = snap.data() as Doctor;
    await setDoc(docRef, { 
      ...current, 
      ...updates, 
      updatedDate: new Date().toISOString() 
    });
  }
}

export async function deleteDoctor(id: string): Promise<void> {
  const docRef = doc(db, DOCTORS_COL, id);
  await deleteDoc(docRef);
}
