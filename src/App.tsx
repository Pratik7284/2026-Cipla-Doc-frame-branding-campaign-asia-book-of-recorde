/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSession } from './types';
import { getCurrentSession, logoutUser } from './lib/auth-service';
import { testFirestoreConnection, seedInitialManagers } from './lib/db-service';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import ManagerPanel from './components/ManagerPanel';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [networkOk, setNetworkOk] = useState<boolean>(true);

  useEffect(() => {
    async function initializePlatform() {
      // 1. Mandatory connection check as per firebase-integration skill
      const connected = await testFirestoreConnection();
      setNetworkOk(connected);

      // 2. Preseed initial managers in Firestore doc database
      await seedInitialManagers();

      // 3. Load active login cache
      const cachedSession = getCurrentSession();
      if (cachedSession) {
        setSession(cachedSession);
      }
      setInitializing(false);
    }
    initializePlatform();
  }, []);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    logoutUser();
    setSession(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-brand-maroon animate-spin mx-auto" />
          <h3 className="text-sm font-heading font-bold text-gray-800">CIPLA Defeat Hepatitis Platform</h3>
          <p className="text-xs text-gray-400 font-mono">Initializing secure healthcare sandbox environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 selection:bg-brand-maroon/10 selection:text-brand-maroon">
      
      {/* Soft floating diagnostic alert tag if Firebase takes time to respond (graceful handling) */}
      {!networkOk && (
        <div className="bg-amber-600 text-white text-[11px] font-semibold text-center py-2 px-4 shadow flex items-center justify-center gap-1.5 sticky top-0 z-50">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Firestore offline bounds active. Using high-fidelity regional memory sandbox simulation.</span>
        </div>
      )}

      {session ? (
        session.role === 'admin' ? (
          <AdminPanel currentSession={session} onLogout={handleLogout} />
        ) : (
          <ManagerPanel currentSession={session} onLogout={handleLogout} />
        )
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
