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

  // Main Persistent State
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [studentCodes, setStudentCodes] = useState<StudentCode[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [superAdminCode, setSuperAdminCode] = useState("admin1234");

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
        setShowSandboxControls(false);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("halro_production_lock", productionLock);
    if (productionLock !== "none") {
      setActiveRole(productionLock);
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
    if (classes.length > 0) localStorage.setItem("halro_classes", JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    if (courses.length > 0) localStorage.setItem("halro_courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    if (teachers.length > 0) localStorage.setItem("halro_teachers", JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    if (studentCodes.length > 0) localStorage.setItem("halro_student_codes", JSON.stringify(studentCodes));
  }, [studentCodes]);

  useEffect(() => {
    localStorage.setItem("halro_payout_requests", JSON.stringify(payoutRequests));
  }, [payoutRequests]);

  useEffect(() => {
    localStorage.setItem("halro_invoices", JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem("halro_admin_code", superAdminCode);
  }, [superAdminCode]);

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
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-mono">PLATEFORME ÉDUCATIVE SÉCURISÉE HORS LIGNE</p>
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
                  <span>{simulateOffline ? "Hors-ligne" : "En ligne"}</span>
                </button>

                <button
                  id="btn-reset-data"
                  onClick={resetAllDataToDefault}
                  className="p-1 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg"
                  title="Réinitialiser"
                >
                  <RefreshCw size={11} />
                </button>
              </div>
            </div>

            {/* Interactive Multi-Role Selector - Always visible on all screen sizes */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="role-tab-student"
                onClick={() => setActiveRole("student")}
                className={`flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition ${
                  activeRole === "student" 
                    ? "bg-emerald-600 text-white" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone size={11} />
                <span>📱 Élève</span>
              </button>

              <button
                id="role-tab-teacher"
                onClick={() => setActiveRole("teacher")}
                className={`flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition ${
                  activeRole === "teacher" 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users size={11} />
                <span>👨‍🏫 Profs</span>
              </button>

              <button
                id="role-tab-admin"
                onClick={() => setActiveRole("admin")}
                className={`flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition ${
                  activeRole === "admin" 
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
        /* Minimalist Real App Header */
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-gradient-to-tr from-red-600 to-indigo-600 rounded-lg text-white">
              <BookOpen size={16} />
            </div>
            <div>
              <h1 className="text-xs font-bold tracking-wider text-white uppercase">HALRO MOBILE SCHOOL</h1>
              <p className="text-[8px] text-emerald-400 font-mono font-bold">● VERSION FINALE</p>
            </div>
          </div>

          <button
            onClick={() => setShowSandboxControls(true)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline"
          >
            Afficher les contrôles
          </button>
        </header>
      )}

      {/* Main Sandbox Workspace */}
      <main id="app-main-workspace" className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-8">
        
        {/* Helper sandbox alert banner */}
        {showSandboxControls && (
          <div id="sandbox-guidance-banner" className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 text-[11px] text-slate-400 leading-relaxed">
            <p className="font-bold text-slate-200 flex items-center gap-1">
              <Info size={14} className="text-indigo-400 shrink-0" />
              <span>Mode Démo Multirôle Actif</span>
            </p>
            <p>
              Toutes les données sont stockées dans le navigateur. Vous pouvez basculer instantanément de rôle (Élève, Enseignant, Admin) pour tester.
            </p>
          </div>
        )}

        {/* Dynamic Route/Tab Container */}
        <div className="relative animate-fade-in min-h-[500px]">
          {activeRole === "student" && (
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
              />
            </div>
          )}

          {activeRole === "teacher" && (
            <div className="py-2 max-w-5xl mx-auto">
              <div className="mb-6">
                <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-500/10 uppercase">
                  Portail Collègues Enseignants
                </span>
                <h2 className="text-lg font-bold text-slate-100 mt-2">Espace Auteurs de cours & Commissions</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Les enseignants se connectent avec leur matricule pour suivre leurs commissions, demander un paiement, publier de nouveaux cours et administrer les élèves de leurs classes.
                </p>
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

          {activeRole === "admin" && (
            <div className="py-2 max-w-6xl mx-auto">
              <div className="mb-6">
                <span className="text-[10px] font-extrabold tracking-widest text-red-400 bg-red-950/40 px-2.5 py-1 rounded-full border border-red-500/10 uppercase">
                  Direction Générale
                </span>
                <h2 className="text-lg font-bold text-slate-100 mt-2">Panneau d'Administration de Référence</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Créez des classes, enrôlez des professeurs auteurs de cours, configurez les permissions d'administration et résolvez les demandes "Payez moi" avec génération instantanée de factures PDF et remise à 0.
                </p>
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
