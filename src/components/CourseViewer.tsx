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
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeTocId, setActiveTocId] = useState<string>("");
  
  // Custom interactive PDF Viewer States
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 100, 115, 125, 150
  const [isNightMode, setIsNightMode] = useState<boolean>(true); // default to dark matching the app's aesthetic
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showWatermarkSettings, setShowWatermarkSettings] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Customizable Watermark options as requested ("option watermark intégré")
  const [watermarkStyle, setWatermarkStyle] = useState<"diagonal" | "grid" | "split">("diagonal");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(8); // percentage: 4%, 8%, 12%, 16%, 20%
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

  // Scroll and progress tracker
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const totalHeight = target.scrollHeight - target.clientHeight;
    if (totalHeight > 0) {
      const progress = Math.round((target.scrollTop / totalHeight) * 100);
      setReadingProgress(progress);
    }
  };

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
    
    // Content paragraphs
    let currentY = 75;
    const paragraphs = course.content.split("\n");
    paragraphs.forEach((paragraph) => {
      if (!paragraph.trim()) {
        currentY += 4;
        return;
      }
      
      const splitLines = doc.splitTextToSize(paragraph, 170);
      splitLines.forEach((line: string) => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(line, 20, currentY);
        currentY += 7;
      });
      currentY += 3;
    });
    
    doc.save(`${course.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
  };

  // Watermark text formulation
  const dynamicWatermarkText = watermarkCustomText.trim() 
    ? `${watermarkCustomText.toUpperCase()} • ${userMatricule} • CODE: ${userCode}`
    : `PROPRIÉTÉ DE ${userMatricule} • ÉLÈVE INSCRIT • CODE: ${userCode} • IP TRACÉ • COPIE STRICTEMENT INTERDITE`;

  // Watermark colors mappings
  const getColorHex = () => {
    switch (watermarkColor) {
      case "indigo": return "%23818cf8"; // indigo-400
      case "emerald": return "%2334d399"; // emerald-400
      case "gray": return "%2394a3b8"; // slate-400
      default: return "%23f87171"; // red-400
    }
  };

  const getSvgWatermarkDataUri = () => {
    const escapedText = encodeURIComponent(dynamicWatermarkText);
    const color = getColorHex();
    const opacity = watermarkOpacity / 100;

    if (watermarkStyle === "diagonal") {
      // Large diagonal repeating watermark
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><text x="30" y="180" font-family="'Inter', sans-serif" font-size="10" font-weight="bold" fill="${color}" fill-opacity="${opacity}" transform="rotate(-28, 30, 180)">${escapedText}</text></svg>`;
    } else if (watermarkStyle === "grid") {
      // Dense grid layout
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><text x="10" y="60" font-family="'Inter', sans-serif" font-size="8" font-weight="extrabold" fill="${color}" fill-opacity="${opacity}" transform="rotate(-15, 10, 60)">HALRO MOBILE SCHOOL</text><text x="10" y="80" font-family="'Inter', sans-serif" font-size="8" font-weight="bold" fill="${color}" fill-opacity="${opacity}" transform="rotate(-15, 10, 80)">${userMatricule}</text></svg>`;
    } else {
      // Subtle top/bottom line pattern
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400"><text x="20" y="30" font-family="monospace" font-size="8" fill="${color}" fill-opacity="${opacity}">SECURE DIGITAL BOOK READER • LICENCIE A : ${userMatricule}</text><text x="20" y="380" font-family="monospace" font-size="8" fill="${color}" fill-opacity="${opacity}">DIFFUSION INTERDITE • CODE : ${userCode} • IP TRACE</text></svg>`;
    }
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

  // Parse sections for Table of Contents
  const getTableOfContents = () => {
    const lines = course.content.split("\n");
    const sections: { id: string; title: string; lineIndex: number; level: number }[] = [];
    let sectionCount = 0;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) {
        const level = (trimmed.match(/^#+/) || ["#"])[0].length;
        sectionCount++;
        const title = trimmed.replace(/^#+\s*/, "");
        sections.push({
          id: `sec-${sectionCount}`,
          title: title || `Titre ${sectionCount}`,
          lineIndex: idx,
          level
        });
      } else if (/^(chapitre|partie|section|module|cours)\b/i.test(trimmed)) {
        sectionCount++;
        sections.push({
          id: `sec-${sectionCount}`,
          title: trimmed,
          lineIndex: idx,
          level: 1
        });
      }
    });

    if (sections.length === 0) {
      sections.push({ id: "sec-start", title: "Début du Document", lineIndex: 0, level: 1 });
    }
    return sections;
  };

  const toc = getTableOfContents();

  // Scroll directly to a specific line in the book
  const scrollToLine = (lineIndex: number, id: string) => {
    setActiveTocId(id);
    const canvas = document.getElementById("pdf-document-scroll-canvas");
    if (canvas) {
      const paragraphs = canvas.getElementsByClassName("book-paragraph");
      if (paragraphs && paragraphs[lineIndex]) {
        paragraphs[lineIndex].scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // Fallback scrolling based on percentage
        const totalParagraphs = paragraphs.length;
        if (totalParagraphs > 0) {
          const targetIndex = Math.min(lineIndex, totalParagraphs - 1);
          paragraphs[targetIndex].scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  return (
    <div id="course-viewer-container" className="relative select-none bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-5xl mx-auto my-4 w-full text-slate-200 flex flex-col h-[780px]">
      
      {/* Dynamic Book Reading Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 z-30">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* 1. TOP MAIN MENU BAR */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 gap-3 z-10 pt-4">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition ${
              showSidebar ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400" : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
            }`}
            title="Activer/Désactiver la Table des Matières"
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
              <p className="text-[10px] text-slate-400">Livre Numérique de {course.authorName}</p>
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
              placeholder="Rechercher dans l'ouvrage..."
              className="w-40 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-700 focus:outline-none"
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
              <span>Livre Sécurisé • Anti-copie</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. BODY LAYOUT: TABLE OF CONTENTS + CONTINUOUS SCROLL VIEWPORT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR: Table of Contents (Table des Matières dynamique) */}
        {showSidebar && (
          <div className="w-60 bg-slate-950 border-r border-slate-900 overflow-y-auto p-4 flex flex-col space-y-3 shrink-0 transition-all duration-300">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Table des matières</h5>
            
            <div className="space-y-1">
              {toc.map((item) => {
                const isActive = activeTocId === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={() => scrollToLine(item.lineIndex, item.id)}
                    className={`w-full text-left rounded-lg p-2.5 text-xs transition border flex items-start gap-2 ${
                      isActive 
                        ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-300 font-semibold" 
                        : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                    }`}
                    style={{ paddingLeft: `${Math.max(10, item.level * 8)}px` }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isActive ? "bg-indigo-400 animate-pulse" : "bg-slate-600"}`}></span>
                    <span className="line-clamp-2 leading-relaxed">{item.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-900 pt-4 mt-auto">
              <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-900">
                <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                  <span>Progression de lecture</span>
                  <span>{readingProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${readingProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WATERMARK OPTIONS PANEL DRAWER (Option watermark intégré) */}
        {showWatermarkSettings && (
          <div className="absolute top-0 right-0 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl h-full z-20 p-5 overflow-y-auto animate-fade-in flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="flex items-center space-x-2">
                  <Settings size={15} className="text-amber-400" />
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
                Configurez le filigrane dynamique incrusté de manière permanente en arrière-plan du livre numérique. Ces filigranes tracent la provenance du support de cours.
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
                    <span>Grille Dense de Traçage</span>
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
                    <span>Bandes Haut & Bas</span>
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
                  min="4"
                  max="20"
                  step="4"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>Discret (4%)</span>
                  <span>Sécurité (20%)</span>
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
                  Texte de Protection Supplémentaire
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={watermarkCustomText}
                  onChange={(e) => setWatermarkCustomText(e.target.value)}
                  placeholder="Ex: DIFFUSION PENALE"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

            </div>

            <div className="border-t border-slate-850 pt-3 mt-6 text-[9px] text-slate-500 flex items-center space-x-1.5">
              <ShieldAlert size={12} className="text-red-400 shrink-0" />
              <span>Matricule et clés d'accès indélébiles de manière permanente pour assurer les droits intellectuels.</span>
            </div>
          </div>
        )}

        {/* 3. CENTER VIEWPORT: THE DYNAMIC SECURE PDF DOCUMENT CANVAS (CONTINUOUS SCROLL) */}
        <div 
          id="pdf-document-scroll-canvas"
          onScroll={handleScroll}
          className="flex-1 bg-slate-950 overflow-y-auto p-4 md:p-8 flex justify-center items-start h-full"
        >
          <div 
            id="pdf-page-canvas" 
            className={`relative select-none border rounded-xl shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden shrink-0 ${
              isNightMode 
                ? "bg-slate-900/95 border-slate-800 text-slate-100" 
                : "bg-white border-slate-300 text-slate-800"
            }`}
            style={{ 
              width: `${640 * (zoomLevel / 100)}px`, 
              minHeight: "100%",
              WebkitUserSelect: "none", 
              userSelect: "none" 
            }}
          >
            {/* CONTINUOUS SVG GRID WATERMARK OVERLAY */}
            <div 
              className="absolute inset-0 pointer-events-none z-0"
              style={{ 
                backgroundImage: `url('${getSvgWatermarkDataUri()}')`,
                backgroundRepeat: 'repeat',
              }}
            />

            {/* SECURITY VIOLATION OVERLAY (Ctrl+P blocking) */}
            {showPrintWarning && (
              <div className="fixed inset-0 bg-red-950/95 flex flex-col items-center justify-center text-center p-6 z-50 animate-fade-in">
                <ShieldAlert size={48} className="text-red-500 mb-3 animate-bounce" />
                <h3 className="text-lg font-bold text-red-400">TENTATIVE D'IMPRESSION BLOQUÉE</h3>
                <p className="text-xs text-slate-300 mt-2 max-w-sm">
                  L'impression ou l'exportation de ce document est interdite afin de prévenir le partage illicite. 
                  Votre matricule <strong className="text-red-400">{userMatricule}</strong> et votre code d'activation ont été tracés.
                </p>
              </div>
            )}

            {/* THE ACTUAL DOCUMENT CONTENT */}
            <div className="relative z-10 flex-1 flex flex-col p-8 md:p-14">
              
              {/* Document Header */}
              <div className="flex items-center justify-between border-b border-slate-500/20 pb-3 mb-8 text-[10px] font-mono tracking-wider opacity-60">
                <span>SUPPORT PÉDAGOGIQUE NUMÉRIQUE - HALRO MOBILE SCHOOL</span>
                <span>DOC_ID: {course.id}</span>
              </div>

              {/* Title & Author Info block */}
              <div className="mb-8 space-y-3">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-500/10">
                  <FileText size={10} />
                  <span>Document / Ouvrage Complet</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                  {course.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-80">
                  <span className="font-semibold text-indigo-400">Auteur / Enseignant : {course.authorName}</span>
                  <span className="opacity-40">•</span>
                  <span>Publié le {new Date(course.createdAt).toLocaleDateString("fr-FR")}</span>
                  <span className="opacity-40">•</span>
                  <span className="text-emerald-400 font-mono text-[10px]">{course.content.length} caractères</span>
                </div>
                <hr className="border-slate-500/10" />
              </div>

              {/* Printable-like Text Layout with line numbers on left */}
              <div className="flex-1 flex space-x-2">
                
                {/* Render Text content paragraph by paragraph with scrolling anchors */}
                <div className="flex-1 space-y-6">
                  {course.content.split("\n").map((paragraph, idx) => {
                    const isHeading = paragraph.trim().startsWith("#");
                    const headingText = paragraph.replace(/^#+\s*/, "").trim();
                    const headingLevel = isHeading ? (paragraph.match(/^#+/) || ["#"])[0].length : 0;

                    if (isHeading) {
                      if (headingLevel === 1) {
                        return (
                          <h2 
                            key={idx} 
                            className="book-paragraph text-lg md:text-xl font-bold tracking-tight text-indigo-400 mt-8 mb-4 border-b border-slate-500/10 pb-2 scroll-mt-24"
                          >
                            {renderHighlightedContent(headingText)}
                          </h2>
                        );
                      } else if (headingLevel === 2) {
                        return (
                          <h3 
                            key={idx} 
                            className="book-paragraph text-base md:text-lg font-bold tracking-tight text-emerald-400 mt-6 mb-3 scroll-mt-24"
                          >
                            {renderHighlightedContent(headingText)}
                          </h3>
                        );
                      } else {
                        return (
                          <h4 
                            key={idx} 
                            className="book-paragraph text-sm md:text-base font-bold tracking-tight text-purple-400 mt-4 mb-2 scroll-mt-24"
                          >
                            {renderHighlightedContent(headingText)}
                          </h4>
                        );
                      }
                    }

                    if (!paragraph.trim()) {
                      return <div key={idx} className="h-2"></div>;
                    }

                    return (
                      <p 
                        key={idx} 
                        className={`book-paragraph text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans text-justify scroll-mt-24 ${
                          isNightMode ? "text-slate-200" : "text-slate-800"
                        }`}
                      >
                        {renderHighlightedContent(paragraph)}
                      </p>
                    );
                  })}
                </div>

              </div>

              {/* Document Footer */}
              <div className="flex items-center justify-between border-t border-slate-500/15 pt-4 mt-12 text-[9px] font-mono opacity-50">
                <span>HALRO MOBILE SCHOOL</span>
                <span className="font-bold">Fin de l'ouvrage</span>
              </div>

            </div>

            {/* Static Trace Security warning footer inside Page */}
            <div className="relative z-10 bg-red-950/20 border-t border-red-900/10 p-2 text-center text-[8px] tracking-wider text-red-400 font-mono">
              FILIGRANE EXCLUSIF ET INDÉLÉBILE • LICENCIÉ À : {userMatricule} ({userCode}) • TOUTE REPRODUCTION SANCTIONNÉE PAR LA LOI
            </div>

          </div>
        </div>

      </div>

      {/* 4. BOTTOM CONTINUOUS NAV FOOTER */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900 border-t border-slate-800 z-10">
        <div className="text-xs text-slate-400 font-medium">
          Lecture : <strong className="text-indigo-400 font-extrabold">{readingProgress}%</strong> complété
        </div>

        <button
          onClick={() => {
            const canvas = document.getElementById("pdf-document-scroll-canvas");
            if (canvas) canvas.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 rounded-lg text-xs transition font-semibold border border-slate-800"
        >
          <span>Remonter en haut</span>
        </button>
      </div>

    </div>
  );
}
