/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  PlusCircle, Users, BookOpen, Key, DollarSign, Settings, Bell, CheckCircle, 
  Trash2, ShieldCheck, FileText, Download, ShieldAlert, Lock, ToggleLeft, ToggleRight, ArrowRight, Clipboard
} from "lucide-react";
import { Class, Course, Teacher, StudentCode, PayoutRequest, Invoice, AccessCodeType } from "../types";
import { jsPDF } from "jspdf";
import CourseViewer from "./CourseViewer";

interface AdminPortalProps {
  classes: Class[];
  courses: Course[];
  teachers: Teacher[];
  studentCodes: StudentCode[];
  payoutRequests: PayoutRequest[];
  invoices: Invoice[];
  superAdminCode: string;
  productionLock: "none" | "student" | "teacher" | "admin";
  onAddClass: (newClass: Class) => void;
  onAddTeacher: (newTeacher: Teacher) => void;
  onUpdateTeachers: (updated: Teacher[]) => void;
  onGenerateCode: (newCode: StudentCode, commissionDetails?: string) => void;
  onUpdateCodes: (updated: StudentCode[]) => void;
  onResolvePayout: (requestId: string, invoice: Invoice) => void;
  onUpdateSuperAdminCode: (newCode: string) => void;
  onUpdateProductionLock: (lock: "none" | "student" | "teacher" | "admin") => void;
}

