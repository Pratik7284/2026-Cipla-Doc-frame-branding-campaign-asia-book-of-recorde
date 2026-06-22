/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, LogIn, Lock, User, AlertCircle, Sparkles, Award } from 'lucide-react';
import { loginUser } from '../lib/auth-service';
import { UserSession } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Please fill in both username and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const session = await loginUser(username, password);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Clear your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to easily fill preseeded accounts for reviewers/admins
  const fillPreseeded = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Decorative Branding Mesh Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-maroon/5 rounded-full filter blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-navy/5 rounded-full filter blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 z-10">
        
        {/* Healthcare Platform Card wrapper */}
        <div className="relative w-full max-w-[460px] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden p-8 sm:p-10">
          
          {/* Top CIPLA Logo Strip */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-heading font-extrabold tracking-tight text-brand-maroon">Cipla</span>
              <span className="text-[10px] uppercase font-mono tracking-widest bg-brand-maroon/10 text-brand-maroon px-1.5 py-0.5 rounded font-black">Liver Health</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-brand-navy" fill="rgba(30,46,92,0.1)" />
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Secure Gateway</span>
            </div>
          </div>

          {/* Slogans & Action Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-rose-50 text-brand-maroon px-2.5 py-1 rounded-full text-xs font-semibold mb-3 border border-rose-100 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              DEFEAT HEPATITIS CAMPAIGN
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-950 tracking-tight">Doctor Photo Branding</h2>
            <p className="text-xs text-gray-400 mt-1">Management Platform & Image Generation Engine</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-lg flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block" htmlFor="username-input">
                Username / Employee Code
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="username-input"
                  type="text"
                  placeholder="Enter name or login alias"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white text-sm border border-gray-200 focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon rounded-lg outline-none transition-all placeholder:text-gray-400"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 block" htmlFor="password-input">
                  Platform Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password-input"
                  type="password"
                  placeholder="••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white text-sm border border-gray-200 focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon rounded-lg outline-none transition-all placeholder:text-gray-400"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-lg shadow-md font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Quick Pre-configured Credentials Selector */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">
              Pre-Configured Admin Roles
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button
                id="preset-admin-1"
                type="button"
                onClick={() => fillPreseeded('Pratik Tiwari', 'Pratik@1234')}
                className="p-2 border border-dashed border-gray-200 hover:border-brand-maroon rounded text-left hover:bg-rose-50/20 transition-colors"
              >
                <div className="font-bold text-gray-800">Pratik Tiwari</div>
                <div className="text-gray-400 font-mono">Pratik@1234</div>
              </button>
              <button
                id="preset-admin-2"
                type="button"
                onClick={() => fillPreseeded('Anusha Ramani', 'Anusha@1234')}
                className="p-2 border border-dashed border-gray-200 hover:border-brand-maroon rounded text-left hover:bg-rose-50/20 transition-colors"
              >
                <div className="font-bold text-gray-800">Anusha Ramani</div>
                <div className="text-gray-400 font-mono">Anusha@1234</div>
              </button>
              <button
                id="preset-admin-3"
                type="button"
                onClick={() => fillPreseeded('Alok Dubey', 'Alok@1234')}
                className="p-2 border border-dashed border-gray-200 hover:border-brand-maroon rounded text-left hover:bg-rose-50/20 transition-colors"
              >
                <div className="font-bold text-gray-800">Alok Dubey</div>
                <div className="text-gray-400 font-mono">Alok@1234</div>
              </button>
              <button
                id="preset-admin-4"
                type="button"
                onClick={() => fillPreseeded('Vaibhav Sipla', 'Vaibhav@1234')}
                className="p-2 border border-dashed border-gray-200 hover:border-brand-maroon rounded text-left hover:bg-rose-50/20 transition-colors"
              >
                <div className="font-bold text-gray-800">Vaibhav Sipla</div>
                <div className="text-gray-400 font-mono">Vaibhav@1234</div>
              </button>
            </div>

            <div className="mt-3">
              <span className="text-[9px] text-gray-400 text-center block">
                Managers can login with their Employee Code or Username. Default password is <span className="font-bold font-mono">Cipla@1234</span>
              </span>
              {/* Quick Login for a manager */}
              <button
                id="preset-manager-1"
                type="button"
                onClick={() => fillPreseeded('rajesh.sharma', 'Cipla@1234')}
                className="w-full mt-2 py-1.5 text-[10px] bg-slate-100 hover:bg-slate-200 hover:text-brand-maroon text-gray-600 rounded font-semibold transition-colors"
              >
                Switch to Manager: Rajesh Sharma
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Branding - display Defeat Hepatitis, Tenvir AF, International Book of Records Logos */}
      <div className="bg-white border-t border-gray-100 py-6 px-4 z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xs font-bold text-gray-700">Cipla Ltd. campaigns</h3>
            <p className="text-[10px] text-gray-400">Supporting healthcare initiatives globally since 1935.</p>
          </div>

          {/* Three branded clinical badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400">
            {/* Logo 1: Defeat Hepatitis Logo */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-5 last:border-0 last:pr-0">
              <div className="w-8 h-8 rounded-full bg-brand-maroon flex items-center justify-center text-white font-extrabold text-xs">
                DH
              </div>
              <div className="text-left font-sans">
                <div className="text-[9.5px] font-black text-brand-maroon tracking-tight uppercase">DEFEAT HEPATITIS</div>
                <div className="text-[8px] text-gray-400 font-medium">CAMPAIGN INITIATIVE</div>
              </div>
            </div>

            {/* Logo 2: Tenvir AF Shield */}
            <div className="flex items-center gap-1.5 border-r border-gray-200 pr-5 last:border-0 last:pr-0">
              <ShieldCheck className="w-8 h-8 text-brand-navy" fill="rgba(30,46,92,0.1)" />
              <div className="text-left">
                <div className="text-[10px] font-extrabold text-brand-navy uppercase tracking-tighter">Tenvir AF</div>
                <div className="text-[8px] text-gray-400">LIVER MULTISHIELD</div>
              </div>
            </div>

            {/* Logo 3: International Book of Records */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[9.5px] font-bold text-amber-700">RECORD ENLISTED</div>
                <div className="text-[8px] text-gray-400">INTERNATIONAL BOOK</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
