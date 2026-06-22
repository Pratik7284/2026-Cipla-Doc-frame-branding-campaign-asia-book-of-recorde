/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, BookOpen, Download, Trash2, Edit, CheckCircle2, 
  HelpCircle, ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles, Loader2, LogOut,
  Menu, X
} from 'lucide-react';
import { Doctor, UserSession, CampaignFrame, Manager } from '../types';
import { 
  getAllDoctors, addDoctor, updateDoctor, deleteDoctor, 
  checkContactNumberExists, getAllManagers, updateManager 
} from '../lib/db-service';
import { CAMPAIGN_FRAMES, LANGUAGES, SPECIALIZATIONS, LEAD_CITIES } from '../data/frames';
import CanvasStudio from './CanvasStudio';

interface ManagerPanelProps {
  currentSession: UserSession;
  onLogout: () => void;
}

export default function ManagerPanel({ currentSession, onLogout }: ManagerPanelProps) {
  // Navigation tabs: 'dashboard' | 'add-doctor' | 'doctors-list'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add-doctor' | 'doctors-list'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Load Manager's target doctors dynamically from Firestore
  const [managerProfile, setManagerProfile] = useState<Partial<Manager>>({
    targetDoctors: currentSession.employeeCode ? 120 : 100 // fallback
  });

  // Doctor records
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination
  const [doctorPage, setDoctorPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Search & Filters for Manager's Doctors
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Form Fields for Add/Edit Doctor Campaign
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [docName, setDocName] = useState<string>('');
  const [docSpec, setDocSpec] = useState<string>('Hepatologist');
  const [docHospital, setDocHospital] = useState<string>('');
  const [docCity, setDocCity] = useState<string>('Mumbai');
  const [docMobile, setDocMobile] = useState<string>('');
  const [docLang, setDocLang] = useState<string>('English');
  const [docFrameId, setDocFrameId] = useState<string>('frame-defeat-hepatitis');
  
  // Doctor photo reference states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [creativeBase64, setCreativeBase64] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch doctors and sync profile
  const fetchData = async () => {
    setLoading(true);
    try {
      const allDocs = await getAllDoctors();
      // Only view records belonging to this logged-in manager
      const filteredByManager = allDocs.filter(d => d.managerId === currentSession.userId);
      setDoctors(filteredByManager);

      // Grab current manager profile update to sync target doctors
      const mgrList = await getAllManagers();
      const me = mgrList.find(m => m.id === currentSession.userId);
      if (me) {
        setManagerProfile(me);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentSession.userId]);

  // Handle image drag-and-drop file upload conversion
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.target?.files?.[0] || e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setFormError("Unsupported file format. Please upload a JPG, JPEG, or PNG image.");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string || '');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setFormError("Unsupported format. Drop a valid JPG or PNG image.");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string || '');
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit doctor record to Firestore with duplicate validation check
  const handleSubmitDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!docName.trim()) { return setFormError("Doctor Name is required."); }
    if (!docSpec.trim()) { return setFormError("Medical Specialization is required."); }
    if (!docCity.trim()) { return setFormError("Target City Location is required."); }
    if (!photoUrl) { return setFormError("Please upload a doctor profile photo to proceed with branding."); }

    setSubmitting(true);

    const finalHospital = docHospital.trim() || 'Cipla Clinic';
    const finalLang = docLang || 'English';
    const finalFrameId = docFrameId || 'frame-defeat-hepatitis';
    
    // Generate a secure unique value for doctor contact if not entered
    const finalMobile = docMobile.trim() || `CIPLA-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      if (editingDoctorId) {
        // Edit flow
        const updatedDoc: Partial<Doctor> = {
          doctorName: docName.trim(),
          specialization: docSpec.trim(),
          hospitalName: finalHospital,
          city: docCity.trim(),
          contactNumber: finalMobile,
          language: finalLang,
          frameId: finalFrameId,
          photoUrl: photoUrl,
          creativeUrl: creativeBase64 || photoUrl, // Fallback if unmodified
          status: creativeBase64 ? 'Generated' : 'Draft',
        };
        await updateDoctor(editingDoctorId, updatedDoc);
      } else {
        // Add flow - Validate contact number is strictly unique across ALL system
        const phoneExists = await checkContactNumberExists(finalMobile);
        if (phoneExists) {
          throw new Error("This doctor already exists in the system. Duplicates are restricted.");
        }

        const newDoc: Omit<Doctor, 'createdDate' | 'updatedDate'> = {
          doctorName: docName.trim(),
          specialization: docSpec.trim(),
          hospitalName: finalHospital,
          city: docCity.trim(),
          contactNumber: finalMobile,
          language: finalLang,
          frameId: finalFrameId,
          photoUrl: photoUrl,
          creativeUrl: creativeBase64 || photoUrl,
          status: creativeBase64 ? 'Generated' : 'Draft',
          managerId: currentSession.userId,
          managerName: currentSession.name
        };
        await addDoctor(newDoc);
      }

      // Success
      setActiveTab('doctors-list');
      await fetchData();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || "Could not save doctor profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingDoctorId(null);
    setDocName('');
    setDocSpec('Hepatologist');
    setDocHospital('');
    setDocCity('Mumbai');
    setDocMobile('');
    setDocLang('English');
    setDocFrameId('frame-defeat-hepatitis');
    setPhotoFile(null);
    setPhotoUrl('');
    setCreativeBase64('');
    setFormError(null);
  };

  const handleTriggerEdit = (docItem: Doctor) => {
    setEditingDoctorId(docItem.id || null);
    setDocName(docItem.doctorName);
    setDocSpec(docItem.specialization);
    setDocHospital(docItem.hospitalName || '');
    setDocCity(docItem.city);
    // Hide default random CIPLA values if editing
    setDocMobile(docItem.contactNumber.startsWith('CIPLA-') ? '' : docItem.contactNumber);
    setDocLang(docItem.language || 'English');
    setDocFrameId(docItem.frameId || 'frame-defeat-hepatitis');
    setPhotoUrl(docItem.photoUrl);
    setCreativeBase64(docItem.creativeUrl || '');
    setActiveTab('add-doctor');
  };

  const handleDeleteDoctorClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this doctor?")) {
      try {
        await deleteDoctor(id);
        await fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Automatically update status to 'Downloaded' upon creative download triggering
  const handleCreativeDownloaded = async (docItem: Doctor) => {
    if (docItem.id && docItem.status !== 'Downloaded') {
      try {
        await updateDoctor(docItem.id, { status: 'Downloaded' });
        await fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const triggerDownloadedDirect = async () => {
    if (editingDoctorId) {
      try {
        await updateDoctor(editingDoctorId, { status: 'Downloaded' });
        await fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filters process
  const filteredDoctors = doctors.filter(d => {
    const searchMatch = !searchQuery || 
      d.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.contactNumber.includes(searchQuery) ||
      d.specialization.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = selectedStatus === 'All' || d.status === selectedStatus;

    return searchMatch && statusMatch;
  });

  // Pagination logic
  const paginatedDoctors = filteredDoctors.slice((doctorPage - 1) * itemsPerPage, doctorPage * itemsPerPage);
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);

  // Derived dashboard count cards
  const targetVal = managerProfile.targetDoctors || 120;
  const docsCount = doctors.length;
  const remainingVal = Math.max(0, targetVal - docsCount);
  const completionPercentage = targetVal > 0 ? Math.round((docsCount / targetVal) * 100) : 0;
  const creativesGeneratedCount = doctors.filter(d => d.status === 'Generated' || d.status === 'Downloaded').length;
  const pendingCount = doctors.filter(d => d.status === 'Draft' || d.status === 'Processing').length;

  const exportMyDoctorsCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Doctor Name,Specialization,Hospital Name,City,Contact Number,Language,Status,Created Date\n";
    
    filteredDoctors.forEach(d => {
      const row = [
        `"${d.doctorName}"`,
        `"${d.specialization}"`,
        `"${d.hospitalName}"`,
        `"${d.city}"`,
        `"${d.contactNumber}"`,
        `"${d.language}"`,
        `"${d.status}"`,
        `"${new Date(d.createdDate).toLocaleDateString()}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `My_Doctors_Report_${currentSession.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Manager Specific Navigation Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-heading font-black text-brand-maroon tracking-tight">Cipla</span>
            <div className="h-5 w-[1.5px] bg-gray-200"></div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-gray-500 uppercase block tracking-wider">Territory Campaign Coordinator</span>
              <span className="text-xs font-semibold text-brand-navy block -mt-0.5">{currentSession.name} ({currentSession.region || 'Regional'})</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              id="manager-logout-btn"
              onClick={onLogout}
              className="px-3 py-1.5 bg-gray-50 hover:bg-rose-50 hover:text-brand-maroon border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> logout
            </button>
          </div>

          {/* Responsive Mobile Menu Trigger */}
          <div className="md:hidden flex items-center">
            <button
              id="manager-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-brand-maroon focus:outline-none"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-brand-maroon" /> : <Menu className="w-5 h-5 text-brand-maroon" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2 shadow-inner animate-in slide-in-from-top duration-200">
            <div className="text-xs text-gray-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-2">
              Sections Navigation
            </div>
            <button
              id="manager-mobile-nav-dashboard"
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${activeTab === 'dashboard' ? 'bg-brand-maroon text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              📊 Performance Dashboard
            </button>
            <button
              id="manager-mobile-nav-add"
              onClick={() => { resetForm(); setActiveTab('add-doctor'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${activeTab === 'add-doctor' ? 'bg-brand-maroon text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Plus className="w-4 h-4" /> Add Doctor Campaign
            </button>
            <button
              id="manager-mobile-nav-list"
              onClick={() => { setActiveTab('doctors-list'); setDoctorPage(1); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${activeTab === 'doctors-list' ? 'bg-brand-maroon text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <BookOpen className="w-4 h-4" /> Registered Doctor List ({doctors.length})
            </button>
            
            <div className="border-t border-gray-100 pt-2 mt-2">
              <button
                id="manager-mobile-nav-logout"
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 text-left transition-all"
              >
                <LogOut className="w-4 h-4" /> System Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs bar */}
        <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
          <button
            id="manager-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'dashboard' ? 'border-brand-maroon text-brand-maroon bg-white rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            📊 Performance Dashboard
          </button>
          <button
            id="manager-tab-add"
            onClick={() => { resetForm(); setActiveTab('add-doctor'); }}
            className={`py-3 px-6 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'add-doctor' ? 'border-brand-maroon text-brand-maroon bg-white rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <Plus className="w-4 h-4" /> Add Doctor Campaign
          </button>
          <button
            id="manager-tab-list"
            onClick={() => { setActiveTab('doctors-list'); setDoctorPage(1); }}
            className={`py-3 px-6 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'doctors-list' ? 'border-brand-maroon text-brand-maroon bg-white rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <BookOpen className="w-4 h-4" /> Registered Doctor List ({doctors.length})
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white border border-gray-100 rounded-xl shadow-xs">
            <Loader2 className="w-10 h-10 text-brand-maroon animate-spin" />
            <p className="text-xs text-gray-400 font-medium font-mono">Syncing Manager Portal...</p>
          </div>
        ) : (
          <div>
            
            {/* VIEW 1: PERFORMANCE DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Assigned Target doctors</p>
                    <p className="text-2xl font-heading font-bold text-gray-800 mt-1">{targetVal}</p>
                    <div className="text-[10px] text-gray-400 mt-1">Expected target completion quota</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-brand-maroon">
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Total Doctors Tracked</p>
                    <p className="text-2xl font-heading font-bold text-brand-maroon mt-1">{docsCount}</p>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">+{completionPercentage}% progress completed</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Remaining Target</p>
                    <p className="text-2xl font-heading font-bold text-gray-800 mt-1">{remainingVal}</p>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div className="bg-brand-maroon h-full rounded-full" style={{ width: `${completionPercentage}%` }} />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Creatives Generates</p>
                    <p className="text-2xl font-heading font-bold text-brand-navy mt-1">{creativesGeneratedCount}</p>
                    <div className="text-[10px] text-gray-400 mt-1">Drafts/Pending: {pendingCount}</div>
                  </div>
                </div>

                {/* Regional performance overview splash */}
                <div className="bg-gradient-to-r from-brand-maroon to-brand-maroon-dark p-6 sm:p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full filter blur-2xl pointer-events-none"></div>
                  <div className="space-y-2 max-w-lg">
                    <div className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                      <Sparkles className="w-3 h-3 text-amber-300" /> Regional Campaign Progress Statement
                    </div>
                    <h3 className="text-lg sm:text-xl font-heading font-extrabold tracking-tight">Your Liver Wellness Brand Ambassador Target</h3>
                    <p className="text-xs text-rose-100 leading-relaxed">
                      You are assigned to the <span className="font-bold underline">{currentSession.region || 'National'}</span> region. Recruit Hepatology, Gastroenterology team of clinicians. Enter details and configure dynamic branded templates safely below to meet critical timelines.
                    </p>
                  </div>
                  <button
                    id="dash-add-doc-shortcut"
                    onClick={() => { resetForm(); setActiveTab('add-doctor'); }}
                    className="px-5 py-2.5 bg-white hover:bg-rose-50 text-brand-maroon font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Recruit Doctor Now
                  </button>
                </div>

              </div>
            )}

            {/* VIEW 2: ADD & EDIT DOCTOR FORM with dynamic photo canvas generator */}
            {activeTab === 'add-doctor' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT PORTION: DATA FILL FORM */}
                <div className="lg:col-span-6 bg-white border border-gray-100 p-6 rounded-xl shadow-sm space-y-6">
                  <div>
                    <h3 className="font-heading font-extrabold text-gray-900 text-base">
                      {editingDoctorId ? "Modify Doctor Campaign Profile" : "Register Doctor Campaign Profile"}
                    </h3>
                    <p className="text-xs text-gray-400">Fill details and assign standard branding formats. Slogans will auto-calculate.</p>
                  </div>

                  <form onSubmit={handleSubmitDoctor} className="space-y-4">
                    {formError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-lg">
                        {formError}
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase">Doctor Name *</span>
                      <input
                        id="input-dr-name"
                        type="text"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder="E.g., Dr. Ajay H. Shah"
                        className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-brand-maroon rounded-lg outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase">Medical Specialization *</span>
                        <input
                          id="input-dr-spec"
                          type="text"
                          value={docSpec}
                          onChange={(e) => setDocSpec(e.target.value)}
                          placeholder="E.g., Hepatologist"
                          className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-brand-maroon rounded-lg outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase">Target City Location *</span>
                        <input
                          id="input-dr-city"
                          type="text"
                          value={docCity}
                          onChange={(e) => setDocCity(e.target.value)}
                          placeholder="E.g., Mumbai"
                          className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-brand-maroon rounded-lg outline-none transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* DOCTOR RECRUIT PHOTO selector with drag and drop */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase block">Upload Doctor Profile Photo *</span>
                      <div
                        id="photo-drag-drop-area"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-gray-200 hover:border-brand-maroon bg-gray-50/50 rounded-xl p-4 text-center cursor-pointer hover:bg-rose-50/10 transition-colors"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
                        <span className="text-xs font-semibold text-gray-700 block">Drag & Drop Doctor Image file here</span>
                        <span className="text-[10px] text-gray-400 block mt-1">Supports JPG, JEPG, PNG image files (Optimized as 3:4 cropping)</span>
                        
                        <div className="mt-3">
                          <label id="btn-browse-photo" className="px-3 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-700 cursor-pointer inline-block shadow-2xs">
                            Browse Local Storage
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {photoFile && (
                        <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-100 font-medium">
                          <span className="truncate">Loaded: {photoFile.name} ({(photoFile.size / 1024).toFixed(1)} KB)</span>
                          <button id="clear-loaded-photo" type="button" onClick={() => { setPhotoFile(null); setPhotoUrl(''); }} className="text-[11px] font-bold hover:text-rose-600">Remove</button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        id="btn-form-clear"
                        type="button"
                        onClick={resetForm}
                        className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Form
                      </button>
                      <button
                        id="btn-doctor-submit"
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2 px-3 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {submitting ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                          "Save Doctor Profile"
                        )}
                      </button>
                    </div>

                  </form>
                </div>

                {/* RIGHT PORTION: PHOTO BRANDING STUDIO WORKSHEET */}
                <div className="lg:col-span-6 space-y-4">
                  <CanvasStudio
                    doctor={{
                      doctorName: docName,
                      specialization: docSpec,
                      hospitalName: docHospital,
                      city: docCity,
                      contactNumber: docMobile,
                      language: docLang
                    }}
                    selectedFrameId={docFrameId}
                    photoFile={photoFile}
                    photoUrl={photoUrl}
                    onCreativeGenerated={(b64) => setCreativeBase64(b64)}
                    onDownloaded={triggerDownloadedDirect}
                  />

                  {/* Informational help alert */}
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-900 text-xs flex items-start gap-2.5">
                    <HelpCircle className="w-4.5 h-4.5 shrink-0 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Guidelines for Branding generation:</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-blue-800">
                        <li>Ensure image holds a clear foreground of the doctor's portrait.</li>
                        <li>Drag doctor's photo directly inside the Canvas area above to align and crop.</li>
                        <li>Scroll/pinch inside the canvas workspace to scale or center correctly.</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 3: REGISTERED DOCTORS LIST */}
            {activeTab === 'doctors-list' && (
              <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 space-y-6">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-gray-900 text-base">Your Doctor Campaign Portfolio</h3>
                    <p className="text-xs text-gray-400">Total list of clinical advocates you registered under your Employee Code.</p>
                  </div>

                  <button
                    id="btn-export-mydataset-csv"
                    onClick={exportMyDoctorsCSV}
                    className="px-3.5 py-2 bg-brand-navy hover:bg-opacity-90 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Export Excel CSV
                  </button>
                </div>

                {/* Simple Filters bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Search Doctor</span>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        id="mgr-search-docs"
                        type="text"
                        placeholder="Search Name or Specialization..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setDoctorPage(1); }}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white text-gray-700 border border-gray-200 rounded-lg outline-none focus:border-brand-maroon transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Campaign Status</span>
                    <select
                      id="mgr-filter-status"
                      value={selectedStatus}
                      onChange={(e) => { setSelectedStatus(e.target.value); setDoctorPage(1); }}
                      className="w-full text-xs py-1.5 px-2 bg-white text-gray-700 border border-gray-200 rounded-lg outline-none focus:border-brand-maroon transition-all"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Draft">Draft</option>
                      <option value="Processing">Processing</option>
                      <option value="Generated">Generated</option>
                      <option value="Downloaded">Downloaded</option>
                    </select>
                  </div>
                </div>

                {/* Table Layout */}
                {filteredDoctors.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    No doctor entries recorded or match selected filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto space-y-4">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4 font-extrabold">Doctor Details</th>
                          <th className="py-3 px-4">Target City Location</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                        {paginatedDoctors.map(docItem => (
                          <tr key={docItem.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-semibold text-gray-900">
                              <span className="block font-bold">{docItem.doctorName}</span>
                              <span className="block text-[10px] font-semibold font-mono text-brand-maroon">{docItem.specialization}</span>
                            </td>
                            <td className="py-4 px-4 font-semibold">
                              <span className="block text-gray-700">{docItem.city}</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {(() => {
                                switch (docItem.status) {
                                  case 'Downloaded':
                                    return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Downloaded</span>;
                                  case 'Generated':
                                    return <span className="text-[10px] font-bold text-brand-navy bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Generated</span>;
                                  case 'Processing':
                                    return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Processing</span>;
                                  default:
                                    return <span className="text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Draft</span>;
                                }
                              })()}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                id={`edit-doc-btn-${docItem.id}`}
                                onClick={() => handleTriggerEdit(docItem)}
                                className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-brand-maroon hover:text-white rounded text-[11px] font-bold inline-flex items-center gap-0.5 shadow-2xs transition-all cursor-pointer"
                              >
                                <Edit className="w-3 h-3" /> Edit
                              </button>
                              <a
                                id={`download-creative-btn-${docItem.id}`}
                                href={docItem.creativeUrl || docItem.photoUrl}
                                download={`${docItem.doctorName.replace(/\s+/g, '_')}_CampaignCreative.png`}
                                onClick={() => handleCreativeDownloaded(docItem)}
                                className="px-2 py-1 bg-brand-navy text-white hover:bg-opacity-95 rounded text-[11px] font-bold shadow-2xs inline-block transition-all cursor-pointer"
                              >
                                Download PNG
                              </a>
                              <button
                                id={`delete-doc-btn-${docItem.id}`}
                                onClick={() => handleDeleteDoctorClick(docItem.id || '')}
                                className="p-1 text-gray-400 hover:text-rose-600 transition-colors inline-block align-middle"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination footer */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs font-medium">
                        <span className="text-gray-400">Showing page {doctorPage} of {totalPages}</span>
                        <div className="flex items-center gap-1">
                          <button
                            id="prev-mgr-doc-page"
                            disabled={doctorPage === 1}
                            onClick={() => setDoctorPage(p => Math.max(1, p - 1))}
                            className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            id="next-mgr-doc-page"
                            disabled={doctorPage === totalPages}
                            onClick={() => setDoctorPage(p => Math.min(totalPages, p + 1))}
                            className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}
