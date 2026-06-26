/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Key, UserCheck, DollarSign, Send, RefreshCw, PlusCircle, FilePlus, 
  Trash2, ShieldAlert, LogOut, CheckCircle, Users, Layers, BookOpen, AlertCircle
} from "lucide-react";
import { Teacher, Class, Course, StudentCode, PayoutRequest, AccessCodeType } from "../types";

const loadPdfJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => {
      reject(new Error("Impossible de charger le moteur de lecture PDF. Veuillez vérifier votre connexion."));
    };
    document.body.appendChild(script);
  });
};

const extractPdfPagesText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await loadPdfJS();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pagesText: string[] = [];
  
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];
    
    // Reconstruct layout lines
    const linesMap: { [key: number]: any[] } = {};
    items.forEach(item => {
      const y = Math.round(item.transform[5]);
      const existingY = Object.keys(linesMap).map(Number).find(keyY => Math.abs(keyY - y) < 4);
      if (existingY !== undefined) {
        linesMap[existingY].push(item);
      } else {
        linesMap[y] = [item];
      }
    });
    
    const sortedYs = Object.keys(linesMap).map(Number).sort((a, b) => b - a);
    const pageLines = sortedYs.map(y => {
      const lineItems = linesMap[y].sort((a, b) => a.transform[4] - b.transform[4]);
      return lineItems.map(item => item.str).join(" ");
    });
    
    // Add subtitle indicating section/page boundaries beautifully in continuous document
    pagesText.push(`\n# --- PAGE ${i} --- \n\n` + pageLines.join("\n"));
  }
  return pagesText.join("\n");
};

const loadMammoth = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).mammoth) {
      resolve((window as any).mammoth);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    script.onload = () => {
      resolve((window as any).mammoth);
    };
    script.onerror = () => {
      reject(new Error("Impossible de charger le moteur de documents Word."));
    };
    document.body.appendChild(script);
  });
};

const extractDocxPagesText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const mammoth = await loadMammoth();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "Document Word sans contenu lisible.";
};

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier texte."));
    reader.readAsText(file);
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const processUploadedFile = async (file: File): Promise<string> => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  
  if (extension === "pdf") {
    const text = await extractPdfPagesText(file);
    const base64 = await fileToBase64(file);
    return JSON.stringify({
      isRichContent: true,
      contentType: "pdf",
      pdfBase64: base64,
      text: text
    });
  } else if (extension === "docx") {
    const text = await extractDocxPagesText(file);
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await loadMammoth();
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    return JSON.stringify({
      isRichContent: true,
      contentType: "docx",
      html: htmlResult.value,
      text: text
    });
  } else if (extension === "txt") {
    const text = await readTextFile(file);
    return JSON.stringify({
      isRichContent: true,
      contentType: "text",
      text: text
    });
  } else {
    throw new Error("Format non supporté. Veuillez importer un fichier PDF, Word (.docx) ou Texte (.txt).");
  }
};

const getCourseSizeDisplay = (content: string) => {
  if (content && content.startsWith('{"isRichContent"')) {
    try {
      const data = JSON.parse(content);
      if (data.contentType === "pdf") return "PDF (Haute Fidélité)";
      if (data.contentType === "docx") return "Word (Riche)";
      return "Texte";
    } catch (e) {}
  }
  return `${Math.ceil((content || "").length / 1000)} page(s)`;
};

interface TeacherPortalProps {
  teachers: Teacher[];
  classes: Class[];
  courses: Course[];
  studentCodes: StudentCode[];
  payoutRequests: PayoutRequest[];
  onAddCourse: (newCourse: Course) => void;
  onGenerateCode: (newCode: StudentCode) => void;
  onUpdateCodes: (updatedCodes: StudentCode[]) => void;
  onSendPayoutRequest: (request: PayoutRequest) => void;
  onDeleteTeacher?: (teacherId: string) => void;
}

