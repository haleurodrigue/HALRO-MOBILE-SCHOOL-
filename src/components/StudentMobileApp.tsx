/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Key, BookOpen, Clock, AlertCircle, RefreshCw, 
  Wifi, WifiOff, FileText, Lock, ChevronRight, ArrowLeft, ShieldCheck, HelpCircle
} from "lucide-react";
import { StudentCode, Class, Course } from "../types";
import CourseViewer from "./CourseViewer";

interface StudentMobileAppProps {
  classes: Class[];
  courses: Course[];
  studentCodes: StudentCode[];
  currentDeviceId: string;
  isOnline: boolean;
  onUpdateCodes: (updatedCodes: StudentCode[]) => void;
  onDeleteCode?: (codeId: string) => void;
  onBackToPortal?: () => void;
}

export default function StudentMobileApp({
  classes,
  courses,
  studentCodes,
  currentDeviceId,
  isOnline,
  onUpdateCodes,
  onDeleteCode,
  onBackToPortal
}: StudentMobileAppProps) {
  const [inputCode, setInputCode] = useState("");
  const [activeCode, setActiveCode] = useState<StudentCode | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [tempTimeLeft, setTempTimeLeft] = useState<string>("");

  // Track temporary code countdowns
  useEffect(() => {
    if (!activeCode || activeCode.type !== "temporary") return;

    const interval = setInterval(() => {
      const remainingMs = new Date(activeCode.expiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        // Expired!
        const updated = studentCodes.map(c => 
          c.id === activeCode.id ? { ...c, status: "expired" as const } : c
        );
        onUpdateCodes(updated);
        setActiveCode(null);
        setErrorMsg("Votre accès temporaire de 30 minutes a expiré.");
        clearInterval(interval);
      } else {
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        setTempTimeLeft(`${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCode, studentCodes, onUpdateCodes]);

  // Synchronize active code state if it's deactivated from the admin dashboard
  useEffect(() => {
    if (activeCode) {
      const current = studentCodes.find(c => c.code === activeCode.code);
      if (!current || current.status !== "active") {
        setActiveCode(null);
        setSelectedClass(null);
        setSelectedCourse(null);
        if (current?.status === "deactivated") {
          setErrorMsg("Ce code d'accès a été désactivé par l'administration ou pour usage simultané abusif.");
        } else if (current?.status === "expired") {
          setErrorMsg("Ce code d'accès a expiré.");
        }
      }
    }
  }, [studentCodes, activeCode]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const trimmed = inputCode.trim().toUpperCase();

    if (!trimmed) {
      setErrorMsg("Veuillez saisir un code.");
      return;
    }

    const codeObj = studentCodes.find(c => c.code === trimmed);

    if (!codeObj) {
      setErrorMsg("Code invalide. Contactez l'administration via WhatsApp.");
      return;
    }

    if (codeObj.status === "deactivated") {
      setErrorMsg("Ce code a été désactivé.");
      return;
    }

    if (codeObj.status === "expired" || new Date(codeObj.expiresAt).getTime() < Date.now()) {
      setErrorMsg("Ce code d'accès a expiré.");
      return;
    }

    // Check device limiting rules:
    // If this device is not in devicesUsed list, we must check if we've already reached the limit.
    let updatedDevices = [...codeObj.devicesUsed];
    if (!updatedDevices.includes(currentDeviceId)) {
      if (updatedDevices.length >= 2) {
        // Automatically deactivate the student code on 3rd device login attempt
        const updated = studentCodes.map(c => 
          c.code === trimmed ? { ...c, status: "deactivated" as const, devicesUsed: [...updatedDevices, currentDeviceId] } : c
        );
        onUpdateCodes(updated);
        setErrorMsg("Ce code d'accès a été automatiquement désactivé suite à une tentative d'utilisation simultanée sur un 3ème appareil (maximum de 2 appareils autorisés). Veuillez contacter l'administration principale.");
        return;
      }
      updatedDevices.push(currentDeviceId);
    }

    // Otherwise, we log them in and update devices list
    const updated = studentCodes.map(c => 
      c.code === trimmed ? { ...c, devicesUsed: updatedDevices } : c
    );
    onUpdateCodes(updated);
    setActiveCode({ ...codeObj, devicesUsed: updatedDevices });
  };

  const handleLogout = () => {
    setActiveCode(null);
    setSelectedClass(null);
    setSelectedCourse(null);
    setInputCode("");
  };

  // Check if student has access to a specific class
  const hasAccessToClass = (classId: string) => {
    if (!activeCode) return false;
    if (activeCode.type === "temporary") return true; // Temp can browse all
    return activeCode.classId === classId; // Definitive is locked to classId
  };

  return (
    <div id="student-app-shell" className="w-full md:max-w-sm mx-auto bg-slate-950 md:border-4 md:border-slate-800 md:rounded-[3rem] md:shadow-2xl relative overflow-hidden flex flex-col md:aspect-[9/19] min-h-screen md:min-h-0 select-none text-slate-100">
      
      {/* Real Mobile Responsive Top Header */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
            <BookOpen size={16} />
          </div>
          <span className="text-sm font-bold tracking-wider text-white uppercase">HALRO MOBILE SCHOOL</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono text-slate-400">{isOnline ? "Connecté" : "Hors-ligne"}</span>
        </div>
      </div>

      {/* Top Mobile Notch & Status Bar (Visible on Desktop Simulator only) */}
      <div id="student-mobile-header" className="relative bg-slate-900 pt-6 px-6 pb-2 border-b border-slate-800/80 md:flex hidden items-center justify-between text-xs font-semibold z-10">
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-black rounded-b-xl flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
        </div>
        <div className="text-[11px] text-slate-400 font-bold">HALRO MOBILE</div>
        
        {/* Offline indicator inside status bar */}
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <div className="flex items-center space-x-1 text-emerald-400 text-[10px]">
              <Wifi size={10} />
              <span>En Ligne</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-amber-500 text-[10px]">
              <WifiOff size={10} />
              <span>Hors Ligne</span>
            </div>
          )}
          <span className="text-slate-400 text-[10px]">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="student-mobile-content" className="flex-1 overflow-y-auto p-4 flex flex-col">
        {!activeCode ? (
          /* Login View */
          <div className="flex-1 flex flex-col justify-center py-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <BookOpen size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">HALRO MOBILE SCHOOL</h2>
              <p className="text-xs text-slate-400 mt-1.5 px-4">
                Saisissez votre code d'accès personnalisé pour parcourir vos supports de cours sécurisés.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                  Code d'accès apprenant
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Key size={16} />
                  </span>
                  <input
                    id="student-code-input"
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Ex: APP-4012"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition uppercase"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-950/50 border border-red-500/20 text-red-400 rounded-xl flex items-start space-x-2 text-xs">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <button
                  id="student-login-submit"
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Accéder à l'école</span>
                  <ChevronRight size={16} />
                </button>

                {onBackToPortal && (
                  <button
                    id="student-back-portal-btn"
                    type="button"
                    onClick={onBackToPortal}
                    className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>← Retour au Portail Principal</span>
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 p-3.5 bg-slate-900/60 border border-slate-800/60 rounded-2xl text-[11px] text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300 flex items-center space-x-1">
                <HelpCircle size={12} className="text-emerald-400" />
                <span>Comment obtenir un code ?</span>
              </p>
              <p>
                Abonnez-vous auprès de l'administrateur via WhatsApp. Un code unique vous sera attribué selon votre classe ou pour un essai gratuit.
              </p>
              <div className="border-t border-slate-800 pt-2 text-[10px] flex items-center justify-between">
                <span className="text-slate-500">ID Appareil :</span>
                <button
                  type="button"
                  onClick={() => {
                    const code = prompt("Entrez le code Super Admin pour déverrouiller l'administration :");
                    if (code !== null) {
                      window.dispatchEvent(new CustomEvent("admin-backdoor-unlock", { detail: code }));
                    }
                  }}
                  className="font-mono text-slate-400 hover:text-emerald-400 transition focus:outline-none"
                  title="Accès Administration"
                >
                  {currentDeviceId}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Logged In View */
          <div className="flex-1 flex flex-col h-full">
            
            {/* Student Info Bar */}
            <div className="bg-slate-900 rounded-2xl p-3 mb-4 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ÉLÈVE CONNECTÉ</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{activeCode.matricule}</span>
              </div>
              <div className="text-right">
                {activeCode.type === "temporary" ? (
                  <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold">
                    <Clock size={11} className="animate-spin-slow" />
                    <span>TEMPO: {tempTimeLeft}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold">
                    <ShieldCheck size={11} />
                    <span>DÉFINITIF 1 AN</span>
                  </div>
                )}
              </div>
            </div>

            {selectedCourse ? (
              /* Inside Secure Course Viewer */
              <div className="flex-1 flex flex-col justify-between">
                <button
                  id="btn-back-to-courses"
                  onClick={() => setSelectedCourse(null)}
                  className="mb-3 self-start flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg border border-slate-800 transition"
                >
                  <ArrowLeft size={12} />
                  <span>Retour aux cours</span>
                </button>
                
                <div className="flex-1 overflow-y-auto">
                  <CourseViewer 
                    course={selectedCourse} 
                    userMatricule={activeCode.matricule}
                    userCode={activeCode.code}
                    isSuperAdmin={false}
                    studentName={activeCode.studentName}
                    onClose={() => setSelectedCourse(null)}
                  />
                </div>
              </div>
            ) : selectedClass ? (
              /* Inside Class course list */
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <button
                    id="btn-back-to-classes"
                    onClick={() => setSelectedClass(null)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg border border-slate-800 transition"
                  >
                    <ArrowLeft size={12} />
                    <span>Retour</span>
                  </button>
                  <span className="text-xs font-bold text-slate-400">{selectedClass.name}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">Supports de cours</h3>
                
                {courses.filter(c => c.classId === selectedClass.id).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                    <FileText size={24} className="text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500">Aucun cours n'est encore disponible pour cette classe.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {courses
                      .filter(c => c.classId === selectedClass.id)
                      .map(course => (
                        <div
                          key={course.id}
                          id={`course-item-${course.id}`}
                          onClick={() => setSelectedCourse(course)}
                          className="p-3.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800/60 rounded-xl cursor-pointer transition flex items-center justify-between group"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 group-hover:bg-emerald-500/20 transition">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-emerald-300 transition">{course.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Par {course.authorName}</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-600 shrink-0 group-hover:text-emerald-400 transition" />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              /* Class list View */
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Vos salles de classe</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeCode.type === "temporary" 
                      ? "Aperçu de toutes les classes (Accès temporaire)." 
                      : "Sélectionnez votre classe pour étudier."}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {classes.map(cl => {
                    const accessible = hasAccessToClass(cl.id);
                    return (
                      <div
                        key={cl.id}
                        id={`class-item-${cl.id}`}
                        onClick={() => accessible && setSelectedClass(cl)}
                        className={`p-3.5 border rounded-xl flex items-center justify-between transition ${
                          accessible 
                            ? "bg-slate-900 hover:bg-slate-850 border-slate-800 cursor-pointer" 
                            : "bg-slate-950/80 border-slate-900/60 opacity-40 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${accessible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-slate-100">{cl.name}</span>
                            <span className="text-[9px] text-slate-500 line-clamp-1">{cl.description}</span>
                          </div>
                        </div>

                        <div>
                          {accessible ? (
                            <ChevronRight size={14} className="text-slate-600" />
                          ) : (
                            <Lock size={12} className="text-slate-600 mr-1" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  id="student-logout-btn"
                  onClick={handleLogout}
                  className="mt-6 w-full py-2 bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-850 rounded-xl transition"
                >
                  Déconnexion
                </button>

                <button
                  id="student-unsubscribe-btn"
                  onClick={() => {
                    if (!activeCode) return;
                    const confirm1 = window.confirm("ATTENTION : Cette action est IRREVERSIBLE. Êtes-vous sûr de vouloir vous désabonner définitivement de HALRO MOBILE SCHOOL ? Votre code sera supprimé et vous perdrez tout accès.");
                    if (!confirm1) return;
                    const confirm2 = window.confirm("Dernière confirmation : En cliquant sur OK, vous supprimez définitivement votre abonnement. Êtes-vous absolument sûr ?");
                    if (!confirm2) return;
                    
                    if (onDeleteCode) {
                      onDeleteCode(activeCode.id);
                    } else {
                      const updated = studentCodes.filter(c => c.id !== activeCode.id);
                      onUpdateCodes(updated);
                    }
                    setActiveCode(null);
                    setSelectedClass(null);
                    setSelectedCourse(null);
                    setInputCode("");
                    alert("Désabonnement réussi. Votre accès a été supprimé de la plateforme.");
                  }}
                  className="mt-2 w-full py-2 bg-red-950/20 hover:bg-red-950/40 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-900/30 rounded-xl transition"
                >
                  Se désabonner définitivement
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Home Indicator (Visible on Desktop Simulator only) */}
      <div id="student-mobile-footer" className="p-2.5 bg-slate-950 border-t border-slate-900 md:flex hidden justify-center items-center">
        <div className="w-24 h-1 bg-slate-700 rounded-full"></div>
      </div>
    </div>
  );
}