export default function AdminPortal({
  classes,
  courses,
  teachers,
  studentCodes,
  payoutRequests,
  invoices,
  superAdminCode,
  productionLock,
  onAddClass,
  onAddTeacher,
  onUpdateTeachers,
  onGenerateCode,
  onUpdateCodes,
  onResolvePayout,
  onUpdateSuperAdminCode,
  onUpdateProductionLock
}: AdminPortalProps) {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Tabs: 'dashboard' | 'classes' | 'teachers' | 'student-codes' | 'payouts' | 'settings'
  const [activeTab, setActiveTab] = useState<"dashboard" | "classes" | "teachers" | "student-codes" | "payouts" | "settings">("dashboard");

  // Input states
  const [className, setClassName] = useState("");
  const [classDesc, setClassDesc] = useState("");
  const [classSuccess, setClassSuccess] = useState("");

  const [tName, setTName] = useState("");
  const [tSurname, setTSurname] = useState("");
  const [tMatricule, setTMatricule] = useState("");
  const [tWhatsapp, setTWhatsapp] = useState("");
  const [tMobileMoney, setTMobileMoney] = useState("");
  const [tCommission, setTCommission] = useState(250);
  const [tPermCodes, setTPermCodes] = useState(true);
  const [tPermCourses, setTPermCourses] = useState(true);
  const [tPermStudents, setTPermStudents] = useState(false);
  const [teacherSuccess, setTeacherSuccess] = useState("");

  const [studMatricule, setStudMatricule] = useState("");
  const [codeType, setCodeType] = useState<AccessCodeType>("definitive");
  const [studClassId, setStudClassId] = useState("");
  const [codeSuccess, setCodeSuccess] = useState("");
  const [codeLog, setCodeLog] = useState("");

  const [newAdminCode, setNewAdminCode] = useState("");
  const [adminCodeSuccess, setAdminCodeSuccess] = useState("");

  const [viewedCourse, setViewedCourse] = useState<Course | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (password.trim() === superAdminCode) {
      setIsAuthorized(true);
    } else {
      setLoginError("Code d'accès incorrect. Veuillez réessayer.");
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPassword("");
    setViewedCourse(null);
  };

  if (!isAuthorized) {
    return (
      <div id="admin-login-container" className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock size={26} />
          </div>
          <h3 className="text-lg font-bold">Administration Principale</h3>
          <p className="text-xs text-slate-400 mt-1">
            Entrez votre code d'accès administrateur principal (Code par défaut: <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded">admin1234</code>)
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Code Administrateur
            </label>
            <input
              id="admin-pass-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Saisissez le code"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-lg text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          {loginError && (
            <p className="text-xs text-red-400 font-medium text-center">{loginError}</p>
          )}

          <button
            id="admin-login-submit"
            type="submit"
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-sm transition"
          >
            S'authentifier
          </button>
        </form>
      </div>
    );
  }

  // Handle adding class
  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClassSuccess("");

    if (!className.trim()) return;

    // Check if class exists
    const slug = className.trim().toLowerCase().replace(/[^a-z0-9]/gi, "-");
    const exists = classes.some(cl => cl.id === slug);
    if (exists) {
      alert("Cette classe existe déjà.");
      return;
    }

    const newCl: Class = {
      id: slug,
      name: className.trim(),
      description: classDesc.trim() || "Aucune description fournie."
    };

    onAddClass(newCl);
    setClassSuccess(`Classe "${className}" créée avec succès !`);
    setClassName("");
    setClassDesc("");
    setTimeout(() => setClassSuccess(""), 5000);
  };

  // Handle adding teacher
  const handleAddTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSuccess("");

    if (!tName.trim() || !tMatricule.trim()) {
      alert("Le nom et le matricule sont requis.");
      return;
    }

    // Check if matricule exists
    const exists = teachers.some(t => t.matricule === tMatricule.trim().toUpperCase());
    if (exists) {
      alert("Un enseignant avec ce matricule existe déjà.");
      return;
    }

    const newTeach: Teacher = {
      id: "teach-" + Math.floor(1000 + Math.random() * 9000),
      name: tName.trim(),
      surname: tSurname.trim(),
      matricule: tMatricule.trim().toUpperCase(),
      whatsapp: tWhatsapp.trim() || "+237",
      mobileMoney: tMobileMoney.trim() || "OM/MOMO",
      defaultCommission: tCommission,
      balance: 0,
      permissions: {
        generateCodes: tPermCodes,
        addCourses: tPermCourses,
        manageStudents: tPermStudents
      },
      createdAt: new Date().toISOString()
    };

    onAddTeacher(newTeach);
    setTeacherSuccess(`L'enseignant M. ${tName} (Matricule: ${tMatricule}) a été enrôlé !`);
    setTName("");
    setTSurname("");
    setTMatricule("");
    setTWhatsapp("");
    setTMobileMoney("");
    setTimeout(() => setTeacherSuccess(""), 5000);
  };

  // Handle generating code & distributing commission
  const handleGenerateStudentCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeSuccess("");
    setCodeLog("");

    if (!studMatricule.trim()) {
      alert("Le matricule élève est requis.");
      return;
    }

    if (codeType === "definitive" && !studClassId) {
      alert("Veuillez sélectionner une classe pour l'abonnement d'un an.");
      return;
    }

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const codeStr = `APP-${randNum}`;

    const newCode: StudentCode = {
      id: "sc-" + randNum,
      code: codeStr,
      matricule: studMatricule.trim().toUpperCase(),
      type: codeType,
      classId: codeType === "definitive" ? studClassId : undefined,
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: codeType === "temporary"
        ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 mins
        : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), // 1 year
      devicesUsed: []
    };

    // Distribute commission if definitive adding
    let commLog = "";
    if (codeType === "definitive") {
      // Find all teachers who have courses published in this specific class
      const authorsOfClass = Array.from(new Set(
        courses.filter(c => c.classId === studClassId).map(c => c.authorId)
      ));

      if (authorsOfClass.length > 0) {
        const updatedTeachers = teachers.map(teach => {
          if (authorsOfClass.includes(teach.matricule)) {
            const addedAmt = teach.defaultCommission;
            commLog += `• M. ${teach.name} (${teach.matricule}) : +${addedAmt} FCFA commission créditée.\n`;
            return {
              ...teach,
              balance: teach.balance + addedAmt
            };
          }
          return teach;
        });
        
        onUpdateTeachers(updatedTeachers);
      } else {
        commLog = "Aucun enseignant n'a encore publié de cours dans cette classe. Aucune commission n'a été distribuée.";
      }
    }

    onGenerateCode(newCode, commLog);
    setCodeSuccess(`Nouveau code généré : ${codeStr}`);
    setCodeLog(commLog);
    setStudMatricule("");
    setTimeout(() => {
      setCodeSuccess("");
      setCodeLog("");
    }, 15000);
  };

  const toggleTeacherPermission = (teacherMatricule: string, permissionKey: "generateCodes" | "addCourses" | "manageStudents") => {
    const updated = teachers.map(t => {
      if (t.matricule === teacherMatricule) {
        return {
          ...t,
          permissions: {
            ...t.permissions,
            [permissionKey]: !t.permissions[permissionKey]
          }
        };
      }
      return t;
    });
    onUpdateTeachers(updated);
  };

  const handleDeactivateStudent = (id: string) => {
    const updated = studentCodes.map(c => 
      c.id === id ? { ...c, status: "deactivated" as const } : c
    );
    onUpdateCodes(updated);
  };

  const handleDeleteStudent = (id: string) => {
    const updated = studentCodes.filter(c => c.id !== id);
    onUpdateCodes(updated);
  };

  // Resolve payout request, generate invoice and reset balance
  const handleResolvePayoutRequest = (req: PayoutRequest) => {
    const confirm = window.confirm(`Voulez-vous confirmer le paiement de ${req.amount} FCFA à M. ${req.teacherName} et remettre son compteur à 0 ?`);
    if (!confirm) return;

    // 1. Generate Invoice PDF
    const doc = new jsPDF();
    
    // Design Invoice
    doc.setFillColor(30, 41, 59); // Slate header box
    doc.rect(0, 0, 210, 50, "F");
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("HALRO MOBILE SCHOOL", 20, 25);
    
    doc.setFontSize(10);
    doc.text("Établissement d'Enseignement à Distance de Référence", 20, 32);
    doc.text("Contact Direction : Whatsapp admin1234", 20, 37);

    // Invoice Meta
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.text("REÇU DE COMMISSIONS ENSEIGNANT", 20, 65);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const invoiceId = `FACT-${Math.floor(100000 + Math.random() * 900000)}`;
    doc.text(`N° Facture : ${invoiceId}`, 20, 72);
    doc.text(`Date de paiement : ${new Date().toLocaleDateString()}`, 20, 77);
    doc.text(`Généré par l'Administrateur : ${password}`, 20, 82);

    doc.line(20, 87, 190, 87);

    // Teacher details table-style
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text("COORDONNÉES DU COLLÈGUE AUTEUR :", 20, 97);

    doc.setFontSize(11);
    doc.text(`Nom complet : M. ${req.teacherName} ${req.teacherSurname}`, 20, 107);
    doc.text(`Matricule Enseignant : ${req.teacherMatricule}`, 20, 114);
    doc.text(`Numéro WhatsApp : ${req.whatsapp}`, 20, 121);
    doc.text(`Compte Mobile Money crédité : ${req.mobileMoney}`, 20, 128);

    doc.line(20, 135, 190, 135);

    // Amount Table
    doc.setFillColor(241, 245, 249); // light background for total
    doc.rect(20, 142, 170, 20, "F");
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("MONTANT BRUT RÈGLÉ :", 25, 154);
    
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // emerald green for money
    doc.text(`${req.amount} FCFA`, 130, 154);

    // Footer note
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Note : En cliquant sur 'J'ai payé', le solde de l'enseignant a été remis à 0 FCFA dans le système.", 20, 175);
    doc.text("Ce document tient lieu de facture et de décharge définitive.", 20, 180);

    // Signature Area
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text("Signature Direction HALRO", 140, 200);
    doc.text("REÇU VALIDÉ", 145, 207);

    // Save/Download PDF automatically for the administrator
    doc.save(`facture_${req.teacherMatricule}_${new Date().toISOString().slice(0,10)}.pdf`);

    // 2. Create invoice in app state
    const newInvoice: Invoice = {
      id: invoiceId,
      payoutRequestId: req.id,
      teacherName: req.teacherName,
      teacherSurname: req.teacherSurname,
      teacherMatricule: req.teacherMatricule,
      whatsapp: req.whatsapp,
      mobileMoney: req.mobileMoney,
      amount: req.amount,
      paidAt: new Date().toISOString(),
      adminCode: password
    };

    // 3. Reset teacher balance to 0 and remove/mark the payout request
    onResolvePayout(req.id, newInvoice);
    alert("Le paiement a été validé ! Le compteur de l'enseignant est remis à 0, et sa facture PDF a été générée et téléchargée.");
  };

  const handleChangeAdminCode = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCodeSuccess("");

    if (!newAdminCode.trim()) {
      alert("Le code ne peut pas être vide.");
      return;
    }

    onUpdateSuperAdminCode(newAdminCode.trim());
    setAdminCodeSuccess("Code administrateur modifié avec succès ! Pensez à l'utiliser lors de votre prochaine connexion.");
    setNewAdminCode("");
    setTimeout(() => setAdminCodeSuccess(""), 5000);
  };

  const getStudentCountForClass = (classId: string) => {
    return studentCodes.filter(
      c => c.classId === classId && c.type === "definitive" && c.status === "active"
    ).length;
  };

  return (
    <div id="admin-portal-root" className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-slate-200">
      
      {/* Admin Sidebar Navigation */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 h-fit">
        <div className="flex items-center space-x-3 px-3 py-2 border-b border-slate-800 pb-3 mb-2">
          <div className="p-1.5 bg-red-500/10 text-red-400 rounded-lg">
            <Lock size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">DIRECTION</h4>
            <span className="text-[10px] text-slate-400">HALRO MOBILE SCHOOL</span>
          </div>
        </div>

        <button
          id="btn-tab-dashboard"
          onClick={() => { setActiveTab("dashboard"); setViewedCourse(null); }}
          className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === "dashboard" ? "bg-red-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <BookOpen size={14} />
          <span>Tableau de Bord & Classes</span>
        </button>

        <button
          id="btn-tab-classes"
          onClick={() => { setActiveTab("classes"); setViewedCourse(null); }}
          className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === "classes" ? "bg-red-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <PlusCircle size={14} />
          <span>Créer une Classe</span>
        </button>

        <button
          id="btn-tab-teachers"
          onClick={() => { setActiveTab("teachers"); setViewedCourse(null); }}
          className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === "teachers" ? "bg-red-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <Users size={14} />
          <span>Gérer les Enseignants</span>
        </button>

        <button
          id="btn-tab-student-codes"
          onClick={() => { setActiveTab("student-codes"); setViewedCourse(null); }}
          className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === "student-codes" ? "bg-red-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <Key size={14} />
          <span>Génération & Codes</span>
        </button>

        <button
          id="btn-tab-payouts"
          onClick={() => { setActiveTab("payouts"); setViewedCourse(null); }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === "payouts" ? "bg-red-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <DollarSign size={14} />
            <span>Facturation Enseignant</span>
          </div>
          {payoutRequests.filter(r => r.status === "pending").length > 0 && (
            <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
              {payoutRequests.filter(r => r.status === "pending").length}
            </span>
          )}
        </button>

        <button
          id="btn-tab-settings"
          onClick={() => { setActiveTab("settings"); setViewedCourse(null); }}
          className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === "settings" ? "bg-red-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <Settings size={14} />
          <span>Réglages Système</span>
        </button>

        <button
          id="btn-admin-logout"
          onClick={handleLogout}
          className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-400 transition hover:bg-red-950/20"
        >
          <Lock size={14} />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="lg:col-span-3 space-y-6">
        
        {viewedCourse ? (
          /* View Course Secure Panel for Admin (Allows Download) */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <button
              id="btn-back-from-course-view"
              onClick={() => setViewedCourse(null)}
              className="mb-4 flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition"
            >
              <span>← Retour au tableau de bord</span>
            </button>

            <h3 className="text-base font-black mb-1">Aperçu & Téléchargement</h3>
            <p className="text-xs text-slate-400 mb-4">
              En tant qu'administrateur principal, la sécurité par watermark est visible mais vous disposez du bouton vert pour générer et télécharger l'archive PDF officielle du cours.
            </p>

            <CourseViewer
              course={viewedCourse}
              userMatricule="ADMIN-PRINCIPAL"
              userCode={password}
              isSuperAdmin={true}
            />
          </div>
        ) : activeTab === "dashboard" ? (
          /* TAB 1: DASHBOARD & CLASSES */
          <div className="space-y-6">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Classes</span>
                <span className="text-xl font-bold text-slate-100 font-mono">{classes.length}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Cours PDF</span>
                <span className="text-xl font-bold text-slate-100 font-mono">{courses.length}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Élèves Enrôlés</span>
                <span className="text-xl font-bold text-slate-100 font-mono">
                  {studentCodes.filter(c => c.type === "definitive" && c.status === "active").length}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Demandes Factures</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {payoutRequests.filter(r => r.status === "pending").length}
                </span>
              </div>
            </div>

            {/* Class Cards with Course Lists */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Exploration globale des salles de classe</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map(cl => {
                  const classCourses = courses.filter(c => c.classId === cl.id);
                  const enrolledCount = getStudentCountForClass(cl.id);
                  return (
                    <div key={cl.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{cl.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{cl.description}</p>
                          </div>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                            {enrolledCount} Élève(s) d'un an
                          </span>
                        </div>

                        {classCourses.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-2">Aucun cours publié dans cette classe.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {classCourses.map(course => (
                              <div 
                                key={course.id} 
                                className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg text-xs hover:bg-slate-950 cursor-pointer transition border border-slate-900"
                                onClick={() => setViewedCourse(course)}
                              >
                                <span className="text-xs text-slate-300 font-medium truncate max-w-[180px]">{course.title}</span>
                                <span className="text-[9px] text-slate-500 shrink-0 font-mono italic">Par {course.authorId}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : activeTab === "classes" ? (
          /* TAB 2: CREATE A CLASS */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg max-w-lg">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center space-x-2">
              <PlusCircle size={16} className="text-red-400" />
              <span>Ajouter une Nouvelle Classe au Système</span>
            </h4>

            <form onSubmit={handleAddClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nom de la classe</label>
                <input
                  id="admin-class-name"
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ex: Terminale SE"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description / Série d'enseignement</label>
                <textarea
                  id="admin-class-desc"
                  value={classDesc}
                  onChange={(e) => setClassDesc(e.target.value)}
                  placeholder="Ex: Série scientifique orientée vers l'ingénierie..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {classSuccess && (
                <p className="text-xs text-emerald-400 font-semibold">{classSuccess}</p>
              )}

              <button
                id="admin-class-submit"
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs transition"
              >
                Créer la classe
              </button>
            </form>
          </div>
        ) : activeTab === "teachers" ? (
          /* TAB 3: MANAGE TEACHERS */
          <div className="space-y-6">
            
            {/* Add Teacher Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center space-x-2">
                <Users size={16} className="text-red-400" />
                <span>Enrôler un Enseignant (Auteur de cours)</span>
              </h4>

              <form onSubmit={handleAddTeacherSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nom de l'enseignant</label>
                  <input
                    id="admin-teach-name"
                    type="text"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    placeholder="Ex: Kouam"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Prénom de l'enseignant</label>
                  <input
                    id="admin-teach-surname"
                    type="text"
                    value={tSurname}
                    onChange={(e) => setTSurname(e.target.value)}
                    placeholder="Ex: Rodrigue"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Matricule Unique (Ex: ENS-1234)</label>
                  <input
                    id="admin-teach-matricule"
                    type="text"
                    value={tMatricule}
                    onChange={(e) => setTMatricule(e.target.value)}
                    placeholder="Ex: ENS-1024"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Commission par nouvel élève inscrit</label>
                  <select
                    id="admin-teach-commission"
                    value={tCommission}
                    onChange={(e) => setTCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value={100}>100 FCFA</option>
                    <option value={150}>150 FCFA</option>
                    <option value={200}>200 FCFA</option>
                    <option value={250}>250 FCFA</option>
                    <option value={500}>500 FCFA</option>
                    <option value={1000}>1000 FCFA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Numéro WhatsApp</label>
                  <input
                    id="admin-teach-whatsapp"
                    type="text"
                    value={tWhatsapp}
                    onChange={(e) => setTWhatsapp(e.target.value)}
                    placeholder="+237xxxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Compte Orange / Mobile Money</label>
                  <input
                    id="admin-teach-momo"
                    type="text"
                    value={tMobileMoney}
                    onChange={(e) => setTMobileMoney(e.target.value)}
                    placeholder="MOMO-xxxxxxxx ou OM-xxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                {/* Permissions Toggles */}
                <div className="md:col-span-2 border-t border-slate-800 pt-3 mt-1">
                  <span className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Autorisations Fonctionnalités (Professeur)</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      id="btn-toggle-codes"
                      type="button"
                      onClick={() => setTPermCodes(!tPermCodes)}
                      className={`flex items-center justify-between p-2 border rounded-lg text-xs font-medium transition ${
                        tPermCodes ? 'bg-indigo-900/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950 border-slate-850 text-slate-500'
                      }`}
                    >
                      <span>Créer de nouveaux codes</span>
                      {tPermCodes ? <ToggleRight size={18} className="text-indigo-400" /> : <ToggleLeft size={18} />}
                    </button>

                    <button
                      id="btn-toggle-courses"
                      type="button"
                      onClick={() => setTPermCourses(!tPermCourses)}
                      className={`flex items-center justify-between p-2 border rounded-lg text-xs font-medium transition ${
                        tPermCourses ? 'bg-indigo-900/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950 border-slate-850 text-slate-500'
                      }`}
                    >
                      <span>Ajouter des documents PDF</span>
                      {tPermCourses ? <ToggleRight size={18} className="text-indigo-400" /> : <ToggleLeft size={18} />}
                    </button>

                    <button
                      id="btn-toggle-students"
                      type="button"
                      onClick={() => setTPermStudents(!tPermStudents)}
                      className={`flex items-center justify-between p-2 border rounded-lg text-xs font-medium transition ${
                        tPermStudents ? 'bg-indigo-900/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950 border-slate-850 text-slate-500'
                      }`}
                    >
                      <span>Désactiver / Supprimer élèves</span>
                      {tPermStudents ? <ToggleRight size={18} className="text-indigo-400" /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </div>

                {teacherSuccess && (
                  <p className="md:col-span-2 text-xs text-emerald-400 font-semibold">{teacherSuccess}</p>
                )}

                <button
                  id="admin-teach-submit"
                  type="submit"
                  className="md:col-span-2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs transition mt-2"
                >
                  Enregistrer l'enseignant
                </button>
              </form>
            </div>

            {/* Teachers Table with Commissions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Liste des enseignants collègues et commissions</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2">Nom</th>
                      <th className="py-2">Matricule</th>
                      <th className="py-2">Taux Commission</th>
                      <th className="py-2">Solde Actuel</th>
                      <th className="py-2">Coordonnées de paiement</th>
                      <th className="py-2">Autorisations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {teachers.map(teacher => (
                      <tr key={teacher.id} id={`admin-teach-row-${teacher.id}`} className="hover:bg-slate-850/30">
                        <td className="py-3 font-semibold text-slate-200">M. {teacher.name} {teacher.surname}</td>
                        <td className="py-3 font-mono font-bold text-red-400">{teacher.matricule}</td>
                        <td className="py-3 text-slate-300 font-mono font-medium">{teacher.defaultCommission} FCFA</td>
                        <td className="py-3 text-emerald-400 font-bold font-mono text-sm">{teacher.balance} FCFA</td>
                        <td className="py-3 text-slate-400">
                          <div>WA: {teacher.whatsapp}</div>
                          <div className="text-[10px] text-slate-500">MOMO: {teacher.mobileMoney}</div>
                        </td>
                        <td className="py-3 space-y-1">
                          <div className="flex flex-wrap gap-1.5">
                            <span 
                              onClick={() => toggleTeacherPermission(teacher.matricule, "generateCodes")}
                              className={`cursor-pointer px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                teacher.permissions.generateCodes ? 'bg-indigo-900/20 border-indigo-500/20 text-indigo-300' : 'bg-slate-950 border-slate-850 text-slate-500 line-through'
                              }`}
                              title="Taper pour inverser la permission: Génération de codes"
                            >
                              Générer Codes
                            </span>
                            <span 
                              onClick={() => toggleTeacherPermission(teacher.matricule, "addCourses")}
                              className={`cursor-pointer px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                teacher.permissions.addCourses ? 'bg-indigo-900/20 border-indigo-500/20 text-indigo-300' : 'bg-slate-950 border-slate-850 text-slate-500 line-through'
                              }`}
                              title="Taper pour inverser la permission: Ajout de documents"
                            >
                              Ajouter PDF
                            </span>
                            <span 
                              onClick={() => toggleTeacherPermission(teacher.matricule, "manageStudents")}
                              className={`cursor-pointer px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                teacher.permissions.manageStudents ? 'bg-indigo-900/20 border-indigo-500/20 text-indigo-300' : 'bg-slate-950 border-slate-850 text-slate-500 line-through'
                              }`}
                              title="Taper pour inverser la permission: Administration d'élèves"
                            >
                              Gérer Élèves
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : activeTab === "student-codes" ? (
          /* TAB 4: ACCESS CODES GENERATION & REVIEW */
          <div className="space-y-6">
            
            {/* Generate Code Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg max-w-lg">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center space-x-2">
                <Key size={16} className="text-red-400" />
                <span>Générer un Code Unique Élève (WhatsApp)</span>
              </h4>

              <form onSubmit={handleGenerateStudentCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">Numéro de Matricule Élève</label>
                  <input
                    id="admin-student-matricule"
                    type="text"
                    value={studMatricule}
                    onChange={(e) => setStudMatricule(e.target.value)}
                    placeholder="Ex: MAT-2026-003"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Type d'abonnement / Génération</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-admin-code-temp"
                      type="button"
                      onClick={() => setCodeType("temporary")}
                      className={`py-2 px-3 border rounded-lg text-xs font-medium transition ${
                        codeType === "temporary" 
                          ? "bg-red-600 border-red-500 text-white" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-350"
                      }`}
                    >
                      Ajout Temporaire (30 min)
                    </button>
                    <button
                      id="btn-admin-code-def"
                      type="button"
                      onClick={() => setCodeType("definitive")}
                      className={`py-2 px-3 border rounded-lg text-xs font-medium transition ${
                        codeType === "definitive" 
                          ? "bg-red-600 border-red-500 text-white" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-350"
                      }`}
                    >
                      Ajout Définitif (1 an)
                    </button>
                  </div>
                </div>

                {codeType === "definitive" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Classe sollicitée par l'élève</label>
                    <select
                      id="admin-student-class"
                      value={studClassId}
                      onChange={(e) => setStudClassId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                      required
                    >
                      <option value="">Sélectionnez la classe</option>
                      {classes.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                    <span className="block text-[10px] text-slate-400 mt-1 italic">
                      Note: L'ajout créditera automatiquement la commission des enseignants ayant publié dans cette classe.
                    </span>
                  </div>
                )}

                {codeSuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-lg space-y-2">
                    <p className="text-xs font-mono font-extrabold flex items-center justify-between">
                      <span>{codeSuccess}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const code = codeSuccess.split(" : ")[1];
                          navigator.clipboard.writeText(code);
                          alert("Code copié dans le presse-papier ! Vous pouvez l'envoyer à l'élève.");
                        }}
                        className="p-1 bg-emerald-900/30 text-emerald-300 rounded border border-emerald-800 hover:bg-emerald-800/40"
                        title="Copier le code"
                      >
                        <Clipboard size={12} />
                      </button>
                    </p>
                    {codeLog && (
                      <div className="text-[10px] text-slate-300 border-t border-emerald-800/40 pt-2 font-mono whitespace-pre-wrap">
                        {codeLog}
                      </div>
                    )}
                  </div>
                )}

                <button
                  id="admin-code-submit"
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs transition"
                >
                  Générer le code sollicité
                </button>
              </form>
            </div>

            {/* List and manage generated codes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Registre général des codes apprenants</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2">Élève (Matricule)</th>
                      <th className="py-2">Code d'accès</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Classe Accès</th>
                      <th className="py-2">Appareils Simultanés</th>
                      <th className="py-2">Expiration</th>
                      <th className="py-2">Statut</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {studentCodes.map(student => {
                      const assocClass = classes.find(cl => cl.id === student.classId);
                      const isExpired = new Date(student.expiresAt).getTime() < Date.now();
                      const displayStatus = student.status === "active" && isExpired ? "expired" : student.status;
                      
                      return (
                        <tr key={student.id} id={`admin-student-row-${student.id}`} className="hover:bg-slate-850/30">
                          <td className="py-3 font-mono font-bold text-slate-300">{student.matricule}</td>
                          <td className="py-3 font-mono font-extrabold text-red-400 select-all">{student.code}</td>
                          <td className="py-3 capitalize text-slate-300">{student.type === "temporary" ? "Temporaire" : "Définitif (1 an)"}</td>
                          <td className="py-3 font-semibold text-slate-200">{assocClass ? assocClass.name : "Toutes les Classes"}</td>
                          <td className="py-3">
                            <span className={`font-mono px-1.5 py-0.5 rounded ${
                              student.devicesUsed.length > 2 ? 'bg-red-950 text-red-400 font-bold' : 'bg-slate-950 text-slate-400'
                            }`}>
                              {student.devicesUsed.length} / 2 {student.devicesUsed.length > 0 && `(${student.devicesUsed.join(", ")})`}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400 font-mono text-[10px]">
                            {student.type === "temporary" 
                              ? `Reste : ${Math.max(0, Math.floor((new Date(student.expiresAt).getTime() - Date.now()) / 60000))} min` 
                              : new Date(student.expiresAt).toLocaleDateString()
                            }
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              displayStatus === "active" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : displayStatus === "deactivated"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}>
                              {displayStatus === "active" ? "Actif" : displayStatus === "deactivated" ? "Désactivé" : "Expiré"}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            {student.status === "active" && !isExpired && (
                              <button
                                id={`admin-deactivate-btn-${student.id}`}
                                onClick={() => handleDeactivateStudent(student.id)}
                                className="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-500/10 text-red-400 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Désactiver
                              </button>
                            )}
                            <button
                              id={`admin-delete-btn-${student.id}`}
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-1 text-slate-500 hover:text-red-400 transition"
                              title="Supprimer définitivement"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : activeTab === "payouts" ? (
          /* TAB 5: PAYOUTS & FACTURATION */
          <div className="space-y-6">
            
            {/* Pending Payout Requests Notification Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
                <Bell size={18} className="text-amber-400 animate-swing" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Demandes de Paiement Enseignants ("Payez moi")
                </h4>
              </div>

              <div className="space-y-4">
                {payoutRequests.filter(r => r.status === "pending").length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center bg-slate-950/20 rounded-xl border border-slate-850">
                    Aucune demande de paiement en attente d'arbitrage.
                  </p>
                ) : (
                  payoutRequests
                    .filter(r => r.status === "pending")
                    .map(req => (
                      <div 
                        key={req.id} 
                        id={`payout-card-${req.id}`}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-slate-700 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-200">M. {req.teacherName} {req.teacherSurname}</span>
                            <span className="text-[10px] font-mono text-red-400 bg-slate-900 px-1.5 py-0.5 rounded font-bold">{req.teacherMatricule}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-400 font-mono">
                            <div>WhatsApp : <span className="text-slate-300 font-bold">{req.whatsapp}</span></div>
                            <div>Mobile Money : <span className="text-slate-300 font-bold">{req.mobileMoney}</span></div>
                            <div>Envoyé le : {new Date(req.createdAt).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 shrink-0 self-end md:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">MONTANT ATTENDU</span>
                            <span className="text-lg font-black text-emerald-400 font-mono">{req.amount} FCFA</span>
                          </div>
                          <button
                            id={`btn-admin-pay-${req.id}`}
                            onClick={() => handleResolvePayoutRequest(req)}
                            className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
                          >
                            <Download size={12} />
                            <span>J'ai payé</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Invoices History */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Registre des factures réglées (PDF Générés)</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2">N° Facture</th>
                      <th className="py-2">Nom Enseignant</th>
                      <th className="py-2">Matricule</th>
                      <th className="py-2">Montant Réglé</th>
                      <th className="py-2">Compte Crédité</th>
                      <th className="py-2">Date Règlement</th>
                      <th className="py-2 text-right">Facture PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {invoices.map(invoice => (
                      <tr key={invoice.id} id={`invoice-row-${invoice.id}`} className="hover:bg-slate-850/30 text-slate-300">
                        <td className="py-3 font-mono font-bold text-slate-400">{invoice.id}</td>
                        <td className="py-3 font-semibold">M. {invoice.teacherName} {invoice.teacherSurname}</td>
                        <td className="py-3 font-mono text-red-400 font-bold">{invoice.teacherMatricule}</td>
                        <td className="py-3 text-emerald-400 font-bold font-mono">{invoice.amount} FCFA</td>
                        <td className="py-3 font-mono text-[10px] text-slate-400">{invoice.mobileMoney}</td>
                        <td className="py-3 text-slate-400">{new Date(invoice.paidAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <span className="text-[10px] bg-slate-950 text-emerald-400 border border-emerald-950 px-2 py-1 rounded inline-flex items-center space-x-1">
                            <CheckCircle size={10} />
                            <span>PDF Téléchargé</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-500 italic">
                          Aucun règlement archivé dans cette session.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          /* TAB 6: SETTINGS & PASSWORD */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg max-w-lg">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center space-x-2">
              <Settings size={16} className="text-red-400" />
              <span>Changer le Code d'accès Administrateur</span>
            </h4>

            <form onSubmit={handleChangeAdminCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Code Administrateur Actuel</label>
                <div className="px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs font-mono text-red-400 font-bold w-fit">
                  {superAdminCode}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nouveau Code d'accès unique</label>
                <input
                  id="admin-new-code"
                  type="text"
                  value={newAdminCode}
                  onChange={(e) => setNewAdminCode(e.target.value)}
                  placeholder="Ex: admin5678"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-750 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              {adminCodeSuccess && (
                <p className="text-xs text-emerald-400 font-semibold">{adminCodeSuccess}</p>
              )}

              <button
                id="admin-change-submit"
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs transition"
              >
                Sauvegarder le nouveau code
              </button>
            </form>

            {/* Production Lock Config */}
            <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Lock size={16} className="text-amber-500" />
                <span>Mode Production (Verrouillage du rôle)</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Par défaut, l'application est en mode <strong>Bac à sable (Démonstration)</strong> pour vous permettre de tester les rôles (Élève, Enseignant, Admin) via les onglets du haut. 
                <br /><br />
                Si vous souhaitez distribuer l'application à vos élèves, choisissez <strong>Mode Élève uniquement</strong>. Cela masquera définitivement la barre supérieure de test. Vous pourrez toujours revenir à l'administration en cliquant sur le bouton discret du bas avec votre code secret.
              </p>

              <div className="space-y-2 mt-2">
                {[
                  { value: "none", label: "🔓 Mode Bac à sable multi-rôles (Démonstration/Test)" },
                  { value: "student", label: "📱 Mode Élève uniquement (Recommandé pour distribution)" },
                  { value: "teacher", label: "👨‍🏫 Mode Enseignant uniquement" },
                  { value: "admin", label: "🔑 Mode Super Admin uniquement" }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                      productionLock === option.value
                        ? "bg-amber-500/10 border-amber-500/30 text-slate-200"
                        : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="production-lock-radio"
                      checked={productionLock === option.value}
                      onChange={() => {
                        if (option.value !== "none") {
                          const confirm = window.confirm(`Voulez-vous verrouiller l'application en mode "${option.label.split(" ").slice(1).join(" ")}" ?\n\nLe sélecteur de rôles de démonstration sera masqué pour vos utilisateurs.`);
                          if (!confirm) return;
                        }
                        onUpdateProductionLock(option.value as any);
                      }}
                      className="mt-1 accent-amber-500"
                    />
                    <span className="text-xs font-semibold">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
