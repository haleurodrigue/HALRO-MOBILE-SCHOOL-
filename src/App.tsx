/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  BookOpen, Users, Key, Shield, Smartphone, Monitor, Info, 
  Wifi, WifiOff, RefreshCw, AlertTriangle, HelpCircle, HardDriveDownload
} from "lucide-react";
import { 
  Class, Course, Teacher, StudentCode, PayoutRequest, Invoice 
} from "./types";
import { 
  initialClasses, initialCourses, initialTeachers, initialStudentCodes 
} from "./data/seedData";
import StudentMobileApp from "./components/StudentMobileApp";
import TeacherPortal from "./components/TeacherPortal";
import AdminPortal from "./components/AdminPortal";

export default function App() {
  // Application Roles Tabs: 'student' | 'teacher' | 'admin'
  const [activeRole, setActiveRole] = useState<"student" | "teacher" | "admin">("student");

  // Portal Landing Page vs Portal Views: 'portal' | 'student' | 'teacher' | 'admin'
  const [activePortal, setActivePortal] = useState<"portal" | "student" | "teacher" | "admin">("portal");

  // Main Persistent State
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [studentCodes, setStudentCodes] = useState<StudentCode[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [superAdminCode, setSuperAdminCode] = useState("admin1234");
  const [isLoaded, setIsLoaded] = useState(false);

  // Simulated Device State
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("dev-rodrigue-phone");

  // Network Offline States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulateOffline, setSimulateOffline] = useState(false);

  // Toggle for simulator/sandbox controls to see the pure production view
  const [showSandboxControls, setShowSandboxControls] = useState(true);

  // Production Lock Mode: "none" | "student" | "teacher" | "admin"
  // If locked, the sandbox switcher is hidden and the app runs purely as that single role.
  const [productionLock, setProductionLock] = useState<"none" | "student" | "teacher" | "admin">("none");

  // Initialize from LocalStorage or seed data
  useEffect(() => {
    // One-time automatic clean-up of old simulated demo data to make it a fully pristine, ready production version
    const appVersion = localStorage.getItem("halro_app_version");
    if (appVersion !== "v2") {
      localStorage.removeItem("halro_classes");
      localStorage.removeItem("halro_courses");
      localStorage.removeItem("halro_teachers");
      localStorage.removeItem("halro_student_codes");
      localStorage.removeItem("halro_payout_requests");
      localStorage.removeItem("halro_invoices");
      localStorage.setItem("halro_app_version", "v2");
      
      setClasses(initialClasses);
      setCourses(initialCourses);
      setTeachers(initialTeachers);
      setStudentCodes(initialStudentCodes);
      setPayoutRequests([]);
      setInvoices([]);
      setIsLoaded(true);
      return;
    }

    const storedClasses = localStorage.getItem("halro_classes");
    const storedCourses = localStorage.getItem("halro_courses");
    const storedTeachers = localStorage.getItem("halro_teachers");
    const storedCodes = localStorage.getItem("halro_student_codes");
    const storedPayouts = localStorage.getItem("halro_payout_requests");
    const storedInvoices = localStorage.getItem("halro_invoices");
    const storedAdminCode = localStorage.getItem("halro_admin_code");
    const storedLock = localStorage.getItem("halro_production_lock");

    if (storedClasses) setClasses(JSON.parse(storedClasses));
    else setClasses(initialClasses);

    if (storedCourses) setCourses(JSON.parse(storedCourses));
    else setCourses(initialCourses);

    if (storedTeachers) setTeachers(JSON.parse(storedTeachers));
    else setTeachers(initialTeachers);

    if (storedCodes) setStudentCodes(JSON.parse(storedCodes));
    else setStudentCodes(initialStudentCodes);

    if (storedPayouts) setPayoutRequests(JSON.parse(storedPayouts));
    else setPayoutRequests([]);

    if (storedInvoices) setInvoices(JSON.parse(storedInvoices));
    else setInvoices([]);

    if (storedAdminCode) setSuperAdminCode(storedAdminCode);
    else setSuperAdminCode("admin1234");

    if (storedLock) {
      setProductionLock(storedLock as any);
      if (storedLock !== "none") {
        setActiveRole(storedLock as any);
        setActivePortal(storedLock as any);
        setShowSandboxControls(false);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("halro_production_lock", productionLock);
    if (productionLock !== "none") {
      setActiveRole(productionLock);
      setActivePortal(productionLock as any);
      setShowSandboxControls(false);
    }
  }, [productionLock]);

  // Handle backdoor event for real-device administration
  useEffect(() => {
    const handleBackdoor = (e: Event) => {
      const code = (e as CustomEvent).detail;
      if (code === superAdminCode) {
        setProductionLock("none");
        setActiveRole("admin");
        setActivePortal("admin");
        setShowSandboxControls(true);
        alert("🔓 Accès Super Admin déverrouillé ! Vous êtes maintenant dans le panneau d'administration.");
      } else {
        alert("❌ Code incorrect ! Accès refusé.");
      }
    };
    window.addEventListener("admin-backdoor-unlock", handleBackdoor);
    return () => {
      window.removeEventListener("admin-backdoor-unlock", handleBackdoor);
    };
  }, [superAdminCode]);

  // Save changes to localStorage on any state change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("halro_classes", JSON.stringify(classes));
    }
  }, [classes, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("halro_courses", JSON.stringify(courses));
    }
  }, [courses, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("halro_teachers", JSON.stringify(teachers));
    }
  }, [teachers, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("halro_student_codes", JSON.stringify(studentCodes));
    }
  }, [studentCodes, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("halro_payout_requests", JSON.stringify(payoutRequests));
    }
  }, [payoutRequests, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("halro_invoices", JSON.stringify(invoices));
    }
  }, [invoices, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("halro_admin_code", superAdminCode);
    }
  }, [superAdminCode, isLoaded]);

  // Handle Online/Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Super Admin action: Add class
  const handleAddClass = (newCl: Class) => {
    setClasses(prev => [...prev, newCl]);
  };

  // Super Admin / Teacher action: Add Course
  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [...prev, newCourse]);
  };

  const handleUpdateCourses = (updated: Course[]) => {
    setCourses(updated);
  };

  // Super Admin action: Enroll Teacher
  const handleAddTeacher = (newTeach: Teacher) => {
    setTeachers(prev => [...prev, newTeach]);
  };

  // Super Admin / Teacher action: update student codes
  const handleUpdateStudentCodes = (updated: StudentCode[]) => {
    setStudentCodes(updated);
  };

  // Teacher action: Request Payout
  const handleSendPayoutRequest = (req: PayoutRequest) => {
    setPayoutRequests(prev => [req, ...prev]);
  };

  // Super Admin action: Resolve Payout Request, reset balance & generate invoice
  const handleResolvePayout = (requestId: string, invoice: Invoice) => {
    // 1. Mark request as paid
    setPayoutRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "paid" } : r));
    
    // 2. Add Invoice record
    setInvoices(prev => [invoice, ...prev]);

    // 3. Reset teacher balance to 0 in active list
    setTeachers(prev => prev.map(t => t.matricule === invoice.teacherMatricule ? { ...t, balance: 0 } : t));
  };

  // Super Admin action: Update teachers
  const handleUpdateTeachers = (updated: Teacher[]) => {
    setTeachers(updated);
  };

  // Super Admin action: Update Super Admin Code
  const handleUpdateSuperAdminCode = (newCode: string) => {
    setSuperAdminCode(newCode);
  };

  // Super Admin / Teacher action: Generate code
  const handleGenerateCode = (newCode: StudentCode, commissionDetails?: string) => {
    setStudentCodes(prev => [newCode, ...prev]);
    if (commissionDetails) {
      console.log("Commissions distribuées :", commissionDetails);
    }
  };

  const resetAllDataToDefault = () => {
    const confirm = window.confirm("Voulez-vous réinitialiser toutes les données de l'application à leur état initial ? (Toutes vos modifications seront perdues)");
    if (!confirm) return;

    localStorage.removeItem("halro_classes");
    localStorage.removeItem("halro_courses");
    localStorage.removeItem("halro_teachers");
    localStorage.removeItem("halro_student_codes");
    localStorage.removeItem("halro_payout_requests");
    localStorage.removeItem("halro_invoices");
    localStorage.removeItem("halro_admin_code");
    localStorage.setItem("halro_app_version", "v2");

    setClasses(initialClasses);
    setCourses(initialCourses);
    setTeachers(initialTeachers);
    setStudentCodes(initialStudentCodes);
    setPayoutRequests([]);
    setInvoices([]);
    setSuperAdminCode("admin1234");
    alert("Données réinitialisées !");
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-950 font-sans text-slate-200">
      
      {/* Top Banner & Control Area */}
      {showSandboxControls ? (
        <header id="app-top-header" className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 md:px-6 md:py-4 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col gap-3">
            
            {/* Logo Title & Offline Simulator */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-tr from-red-600 to-indigo-600 rounded-xl shadow-lg text-white">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h1 className="text-sm md:text-lg font-black tracking-wider text-white">HALRO MOBILE SCHOOL</h1>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-mono">CONSOLE DE SIMULATION BAC À SABLE</p>
                </div>
              </div>

              {/* Quick Simulator Buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-offline-simulator"
                  onClick={() => setSimulateOffline(!simulateOffline)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                    simulateOffline 
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {simulateOffline ? <WifiOff size={11} /> : <Wifi size={11} />}
                  <span>{simulateOffline ? "Simuler Hors-ligne" : "Simuler En ligne"}</span>
                </button>

                <button
                  id="btn-reset-data"
                  onClick={resetAllDataToDefault}
                  className="p-1 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs flex items-center space-x-1 px-2 py-1 border border-slate-750"
                  title="Réinitialiser"
                >
                  <RefreshCw size={11} />
                  <span>Réinitialiser Données</span>
                </button>

                {activePortal !== "portal" && (
                  <button
                    onClick={() => setActivePortal("portal")}
                    className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg border border-indigo-500 transition"
                  >
                    🏠 Accueil Portail
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Multi-Role Selector - Always visible on all screen sizes */}
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="role-tab-portal"
                onClick={() => setActivePortal("portal")}
                className={`flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition ${
                  activePortal === "portal" 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>🏠 Portail</span>
              </button>

              <button
                id="role-tab-student"
                onClick={() => { setActiveRole("student"); setActivePortal("student"); }}
                className={`flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition ${
                  activePortal === "student" 
                    ? "bg-emerald-600 text-white" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone size={11} />
                <span>📱 Élève</span>
              </button>

              <button
                id="role-tab-teacher"
                onClick={() => { setActiveRole("teacher"); setActivePortal("teacher"); }}
                className={`flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition ${
                  activePortal === "teacher" 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users size={11} />
                <span>👨‍🏫 Profs</span>
              </button>

              <button
                id="role-tab-admin"
                onClick={() => { setActiveRole("admin"); setActivePortal("admin"); }}
                className={`flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition ${
                  activePortal === "admin" 
                    ? "bg-red-600 text-white" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Shield size={11} />
                <span>🔑 Admin</span>
              </button>
            </div>

          </div>
        </header>
      ) : (
        /* Minimalist Real App Header - No simulation bar, purely professional */
        <header className="bg-slate-900 border-b border-slate-800 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-red-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-950/40">
              <BookOpen size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-white uppercase">HALRO MOBILE SCHOOL</h1>
              <p className="text-[9px] text-emerald-400 font-mono font-bold">● PORTAIL OFFICIEL SÉCURISÉ</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {activePortal !== "portal" && (
              <button
                onClick={() => setActivePortal("portal")}
                className="text-xs text-slate-400 hover:text-white transition font-semibold flex items-center space-x-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"
              >
                <span>← Retour à l'Accueil</span>
              </button>
            )}

            {productionLock === "none" && (
              <button
                onClick={() => setShowSandboxControls(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                Afficher les contrôles
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Workspace */}
      <main id="app-main-workspace" className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        
        {/* Helper sandbox alert banner */}
        {showSandboxControls && activePortal !== "portal" && (
          <div id="sandbox-guidance-banner" className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 text-[11px] text-slate-400 leading-relaxed">
            <p className="font-bold text-slate-200 flex items-center gap-1">
              <Info size={14} className="text-indigo-400 shrink-0" />
              <span>Simulation active pour le rôle : {activePortal === "student" ? "Élève (Mobile)" : activePortal === "teacher" ? "Professeur" : "Administrateur"}</span>
            </p>
            <p>
              Vous êtes actuellement en train de tester l'application. Vous pouvez repasser au portail d'accueil à tout moment en cliquant sur le premier onglet.
            </p>
          </div>
        )}

        {/* Dynamic Route/Tab Container */}
        <div className="relative animate-fade-in min-h-[500px]">
          
          {/* PORTAL LANDING SCREEN */}
          {activePortal === "portal" && (
            <div id="portal-landing-page" className="max-w-4xl mx-auto py-4 space-y-10 animate-fade-in">
              
              {/* High-end Brand Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-950/60 text-indigo-400 rounded-full border border-indigo-900/30 text-xs font-semibold">
                  <span>Enseignement à distance sécurisé de référence</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white font-sans">
                  HALRO MOBILE SCHOOL
                </h2>
                <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  L'application professionnelle de partage et d'étude de supports de cours protégés. 
                  Une technologie innovante interdisant les captures d'écran et téléchargements illicites pour préserver la propriété intellectuelle des enseignants.
                </p>
              </div>

              {/* Stats Panel */}
              <div className="grid grid-cols-3 gap-3 md:gap-6 bg-slate-900/40 border border-slate-900 rounded-2xl p-4 md:p-6 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Salles de classe</span>
                  <span className="text-lg md:text-2xl font-black font-mono text-indigo-400">{classes.length}</span>
                </div>
                <div className="space-y-1 border-x border-slate-900">
                  <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Documents de Cours</span>
                  <span className="text-lg md:text-2xl font-black font-mono text-emerald-400">{courses.length}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Enseignants Enrôlés</span>
                  <span className="text-lg md:text-2xl font-black font-mono text-red-400">{teachers.length}</span>
                </div>
              </div>

              {/* Portal Selector Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. STUDENT CARD */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/30 transition duration-300 shadow-xl group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-105 transition">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Espace Apprenant</h3>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold block mt-1">Élève & Smartphone</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Saisissez votre code d'accès sécurisé reçu de votre enseignant ou de la direction pour étudier vos cours hors-ligne.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => { setActiveRole("student"); setActivePortal("student"); }}
                    className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition duration-200"
                  >
                    Accéder à mes cours (Élève)
                  </button>
                </div>

                {/* 2. TEACHER CARD */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition duration-300 shadow-xl group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-105 transition">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Portail Enseignant</h3>
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold block mt-1">Auteur de cours</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Espace réservé aux collègues enseignants. Publiez des documents PDF, gérez les inscriptions et suivez vos gains de commissions.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => { setActiveRole("teacher"); setActivePortal("teacher"); }}
                    className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition duration-200"
                  >
                    Accéder à l'Espace Professeur
                  </button>
                </div>

                {/* 3. ADMIN CARD */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-red-500/30 transition duration-300 shadow-xl group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center group-hover:scale-105 transition">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Direction Générale</h3>
                      <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold block mt-1">Super Administration</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Configuration du système, attribution des licences d'un an, validation des demandes de retraits de commissions enseignants.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => { setActiveRole("admin"); setActivePortal("admin"); }}
                    className="w-full mt-6 py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition duration-200"
                  >
                    Se connecter à la Direction
                  </button>
                </div>

              </div>

              {/* Secure explanation banner */}
              <div className="p-5 bg-slate-900/60 border border-slate-900 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span>Système de Protection Active</span>
                  </h4>
                  <p className="leading-relaxed">
                    Les cours ne sont jamais téléchargés localement en tant que fichiers PDF bruts. Ils sont lus dans notre visionneuse sécurisée avec filigrane dynamique personnalisé contenant le matricule et le code de l'élève.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    <span>Juste Rémunération Enseignante</span>
                  </h4>
                  <p className="leading-relaxed">
                    L'attribution d'un code définitif à un élève pour une classe donnée génère immédiatement une commission automatique créditée sur le solde de tous les enseignants auteurs publiés dans cette classe.
                  </p>
                </div>
              </div>

              {/* Non-production developer trigger for easy sandbox access */}
              {productionLock === "none" && (
                <div className="text-center pt-6 border-t border-slate-900/60">
                  <button
                    onClick={() => {
                      setShowSandboxControls(!showSandboxControls);
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-400 transition underline"
                  >
                    {showSandboxControls ? "Masquer la console de simulation rapide" : "Activer la console de simulation rapide"}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* STUDENT MOBILE APP VIEW */}
          {activePortal === "student" && (
            <div className="py-1">
              {showSandboxControls && (
                <div className="text-center mb-4 max-w-sm mx-auto">
                  <span className="text-[9px] font-extrabold tracking-widest text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/10 uppercase">
                    Simulation Élève (Mobile)
                  </span>
                </div>
              )}
              
              <StudentMobileApp
                classes={classes}
                courses={courses}
                studentCodes={studentCodes}
                currentDeviceId={currentDeviceId}
                isOnline={isOnline && !simulateOffline}
                onUpdateCodes={handleUpdateStudentCodes}
                onBackToPortal={() => setActivePortal("portal")}
              />
            </div>
          )}

          {/* TEACHER PORTAL VIEW */}
          {activePortal === "teacher" && (
            <div className="py-2 max-w-5xl mx-auto">
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-500/10 uppercase">
                    Portail Collègues Enseignants
                  </span>
                  <h2 className="text-lg font-bold text-slate-100 mt-2">Espace Auteurs de cours & Commissions</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Les enseignants se connectent avec leur matricule pour suivre leurs commissions, demander un paiement, publier de nouveaux cours et administrer les élèves de leurs classes.
                  </p>
                </div>
                <button
                  onClick={() => setActivePortal("portal")}
                  className="self-start md:self-auto px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-semibold border border-slate-800 transition"
                >
                  ← Quitter le Portail
                </button>
              </div>

              <TeacherPortal
                teachers={teachers}
                classes={classes}
                courses={courses}
                studentCodes={studentCodes}
                payoutRequests={payoutRequests}
                onAddCourse={handleAddCourse}
                onGenerateCode={handleGenerateCode}
                onUpdateCodes={handleUpdateStudentCodes}
                onSendPayoutRequest={handleSendPayoutRequest}
              />
            </div>
          )}

          {/* ADMIN PORTAL VIEW */}
          {activePortal === "admin" && (
            <div className="py-2 max-w-6xl mx-auto">
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-red-400 bg-red-950/40 px-2.5 py-1 rounded-full border border-red-500/10 uppercase">
                    Direction Générale
                  </span>
                  <h2 className="text-lg font-bold text-slate-100 mt-2">Panneau d'Administration de Référence</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Créez des classes, enrôlez des professeurs auteurs de cours, configurez les permissions d'administration et résolvez les demandes "Payez moi" avec génération instantanée de factures PDF et remise à 0.
                  </p>
                </div>
                <button
                  onClick={() => setActivePortal("portal")}
                  className="self-start md:self-auto px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-semibold border border-slate-800 transition"
                >
                  ← Quitter la Direction
                </button>
              </div>

              <AdminPortal
                classes={classes}
                courses={courses}
                teachers={teachers}
                studentCodes={studentCodes}
                payoutRequests={payoutRequests}
                invoices={invoices}
                superAdminCode={superAdminCode}
                productionLock={productionLock}
                onAddClass={handleAddClass}
                onAddTeacher={handleAddTeacher}
                onUpdateTeachers={handleUpdateTeachers}
                onGenerateCode={handleGenerateCode}
                onUpdateCodes={handleUpdateStudentCodes}
                onResolvePayout={handleResolvePayout}
                onUpdateSuperAdminCode={handleUpdateSuperAdminCode}
                onUpdateProductionLock={setProductionLock}
                onAddCourse={handleAddCourse}
                onUpdateCourses={handleUpdateCourses}
              />
            </div>
          )}
        </div>

      </main>

      {/* Footer info banner */}
      <footer id="app-footer" className="mt-16 border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>
            HALRO MOBILE SCHOOL • Application éducative mobile sécurisée. 
            Développé conformément aux spécifications pédagogiques d'enseignants.
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
            Protection contre le téléchargement • Chiffrement des accès • Système d'attribution automatique de commissions
          </p>

          {productionLock !== "none" && (
            <div className="pt-4 mt-4 border-t border-slate-900 flex justify-center">
              <button
                id="btn-footer-unlock"
                onClick={() => {
                  const pwd = prompt("Saisissez le code Super Admin pour déverrouiller l'accès multi-rôles :");
                  if (pwd === superAdminCode) {
                    setProductionLock("none");
                    setShowSandboxControls(true);
                    setActivePortal("portal");
                    alert("Accès multi-rôles (Bac à sable) déverrouillé !");
                  } else if (pwd !== null) {
                    alert("Code incorrect ! Access refusé.");
                  }
                }}
                className="text-[10px] text-slate-600 hover:text-indigo-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <Key size={10} />
                <span>Déverrouiller le mode Bac à sable</span>
              </button>
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}
