/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, Download, Lock, ShieldAlert, 
  AlertTriangle, EyeOff, FileText, ZoomIn, ZoomOut, Sun, Moon, 
  Layers, Settings, Search, Check, Sliders, Eye
} from "lucide-react";
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
  
  // Custom interactive PDF Viewer States
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 100, 115, 125, 150
  const [isNightMode, setIsNightMode] = useState<boolean>(true); // default to dark matching the app's aesthetic
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showWatermarkSettings, setShowWatermarkSettings] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Customizable Watermark options as requested ("option watermark intégré")
  const [watermarkStyle, setWatermarkStyle] = useState<"diagonal" | "grid" | "split">("diagonal");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(10); // percentage: 5%, 10%, 15%, 20%
  const [watermarkColor, setWatermarkColor] = useState<"red" | "indigo" | "gray" | "emerald">("red");
  const [watermarkCustomText, setWatermarkCustomText] = useState<string>("");

  // Disable copy-paste, print screen events, and right click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("HALRO SECURE PDF : Le clic droit, l'inspection et la copie de contenu sont cryptés pour protéger les droits d'auteur.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen or Ctrl+P
      if (e.key === "PrintScreen") {
        e.preventDefault();
        alert("Capture d'écran détectée ! Filigrane dynamique gravé de manière permanente.");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowPrintWarning(true);
        setTimeout(() => setShowPrintWarning(false), 6000);
      }
      // Prevent copy keys
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "u" || e.key === "s")) {
        e.preventDefault();
        alert("Action non autorisée. La protection intellectuelle de HALRO est active.");
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

  // Watermark text formulation
  const dynamicWatermarkText = watermarkCustomText.trim() 
    ? `${watermarkCustomText.toUpperCase()} • ${userMatricule} • CODE: ${userCode}`
    : `PROPRIÉTÉ DE ${userMatricule} • ÉLÈVE INSCRIT • CODE: ${userCode} • IP TRACÉ • COPIE STRICTEMENT INTERDITE`;

  // Watermark colors Tailwind mappings
  const getColorClasses = () => {
    switch (watermarkColor) {
      case "indigo": return "text-indigo-500 border-indigo-500/20";
      case "emerald": return "text-emerald-500 border-emerald-500/20";
      case "gray": return "text-slate-400 border-slate-500/20";
      default: return "text-red-500 border-red-500/20";
    }
  };

  const getOpacityStyle = () => {
    return { opacity: watermarkOpacity / 100 };
  };

  // Helper to highlight searched query in the text
  const renderHighlightedContent = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 text-black px-0.5 rounded font-bold animate-pulse">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div id="course-viewer-container" className="relative select-none bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-5xl mx-auto my-4 w-full text-slate-200 flex flex-col h-[750px]">
      
      {/* 1. TOP MAIN MENU BAR */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 gap-3 z-10">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition ${
              showSidebar ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400" : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
            }`}
            title="Activer/Désactiver le volet de miniatures"
          >
            <Layers size={15} />
          </button>
          
          <div className="h-4 w-[1px] bg-slate-800"></div>

          <div className="flex items-center space-x-1">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <FileText size={16} />
            </div>
            <div>
              <h4 className="font-bold text-xs line-clamp-1 text-slate-100 max-w-[200px] md:max-w-xs">{course.title}</h4>
              <p className="text-[10px] text-slate-400">Par {course.authorName}</p>
            </div>
          </div>
        </div>

        {/* Zoom, Search & Reading options */}
        <div className="flex items-center space-x-3">
          
          {/* Day/Night Reading mode */}
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
            title={isNightMode ? "Passer en Mode Jour (A4 Clair)" : "Passer en Mode Nuit (Lecture Sombre)"}
          >
            {isNightMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 border border-slate-850 rounded-lg px-1 py-0.5">
            <button
              onClick={() => setZoomLevel(prev => Math.max(75, prev - 15))}
              disabled={zoomLevel <= 75}
              className="p-1 hover:bg-slate-850 text-slate-400 disabled:opacity-30 rounded transition"
              title="Zoom Arrière"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-mono px-2 text-slate-300 font-bold w-12 text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
              disabled={zoomLevel >= 150}
              className="p-1 hover:bg-slate-850 text-slate-400 disabled:opacity-30 rounded transition"
              title="Zoom Avant"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>

          {/* Search bar inside PDF content */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-32 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-700 focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-2 top-1.5 text-[9px] text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Watermark settings options drawer button */}
          <button
            onClick={() => setShowWatermarkSettings(!showWatermarkSettings)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
              showWatermarkSettings ? "bg-amber-600/20 border-amber-500/40 text-amber-400" : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
            }`}
            title="Options de Filigrane Sécurisé"
          >
            <Sliders size={12} />
            <span className="hidden md:inline">Options Filigrane</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800"></div>

          {/* Secure / Download Badges */}
          {isSuperAdmin ? (
            <button
              id="btn-admin-download-pdf"
              onClick={downloadPDFForAdmin}
              className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition duration-200 shadow-md"
              title="Télécharger l'original en format PDF (Réservé Admin)"
            >
              <Download size={13} />
              <span>Télécharger</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 text-red-400 bg-red-950/20 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase border border-red-500/10">
              <Lock size={11} className="animate-pulse" />
              <span>Crypté • Anti-Fuite</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. BODY LAYOUT: SIDEBAR THUMBNAILS + MAIN VIEWER */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR: Thumbnails (Miniatures de pages) */}
        {showSidebar && (
          <div className="w-56 bg-slate-950 border-r border-slate-900 overflow-y-auto p-4 flex flex-col space-y-4 shrink-0 transition-all duration-300">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Pages du document</h5>
            
            {course.content.map((pageText, idx) => {
              const isActive = currentPage === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`group relative border rounded-xl p-3 cursor-pointer text-left transition ${
                    isActive 
                      ? "bg-slate-900 border-indigo-500/50 ring-1 ring-indigo-500/30" 
                      : "bg-slate-950 border-slate-900 hover:border-slate-800 hover:bg-slate-900/30"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                    <span>Page {idx + 1}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                  </div>
                  
                  {/* Miniature text structure */}
                  <div className="space-y-1 opacity-40 group-hover:opacity-60 transition pointer-events-none">
                    <div className="h-1.5 bg-slate-700 rounded w-full"></div>
                    <div className="h-1.5 bg-slate-700 rounded w-5/6"></div>
                    <div className="h-1.5 bg-slate-700 rounded w-4/6"></div>
                  </div>

                  {/* Little floating diagonal watermark replica */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-5 pointer-events-none text-[8px] text-red-500 font-bold uppercase tracking-widest -rotate-12">
                    {userMatricule}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WATERMARK OPTIONS PANEL DRAWER (Option watermark intégré) */}
        {showWatermarkSettings && (
          <div className="absolute top-0 right-0 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl h-full z-20 p-5 overflow-y-auto animate-fade-in flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="flex items-center space-x-2">
                  <Settings size={15} className="text-amber-400 animate-spin-slow" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Option Filigrane Intégré</h4>
                </div>
                <button
                  onClick={() => setShowWatermarkSettings(false)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Configurez le filigrane dynamique incrusté sur le support de cours. Ces filigranes identifient votre compte pour des raisons de droits d'auteur.
              </p>

              {/* 1. Style selections */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Style de disposition
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => setWatermarkStyle("diagonal")}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border text-left transition ${
                      watermarkStyle === "diagonal"
                        ? "bg-amber-600/10 border-amber-500/30 text-amber-300"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <span>Double Filigrane Diagonal</span>
                    {watermarkStyle === "diagonal" && <Check size={12} />}
                  </button>

                  <button
                    onClick={() => setWatermarkStyle("grid")}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border text-left transition ${
                      watermarkStyle === "grid"
                        ? "bg-amber-600/10 border-amber-500/30 text-amber-300"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <span>Grille Dense en Arrière-plan</span>
                    {watermarkStyle === "grid" && <Check size={12} />}
                  </button>

                  <button
                    onClick={() => setWatermarkStyle("split")}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border text-left transition ${
                      watermarkStyle === "split"
                        ? "bg-amber-600/10 border-amber-500/30 text-amber-300"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <span>Discret (Entêtes & Pied)</span>
                    {watermarkStyle === "split" && <Check size={12} />}
                  </button>
                </div>
              </div>

              {/* 2. Opacity controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Opacité / Visibilité
                  </label>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">{watermarkOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="5"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>Très Discret (5%)</span>
                  <span>Sécurité Maximale (25%)</span>
                </div>
              </div>

              {/* 3. Watermark color scheme */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Couleur d'Incrustation
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["red", "indigo", "emerald", "gray"] as const).map((color) => {
                    const mapLabels = { red: "Rouge", indigo: "Indigo", emerald: "Vert", gray: "Gris" };
                    const mapColorBg = { red: "bg-red-500", indigo: "bg-indigo-500", emerald: "bg-emerald-500", gray: "bg-slate-400" };
                    const isSelected = watermarkColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setWatermarkColor(color)}
                        className={`flex flex-col items-center p-1.5 rounded-lg border text-[10px] transition capitalize ${
                          isSelected 
                            ? "bg-slate-950 border-amber-500 text-amber-300" 
                            : "bg-slate-950 border-slate-850 text-slate-500"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${mapColorBg[color]} mb-1`}></span>
                        <span>{mapLabels[color]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Custom watermark overlay addition */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Texte Supplémentaire (Facultatif)
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={watermarkCustomText}
                  onChange={(e) => setWatermarkCustomText(e.target.value)}
                  placeholder="Ex: CONFIDENTIEL"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

            </div>

            <div className="border-t border-slate-850 pt-3 mt-6 text-[9px] text-slate-500 flex items-center space-x-1.5">
              <ShieldAlert size={12} className="text-red-400 shrink-0" />
              <span>Votre code unique de traçabilité ne peut pas être retiré pour des raisons légales de protection intellectuelle.</span>
            </div>
          </div>
        )}

        {/* 3. CENTER VIEWPORT: THE DYNAMIC SECURE PDF DOCUMENT CANVAS */}
        <div className="flex-1 bg-slate-950 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
          
          <div 
            id="pdf-page-canvas" 
            className={`relative select-none border rounded-lg shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden shrink-0 ${
              isNightMode 
                ? "bg-slate-900/90 border-slate-800 text-slate-100" 
                : "bg-white border-slate-300 text-slate-800"
            }`}
            style={{ 
              width: `${595 * (zoomLevel / 100)}px`, 
              minHeight: `${780 * (zoomLevel / 100)}px`,
              transition: "width 0.2s ease-out, min-height 0.2s ease-out",
              WebkitUserSelect: "none", 
              userSelect: "none" 
            }}
          >
            {/* DYNAMIC WATERMARK OVERLAYS */}
            
            {/* Style A: DIAGONAL HEAVY WATERMARKS */}
            {watermarkStyle === "diagonal" && (
              <div 
                className="absolute inset-0 pointer-events-none z-0 flex flex-col justify-between p-12 select-none"
                style={getOpacityStyle()}
              >
                <div className={`text-center font-black tracking-widest uppercase text-xs md:text-sm -rotate-25 transform whitespace-normal break-words py-8 ${getColorClasses()}`}>
                  {dynamicWatermarkText}
                </div>
                <div className={`text-center font-black tracking-widest uppercase text-xs md:text-sm rotate-25 transform whitespace-normal break-words py-8 ${getColorClasses()}`}>
                  {dynamicWatermarkText}
                </div>
                <div className={`text-center font-black tracking-widest uppercase text-xs md:text-sm -rotate-25 transform whitespace-normal break-words py-8 ${getColorClasses()}`}>
                  {dynamicWatermarkText}
                </div>
              </div>
            )}

            {/* Style B: GRID DENSE PATTERNS */}
            {watermarkStyle === "grid" && (
              <div 
                className="absolute inset-0 pointer-events-none z-0 grid grid-cols-2 grid-rows-4 p-4 gap-4 transform -rotate-12 scale-110 select-none overflow-hidden"
                style={getOpacityStyle()}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-center text-[10px] font-extrabold tracking-widest text-center uppercase whitespace-normal break-words leading-tight border border-current border-opacity-5 p-2 ${getColorClasses()}`}
                  >
                    HALRO MOBILESCHOOL<br />
                    {userMatricule}<br />
                    CODE: {userCode}
                  </div>
                ))}
              </div>
            )}

            {/* Style C: DISCRET HEADERS & FOOTERS */}
            {watermarkStyle === "split" && (
              <div 
                className="absolute inset-x-0 inset-y-8 pointer-events-none z-0 flex flex-col justify-between px-6 select-none"
                style={getOpacityStyle()}
              >
                <div className={`border-b text-[9px] font-bold uppercase tracking-widest pb-1 flex justify-between ${getColorClasses()}`}>
                  <span>SECURE DIGITAL READER</span>
                  <span>LICENCIÉ À : {userMatricule}</span>
                </div>
                <div className={`text-center font-extrabold text-[15px] tracking-widest rotate-12 uppercase opacity-10 ${getColorClasses()}`}>
                  DIFFUSION INTERDITE
                </div>
                <div className={`border-t text-[9px] font-bold uppercase tracking-widest pt-1 flex justify-between ${getColorClasses()}`}>
                  <span>CODE D'ACCÈS : {userCode}</span>
                  <span>IP DE CONNEXION TRACÉ</span>
                </div>
              </div>
            )}

            {/* SECURITY VIOLATION OVERLAY (Ctrl+P blocking) */}
            {showPrintWarning && (
              <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center text-center p-6 z-50 animate-fade-in">
                <ShieldAlert size={48} className="text-red-500 mb-3 animate-bounce" />
                <h3 className="text-lg font-bold text-red-400">TENTATIVE D'IMPRESSION BLOQUÉE</h3>
                <p className="text-xs text-slate-300 mt-2 max-w-sm">
                  L'impression ou l'exportation de ce document est interdite afin de prévenir le partage illicite. 
                  Votre matricule <strong className="text-red-400">{userMatricule}</strong> et votre code d'activation ont été tracés.
                </p>
              </div>
            )}

            {/* THE ACTUAL DOCUMENT CONTENT */}
            <div className="relative z-10 flex-1 flex flex-col p-8 md:p-12">
              
              {/* Document Header */}
              <div className="flex items-center justify-between border-b border-slate-500/20 pb-3 mb-6 text-[10px] font-mono tracking-wider opacity-60">
                <span>SUPPORT PEDAGOGIQUE NUMÉRIQUE</span>
                <span>ID: {course.id}</span>
              </div>

              {/* Title & Auteur Info on first page */}
              {currentPage === 0 && (
                <div className="mb-6 space-y-2">
                  <h1 className="text-lg md:text-xl font-extrabold tracking-tight">
                    {course.title}
                  </h1>
                  <div className="flex items-center space-x-2 text-xs opacity-75">
                    <span className="font-semibold text-indigo-400">Enseignant : {course.authorName}</span>
                    <span>•</span>
                    <span>Publié le {new Date(course.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <hr className="border-slate-500/10" />
                </div>
              )}

              {/* Printable-like Text Layout with line numbers on left */}
              <div className="flex-1 flex space-x-4">
                
                {/* Legal-style Line Numbers */}
                <div className="font-mono text-[10px] text-slate-500 select-none opacity-40 text-right pr-2 space-y-1 border-r border-slate-500/10 hidden sm:block">
                  {Array.from({ length: 18 }).map((_, index) => (
                    <div key={index}>{String(index + 1).padStart(2, "0")}</div>
                  ))}
                </div>

                {/* Render Text content with search highlighter */}
                <div className="flex-1">
                  <div className={`prose max-w-none text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans select-none ${
                    isNightMode ? "text-slate-200" : "text-slate-800"
                  }`}>
                    {course.content[currentPage] ? (
                      renderHighlightedContent(course.content[currentPage])
                    ) : (
                      <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                        <EyeOff size={32} className="mb-2 text-slate-600" />
                        <p>Cette page n'a pas de contenu rédigé.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Document Footer */}
              <div className="flex items-center justify-between border-t border-slate-500/15 pt-3 mt-6 text-[9px] font-mono opacity-50">
                <span>HALRO MOBILE SCHOOL</span>
                <span className="font-bold">Page {currentPage + 1} de {course.content.length}</span>
              </div>

            </div>

            {/* Static Trace Security warning footer inside Page */}
            <div className="relative z-10 bg-red-950/20 border-t border-red-900/10 p-2 text-center text-[8px] tracking-wider text-red-400 font-mono">
              FILIGRANE EXCLUSIF ET INDÉLÉBILE • LICENCIÉ À : {userMatricule} ({userCode}) • TOUTE REPRODUCTIONS SANCTIONNÉES
            </div>

          </div>

        </div>

      </div>

      {/* 4. BOTTOM PAGINATION FOOTER */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900 border-t border-slate-800 z-10">
        <button
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-200 rounded-lg text-xs transition font-semibold border border-slate-800"
        >
          <ChevronLeft size={14} />
          <span>Précédent</span>
        </button>

        <span className="text-xs text-slate-400 font-bold">
          Page <strong className="text-indigo-400 font-extrabold">{currentPage + 1}</strong> sur <strong className="text-slate-300 font-bold">{course.content.length}</strong>
        </span>

        <button
          onClick={() => setCurrentPage(prev => Math.min(course.content.length - 1, prev + 1))}
          disabled={currentPage === course.content.length - 1}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-200 rounded-lg text-xs transition font-semibold border border-slate-800"
        >
          <span>Suivant</span>
          <ChevronRight size={14} />
        </button>
      </div>

    </div>
  );
}
