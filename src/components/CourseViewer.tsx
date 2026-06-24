/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, Lock, ShieldAlert, AlertTriangle, EyeOff, FileText } from "lucide-react";
import { Course } from "../types";
import { jsPDF } from "jspdf";

interface CourseViewerProps {
  course: Course;
  userMatricule: string;
  userCode: string;
  isSuperAdmin: boolean;
}

export default function CourseViewer({ course, userMatricule, userCode, isSuperAdmin }: CourseViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showPrintWarning, setShowPrintWarning] = useState(false);

  // Disable copy-paste, print screen events, and right click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("HALRO MOBILE SCHOOL : Le clic droit et la copie de contenu sont désactivés pour protéger les droits d'auteur.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen or Ctrl+P
      if (e.key === "PrintScreen") {
        e.preventDefault();
        alert("Capture d'écran désactivée par le système de sécurité HALRO Mobile.");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowPrintWarning(true);
        setTimeout(() => setShowPrintWarning(false), 5000);
        alert("L'impression de ce document est strictement interdite pour les apprenants.");
      }
      // Prevent copy keys
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "u" || e.key === "s")) {
        e.preventDefault();
        alert("Action non autorisée. La protection intellectuelle de HALRO est activée.");
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const downloadPDFForAdmin = () => {
    if (!isSuperAdmin) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("HALRO MOBILE SCHOOL", 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Document téléchargé par l'Administrateur Principal`, 20, 32);
    doc.text(`Date de génération : ${new Date().toLocaleDateString()}`, 20, 37);
    
    doc.line(20, 42, 190, 42);
    
    // Course Details
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(course.title, 20, 52);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Auteur: ${course.authorName} (${course.authorId})`, 20, 60);
    
    // Content pages
    let currentY = 75;
    course.content.forEach((pageContent, idx) => {
      if (idx > 0) {
        doc.addPage();
        currentY = 25;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(`SECTION ${idx + 1}`, 20, currentY);
      currentY += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // Slate-700
      
      // Split text to fit page width
      const splitLines = doc.splitTextToSize(pageContent, 170);
      splitLines.forEach((line: string) => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(line, 20, currentY);
        currentY += 7;
      });
    });
    
    doc.save(`${course.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
  };

  return (
    <div id="course-viewer-container" className="relative select-none bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto my-4 w-full text-slate-200">
      
      {/* Header */}
      <div id="course-viewer-header" className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <FileText size={18} />
          </div>
          <div>
            <h4 className="font-semibold text-sm line-clamp-1 text-slate-100">{course.title}</h4>
            <p className="text-xs text-slate-400">Auteur: {course.authorName}</p>
          </div>
        </div>

        {isSuperAdmin ? (
          <button
            id="btn-admin-download-pdf"
            onClick={downloadPDFForAdmin}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition duration-200 shadow-md shadow-emerald-900/20"
            title="Télécharger en format PDF original (Réservé Admin Principal)"
          >
            <Download size={14} />
            <span>Télécharger (Admin)</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1 text-red-400 bg-red-900/20 px-2 py-1 rounded-md text-xs font-semibold border border-red-500/10">
            <Lock size={12} />
            <span>Sécurisé</span>
          </div>
        )}
      </div>

      {/* Main Secure Board with watermarks */}
      <div 
        id="course-viewer-body" 
        className="relative p-6 min-h-[350px] bg-slate-950 flex flex-col justify-between overflow-hidden"
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
      >
        {/* Dynamic Watermark Background Grid */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 pointer-events-none opacity-5 select-none z-0 transform -rotate-12 scale-110">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="flex items-center justify-center text-[11px] font-bold text-red-500 whitespace-nowrap uppercase tracking-widest leading-none border border-red-500/5 p-4 text-center"
            >
              HALRO SCHOOL<br />
              {userMatricule}<br />
              SANS TÉLÉCHARGEMENT<br />
              CODE: {userCode}
            </div>
          ))}
        </div>

        {/* Dynamic Floating Watermark Cursor-area overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0 select-none">
          <div className="absolute top-1/4 left-1/4 text-sm font-extrabold text-red-500 transform rotate-45">
            HALRO SECURITY - PROPRIÉTÉ EXCLUSIVE DE {userMatricule} - COPIE INTERDITE
          </div>
          <div className="absolute top-2/3 right-1/4 text-sm font-extrabold text-red-500 transform -rotate-45">
            HALRO SCHOOL - CODE UTILISATEUR: {userCode} - REPRODUCTION STRICTEMENT SANCTIONNÉE
          </div>
        </div>

        {/* Security Alert Warnings */}
        {showPrintWarning && (
          <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center text-center p-6 z-50 animate-fade-in">
            <ShieldAlert size={48} className="text-red-500 mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-red-400">ACTIVITÉ SUSPECTE DÉTECTÉE</h3>
            <p className="text-sm text-slate-300 mt-2 max-w-md">
              La tentative d'impression ou d'enregistrement de ce document a été bloquée. 
              Votre code apprenant <strong className="text-red-400">{userCode}</strong> est sous surveillance. 
              Une récurrence entraînera une désactivation immédiate.
            </p>
          </div>
        )}

        {/* Course content (page based) */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="prose prose-invert prose-sm max-w-none text-slate-200">
            {course.content[currentPage] ? (
              <div className="whitespace-pre-wrap leading-relaxed font-sans text-[15px] select-none">
                {course.content[currentPage]}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                <EyeOff size={32} className="mb-2 text-slate-600" />
                <p>Aucun contenu disponible pour cette page.</p>
              </div>
            )}
          </div>
        </div>

        {/* Security footer bar within view */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800 flex flex-col space-y-2 text-center select-none text-[10px] text-slate-500">
          <div className="flex items-center justify-center space-x-1.5 text-amber-500/80">
            <AlertTriangle size={10} />
            <span>Sécurité active : Les captures d'écran et téléchargements sont bloqués et tracés.</span>
          </div>
          <div>
            Licencié à : <span className="text-emerald-400 font-semibold">{userMatricule}</span> (Code: <span className="text-emerald-400">{userCode}</span>) • Document non téléchargeable
          </div>
        </div>
      </div>

      {/* Pagination control footer */}
      <div id="course-viewer-pagination" className="flex items-center justify-between p-4 bg-slate-950 border-t border-slate-800 z-10 relative">
        <button
          id="btn-viewer-prev"
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 rounded-lg text-xs transition font-medium"
        >
          <ChevronLeft size={16} />
          <span>Précédent</span>
        </button>

        <span className="text-xs text-slate-400 font-medium">
          Page <strong className="text-slate-200 font-bold">{currentPage + 1}</strong> sur <strong className="text-slate-200 font-bold">{course.content.length}</strong>
        </span>

        <button
          id="btn-viewer-next"
          onClick={() => setCurrentPage(prev => Math.min(course.content.length - 1, prev + 1))}
          disabled={currentPage === course.content.length - 1}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 rounded-lg text-xs transition font-medium"
        >
          <span>Suivant</span>
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