export default function TeacherPortal({
  teachers,
  classes,
  courses,
  studentCodes,
  payoutRequests,
  onAddCourse,
  onGenerateCode,
  onUpdateCodes,
  onSendPayoutRequest,
  onDeleteTeacher
}: TeacherPortalProps) {
  const [loginMatricule, setLoginMatricule] = useState("");
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);
  const [loginError, setLoginError] = useState("");
  
  // States for Teacher Actions
  const [courseTitle, setCourseTitle] = useState("");
  const [courseClassId, setCourseClassId] = useState("");
  const [courseContent, setCourseContent] = useState<string>("");
  const [courseSuccess, setCourseSuccess] = useState("");
  const [teacherCourseFileLoading, setTeacherCourseFileLoading] = useState(false);
  const [teacherCourseFileError, setTeacherCourseFileError] = useState("");
  const [teacherIsDragging, setTeacherIsDragging] = useState(false);
  const teacherFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTeacherFileChange = async (file: File) => {
    if (!file) return;
    setTeacherCourseFileError("");
    setTeacherCourseFileLoading(true);

    try {
      const richContent = await processUploadedFile(file);
      setCourseContent(richContent);
      
      // Auto-set course title from file name if empty
      if (!courseTitle) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/_/g, " ")
          .replace(/-/g, " ");
        setCourseTitle(cleanName);
      }
    } catch (err: any) {
      console.error(err);
      setTeacherCourseFileError(err.message || "Une erreur est survenue lors de l'importation du fichier.");
    } finally {
      setTeacherCourseFileLoading(false);
    }
  };

  const [studentMatricule, setStudentMatricule] = useState("");
  const [studentCodeType, setStudentCodeType] = useState<AccessCodeType>("definitive");
  const [studentClassId, setStudentClassId] = useState("");
  const [codeSuccess, setCodeSuccess] = useState("");

  const [payoutSuccess, setPayoutSuccess] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const trimmed = loginMatricule.trim().toUpperCase();

    if (!trimmed) {
      setLoginError("Veuillez saisir votre matricule.");
      return;
    }

    const found = teachers.find(t => t.matricule === trimmed);
    if (!found) {
      setLoginError("Enseignant non trouvé. Seul le matricule enseignant (Ex: ENS-1024) est autorisé.");
      return;
    }

    setActiveTeacher(found);
    // Reset success alerts
    setCourseSuccess("");
    setCodeSuccess("");
    setPayoutSuccess("");
  };

  const handleLogout = () => {
    setActiveTeacher(null);
    setLoginMatricule("");
  };

  if (!activeTeacher) {
    return (
      <div id="teacher-login-container" className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UserCheck size={26} />
          </div>
          <h3 className="text-lg font-bold">Portail Enseignant / Auteur</h3>
          <p className="text-xs text-slate-400 mt-1">
            Connectez-vous à l'aide de votre matricule fourni par l'administrateur principal.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Matricule Enseignant
            </label>
            <input
              id="teacher-matricule-input"
              type="text"
              value={loginMatricule}
              onChange={(e) => setLoginMatricule(e.target.value)}
              placeholder="Ex: ENS-1024"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-lg text-sm font-mono tracking-widest text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {loginError && (
            <p className="text-xs text-red-400 font-medium text-center">{loginError}</p>
          )}

          <button
            id="teacher-login-submit"
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition"
          >
            Se connecter
          </button>
        </form>
      </div>
    );
  }

  // Calculate stats for current logged-in teacher
  const teacherCourses = courses.filter(c => c.authorId === activeTeacher.matricule);
  const teacherClassIds = Array.from(new Set(teacherCourses.map(c => c.classId)));
  const classesWithTeacherCourses = classes.filter(cl => teacherClassIds.includes(cl.id));

  // Count active students in classes where this teacher has courses
  const getStudentCountForClass = (classId: string) => {
    return studentCodes.filter(
      c => c.classId === classId && c.type === "definitive" && c.status === "active"
    ).length;
  };

  const totalStudentsInTeacherClasses = teacherClassIds.reduce(
    (acc, classId) => acc + getStudentCountForClass(classId), 0
  );

  // Handle Payout Request "Payez moi"
  const handlePayoutRequest = () => {
    if (activeTeacher.balance <= 0) {
      alert("Votre solde est insuffisant pour demander un paiement.");
      return;
    }

    // Check if there is already a pending request
    const alreadyPending = payoutRequests.some(
      r => r.teacherMatricule === activeTeacher.matricule && r.status === "pending"
    );

    if (alreadyPending) {
      alert("Vous avez déjà une demande de paiement en attente d'approbation.");
      return;
    }

    const newRequest: PayoutRequest = {
      id: "req-" + Math.floor(1000 + Math.random() * 9000),
      teacherId: activeTeacher.id,
      teacherName: activeTeacher.name,
      teacherSurname: activeTeacher.surname,
      teacherMatricule: activeTeacher.matricule,
      whatsapp: activeTeacher.whatsapp,
      mobileMoney: activeTeacher.mobileMoney,
      amount: activeTeacher.balance,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    onSendPayoutRequest(newRequest);
    setPayoutSuccess("Votre demande de paiement de " + activeTeacher.balance + " FCFA a été transmise à l'administrateur !");
    setTimeout(() => setPayoutSuccess(""), 6000);
  };

  // Add Course
  const handleAddNewCourse = (e: React.FormEvent) => {
    e.preventDefault();
    setCourseSuccess("");

    if (!courseTitle.trim() || !courseClassId || !courseContent.trim()) {
      alert("Veuillez remplir tous les champs du cours.");
      return;
    }

    const newCourse: Course = {
      id: "crs-" + Math.floor(1000 + Math.random() * 9000),
      classId: courseClassId,
      title: courseTitle,
      authorId: activeTeacher.matricule,
      authorName: `M. ${activeTeacher.name} ${activeTeacher.surname}`,
      content: courseContent.trim(),
      createdAt: new Date().toISOString()
    };

    onAddCourse(newCourse);
    setCourseSuccess("Le cours a été ajouté avec succès dans la classe sélectionnée !");
    setCourseTitle("");
    setCourseContent("");
    setTimeout(() => setCourseSuccess(""), 5000);
  };

  // Generate student code
  const handleGenerateStudentCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeSuccess("");

    if (!studentMatricule.trim()) {
      alert("Veuillez saisir le matricule de l'élève.");
      return;
    }

    if (studentCodeType === "definitive" && !studentClassId) {
      alert("Veuillez choisir une classe pour un abonnement définitif.");
      return;
    }

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const codeStr = `APP-${randNum}`;
    
    const newCode: StudentCode = {
      id: "sc-" + randNum,
      code: codeStr,
      matricule: studentMatricule.trim().toUpperCase(),
      type: studentCodeType,
      classId: studentCodeType === "definitive" ? studentClassId : undefined,
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: studentCodeType === "temporary" 
        ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 mins
        : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), // 1 year
      devicesUsed: []
    };

    onGenerateCode(newCode);
    setCodeSuccess(`Code généré avec succès: ${codeStr} (${studentCodeType === "temporary" ? "30 minutes" : "1 an"})`);
    setStudentMatricule("");
    setTimeout(() => setCodeSuccess(""), 6000);
  };

  const handleDeactivateStudent = (id: string) => {
    const confirm = window.confirm("Voulez-vous vraiment désactiver ce code d'accès ?");
    if (!confirm) return;

    const updated = studentCodes.map(c => 
      c.id === id ? { ...c, status: "deactivated" as const } : c
    );
    onUpdateCodes(updated);
  };

  const handleDeleteStudent = (id: string) => {
    const confirm = window.confirm("Voulez-vous supprimer définitivement ce code de l'historique ?");
    if (!confirm) return;

    const updated = studentCodes.filter(c => c.id !== id);
    onUpdateCodes(updated);
  };

  return (
    <div id="teacher-portal-root" className="space-y-6 text-slate-200">
      
      {/* Teacher Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
            {activeTeacher.name[0]}{activeTeacher.surname[0]}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              M. {activeTeacher.name} {activeTeacher.surname}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span className="font-mono text-indigo-400 font-semibold">{activeTeacher.matricule}</span>
              <span>•</span>
              <span>Auteur de cours</span>
            </div>
          </div>
        </div>

        {/* Counter and PAY ME button */}
        <div className="flex items-center space-x-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800 self-start md:self-auto">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">COMPTEUR TARIFAIRE</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {activeTeacher.balance} <span className="text-xs font-semibold text-slate-400">FCFA</span>
            </span>
          </div>
          <button
            id="btn-teacher-payme"
            onClick={handlePayoutRequest}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition duration-200 shadow-md shadow-emerald-950/40 cursor-pointer"
            title="Envoyer une demande de paiement OM/MOMO à l'administrateur"
          >
            <DollarSign size={14} />
            <span>Payez moi</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 self-start md:self-auto">
          <button
            id="btn-teacher-logout"
            onClick={handleLogout}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition"
          >
            <LogOut size={12} />
            <span>Quitter</span>
          </button>

          <button
            id="btn-teacher-unsubscribe"
            onClick={() => {
              if (!activeTeacher) return;
              const confirm1 = window.confirm("ATTENTION : Cette action est IRREVERSIBLE. Êtes-vous sûr de vouloir vous désabonner définitivement de HALRO MOBILE SCHOOL ? Votre profil enseignant sera supprimé et vous perdrez l'accès à vos cours.");
              if (!confirm1) return;
              const confirm2 = window.confirm("Dernière confirmation : En cliquant sur OK, vous supprimez définitivement votre compte d'enseignant. Vos cours ne seront plus modifiables par vous. Continuer ?");
              if (!confirm2) return;

              if (onDeleteTeacher) {
                onDeleteTeacher(activeTeacher.id);
              }
              setActiveTeacher(null);
              setLoginMatricule("");
              alert("Désabonnement réussi. Votre compte a été définitivement supprimé de la plateforme.");
            }}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-red-950/40 hover:bg-red-950/60 text-red-400 hover:text-red-300 border border-red-900/30 rounded-lg text-xs font-bold transition"
            title="Se désabonner définitivement de la plateforme"
          >
            <Trash2 size={12} />
            <span>Se désabonner</span>
          </button>
        </div>
      </div>

      {payoutSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center space-x-2 text-xs">
          <CheckCircle size={16} />
          <span>{payoutSuccess}</span>
        </div>
      )}

      {/* Class Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Élèves Enrôlés</span>
            <Users size={18} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{totalStudentsInTeacherClasses}</p>
          <p className="text-[10px] text-slate-400 mt-1">Élèves actifs dans vos salles de classe.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Salles de classe</span>
            <Layers size={18} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{classesWithTeacherCourses.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Où vos cours sont disponibles.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Cours Publiés</span>
            <BookOpen size={18} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{teacherCourses.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Supports PDF sécurisés mis en ligne.</p>
        </div>
      </div>

      {/* Teacher Action Gated Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ACTION: ADD PDF DOCUMENTS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <FilePlus size={16} className="text-indigo-400" />
                <span>Ajouter des Documents PDF</span>
              </h4>
              {!activeTeacher.permissions.addCourses && (
                <span className="text-[10px] bg-red-950/50 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold">Bloqué</span>
              )}
            </div>

            {!activeTeacher.permissions.addCourses ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                <ShieldAlert size={36} className="text-red-500/40 mb-2" />
                <p className="text-xs text-slate-400 max-w-xs">
                  Vous n'avez pas l'autorisation d'ajouter de nouveaux documents. Contactez l'administrateur principal pour l'activer.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddNewCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Titre du support de cours</label>
                  <input
                    id="teacher-course-title"
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Ex: Chapitre 3 : Électrostatique"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Classe de destination</label>
                  <select
                    id="teacher-course-class"
                    value={courseClassId}
                    onChange={(e) => setCourseClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Sélectionnez la classe</option>
                    {classes.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Importer un fichier réel (PDF, Word ou Texte)
                  </label>
                  <input
                    type="file"
                    ref={teacherFileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleTeacherFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      setTeacherIsDragging(true);
                    }}
                    onDragLeave={() => setTeacherIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setTeacherIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleTeacherFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => teacherFileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition relative group ${
                      teacherIsDragging 
                        ? "border-emerald-500 bg-emerald-500/10" 
                        : "border-slate-850 hover:border-indigo-500/50 bg-slate-950/40"
                    }`}
                  >
                    {teacherCourseFileLoading ? (
                      <div className="space-y-1.5 py-1">
                        <div className="mx-auto w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[11px] font-semibold text-slate-300">Extraction et sécurisation...</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="mx-auto w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center group-hover:scale-105 transition">
                          <FilePlus size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-slate-300">
                            {courseContent && courseContent !== "" && courseContent !== "Support de cours - PDF sécurisé."
                              ? "✓ Support importé avec succès !" 
                              : "Glisser-déposer ou cliquer pour importer un PDF, Word ou Texte"}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            Le contenu intégral de votre document sera extrait et sécurisé automatiquement.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {teacherCourseFileError && (
                    <p className="text-red-400 text-[10px] mt-1 font-semibold">{teacherCourseFileError}</p>
                  )}
                  {courseContent && courseContent !== "" && courseContent !== "Support de cours - PDF sécurisé." && (
                    <p className="text-emerald-400 text-[10px] mt-1 font-medium">
                      ✓ Contenu extrait avec succès ({courseContent.length} caractères, environ {Math.ceil(courseContent.length / 1500)} page(s) standard).
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-400">Contenu écrit du Document / Livre (Texte intégral)</label>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {courseContent ? courseContent.split(/\s+/).filter(Boolean).length : 0} mots
                    </div>
                  </div>
                  
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1">
                    <textarea
                      id="teacher-course-content-textarea"
                      value={courseContent}
                      onChange={(e) => setCourseContent(e.target.value)}
                      placeholder="Saisissez ou modifiez ici le texte intégral de votre support de cours ou du livre..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-300 placeholder-slate-700 min-h-[160px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-y"
                      required
                    />
                    <div className="text-[8px] text-slate-500 italic">
                      ✓ Système de stockage volumineux IndexedDB actif (Capacité illimitée pour vos livres)
                    </div>
                  </div>
                </div>

                {courseSuccess && (
                  <p className="text-xs text-emerald-400 font-medium">{courseSuccess}</p>
                )}

                <button
                  id="teacher-course-submit"
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition"
                >
                  Publier le cours
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ACTION: GENERATE NEW STUDENT CODES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <PlusCircle size={16} className="text-indigo-400" />
                <span>Créer de Nouveaux Codes Apprenants</span>
              </h4>
              {!activeTeacher.permissions.generateCodes && (
                <span className="text-[10px] bg-red-950/50 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold">Bloqué</span>
              )}
            </div>

            {!activeTeacher.permissions.generateCodes ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                <ShieldAlert size={36} className="text-red-500/40 mb-2" />
                <p className="text-xs text-slate-400 max-w-xs">
                  Vous n'avez pas l'autorisation de générer des codes d'élèves. Demandez à l'administrateur principal de vous accorder cette permission.
                </p>
              </div>
            ) : (
              <form onSubmit={handleGenerateStudentCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Matricule Élève sollicitant</label>
                  <input
                    id="teacher-student-matricule"
                    type="text"
                    value={studentMatricule}
                    onChange={(e) => setStudentMatricule(e.target.value)}
                    placeholder="Ex: MAT-2026-045"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Type d'abonnement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-teacher-code-temp"
                      type="button"
                      onClick={() => setStudentCodeType("temporary")}
                      className={`py-2 px-3 border rounded-lg text-xs font-medium transition ${
                        studentCodeType === "temporary" 
                          ? "bg-indigo-600 border-indigo-500 text-white" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-350"
                      }`}
                    >
                      Ajout Temporaire (30 min)
                    </button>
                    <button
                      id="btn-teacher-code-def"
                      type="button"
                      onClick={() => setStudentCodeType("definitive")}
                      className={`py-2 px-3 border rounded-lg text-xs font-medium transition ${
                        studentCodeType === "definitive" 
                          ? "bg-indigo-600 border-indigo-500 text-white" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-350"
                      }`}
                    >
                      Ajout Définitif (1 an)
                    </button>
                  </div>
                </div>

                {studentCodeType === "definitive" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Classe autorisée (Unique)</label>
                    <select
                      id="teacher-student-class"
                      value={studentClassId}
                      onChange={(e) => setStudentClassId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Sélectionnez la classe</option>
                      {classes.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {codeSuccess && (
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
                    <p className="text-xs font-mono font-bold text-emerald-400">{codeSuccess}</p>
                  </div>
                )}

                <button
                  id="teacher-code-submit"
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition"
                >
                  Générer le code d'accès
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* ACTION: DEACTIVATE / DELETE STUDENTS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Users size={16} className="text-indigo-400" />
            <span>Gestion des Apprenants Associés</span>
          </h4>
          {!activeTeacher.permissions.manageStudents && (
            <span className="text-[10px] bg-red-950/50 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold">Bloqué</span>
          )}
        </div>

        {!activeTeacher.permissions.manageStudents ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <ShieldAlert size={36} className="text-red-500/40 mb-2" />
            <p className="text-xs text-slate-400 max-w-xs">
              Vous n'avez pas l'autorisation de désactiver ou de supprimer les codes des apprenants.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2">Élève & Coordonnées</th>
                    <th className="py-2">Code</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Classe</th>
                    <th className="py-2">Statut</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {studentCodes
                    .filter(code => code.type === "temporary" || (code.classId && teacherClassIds.includes(code.classId)))
                    .map(student => {
                      const assocClass = classes.find(cl => cl.id === student.classId);
                      return (
                        <tr key={student.id} id={`student-row-${student.id}`} className="hover:bg-slate-850/40">
                          <td className="py-3">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-200">{student.studentName || "Inconnu"}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Matricule: {student.matricule}</div>
                              {student.studentPhone && (
                                <div className="text-[10px] text-emerald-400 font-mono">{student.studentPhone}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 font-mono text-indigo-400">{student.code}</td>
                          <td className="py-3 capitalize">{student.type === "temporary" ? "Temporaire" : "Définitif (1 an)"}</td>
                          <td className="py-3">{assocClass ? assocClass.name : "Toutes"}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              student.status === "active" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : student.status === "deactivated"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}>
                              {student.status === "active" ? "Actif" : student.status === "deactivated" ? "Désactivé" : "Expiré"}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            {student.status === "active" && (
                              <button
                                id={`btn-deactivate-${student.id}`}
                                onClick={() => handleDeactivateStudent(student.id)}
                                className="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-500/10 text-red-400 rounded transition text-[10px] font-bold"
                              >
                                Désactiver
                              </button>
                            )}
                            <button
                              id={`btn-delete-${student.id}`}
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-1 text-slate-500 hover:text-red-400 transition"
                              title="Supprimer définitivement"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {studentCodes.filter(code => code.type === "temporary" || (code.classId && teacherClassIds.includes(code.classId))).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500 italic">
                        Aucun apprenant enregistré sous vos classes d'affectation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
