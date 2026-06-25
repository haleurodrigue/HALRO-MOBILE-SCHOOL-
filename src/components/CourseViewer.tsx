/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, Download, Lock, ShieldAlert, 
  AlertTriangle, EyeOff, FileText, ZoomIn, ZoomOut, Sun, Moon, 
  Layers, Settings, Search, Check, Sliders, Eye, X, ArrowUp,
  BookOpen, Palette, Type, Baseline
} from "lucide-react";
import { Course } from "../types";
import { jsPDF } from "jspdf";

interface CourseViewerProps {
  course: Course;
  userMatricule: string;
  userCode: string;
  isSuperAdmin: boolean;
  studentName?: string;
  onClose: () => void;
}

export default function CourseViewer({ 
  course, 
  userMatricule, 
  userCode, 
  isSuperAdmin,
  studentName,
  onClose 
}: CourseViewerProps) {
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeTocId, setActiveTocId] = useState<string>("");
  
  // Custom interactive PDF Viewer States
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 0, 75, 100, 115, 125, 150
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  // Click-and-drag panning states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragScroll, setDragScroll] = useState({ left: 0, top: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left-click
    
    // Don't drag if clicking buttons, inputs, links, or select options
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('select')) {
      return;
    }

    const container = e.currentTarget;
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    setDragScroll({
      left: container.scrollLeft,
      top: container.scrollTop
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const container = e.currentTarget;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    container.scrollLeft = dragScroll.left - dx;
    container.scrollTop = dragScroll.top - dy;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };
  const [showWatermarkSettings, setShowWatermarkSettings] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Customizable Watermark options for students
  const [watermarkStyle, setWatermarkStyle] = useState<"diagonal" | "grid" | "split">("diagonal");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(8); // percentage: 4%, 8%, 12%, 16%, 20%
  const [watermarkColor, setWatermarkColor] = useState<"red" | "indigo" | "gray" | "emerald">("red");
  const [watermarkCustomText, setWatermarkCustomText] = useState<string>("");

  // WPS Reflow & Intelligent Reader Options (WPS Mode is enabled by default)
  const [wpsMode, setWpsMode] = useState<boolean>(true);
  const [readingTheme, setReadingTheme] = useState<"classic" | "creme" | "mint" | "night">("creme");
  const [fontSize, setFontSize] = useState<number>(15);
  const [lineHeightStyle, setLineHeightStyle] = useState<"tight" | "normal" | "loose">("normal");
  const [showWpsSettings, setShowWpsSettings] = useState<boolean>(false);

  // Disable copy-paste, print screen events, and right click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("HALRO SECURE PDF : Le clic droit, l'inspection et la copie de contenu sont désactivés pour protéger les droits d'auteur.");
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

  // Watermark text formulation for students
  const studentInfo = studentName 
    ? `${studentName.toUpperCase()} • ${userMatricule}` 
    : userMatricule;

  const dynamicWatermarkText = watermarkCustomText.trim() 
    ? `${watermarkCustomText.toUpperCase()} • ${studentInfo} • HALRO MOBILE SCHOOL`
    : `HALRO MOBILE SCHOOL • ÉLÈVE: ${studentInfo} • DUPLICATION INTERDITE`;

  // Watermark colors mappings
  const getColorHex = () => {
    switch (watermarkColor) {
      case "indigo": return "%23818cf8"; // indigo-400
      case "emerald": return "%2310b981"; // emerald-500
      case "gray": return "%2364748b"; // slate-500
      default: return "%23ef4444"; // red-500
    }
  };

  const getSvgWatermarkDataUri = () => {
    if (isSuperAdmin) return ""; // No watermark for admin!

    const escapedText = encodeURIComponent(dynamicWatermarkText);
    const color = getColorHex();
    const opacity = watermarkOpacity / 100;

    if (watermarkStyle === "diagonal") {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><text x="30" y="180" font-family="'Inter', sans-serif" font-size="10" font-weight="bold" fill="${color}" fill-opacity="${opacity}" transform="rotate(-28, 30, 180)">${escapedText}</text></svg>`;
    } else if (watermarkStyle === "grid") {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><text x="10" y="60" font-family="'Inter', sans-serif" font-size="8" font-weight="extrabold" fill="${color}" fill-opacity="${opacity}" transform="rotate(-15, 10, 60)">HALRO MOBILE SCHOOL</text><text x="10" y="80" font-family="'Inter', sans-serif" font-size="8" font-weight="bold" fill="${color}" fill-opacity="${opacity}" transform="rotate(-15, 10, 80)">${studentInfo}</text></svg>`;
    } else {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400"><text x="20" y="30" font-family="monospace" font-size="8" fill="${color}" fill-opacity="${opacity}">HALRO MOBILE SCHOOL • ÉLÈVE : ${studentInfo}</text><text x="20" y="380" font-family="monospace" font-size="8" fill="${color}" fill-opacity="${opacity}">COPIE INTERDITE • TRACÉ DE SÉCURITÉ</text></svg>`;
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
            <mark key={i} className="bg-amber-200 text-slate-900 px-0.5 rounded font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // WPS Premium reader presets & styling
  const THEMES = {
    classic: {
      id: "classic" as const,
      name: "Blanc Classique",
      wrapperBg: "bg-slate-100",
      sheetBg: "bg-white",
      text: "text-slate-800",
      headerText: "text-slate-900 border-slate-200",
      muted: "text-slate-400 border-slate-200",
      metaBg: "bg-slate-50 text-slate-500",
      border: "border-slate-100",
      badge: "bg-indigo-50 text-indigo-600 border-indigo-100",
      footerBg: "bg-slate-50 border-t border-slate-200 text-slate-500"
    },
    creme: {
      id: "creme" as const,
      name: "Mode Crème (Papier)",
      wrapperBg: "bg-[#e5ddd2]/95",
      sheetBg: "bg-[#fcfaf2]",
      text: "text-[#3e3224]",
      headerText: "text-[#281c0e] font-serif border-[#ebdcb9]",
      muted: "text-[#80705d] border-[#ebdcb9]",
      metaBg: "bg-[#f5ebd6] text-[#705c47]",
      border: "border-[#f1e6cc]",
      badge: "bg-[#f5ebd6] text-[#6d4d26] border-[#dfcca0]",
      footerBg: "bg-[#f5ebd6] border-t border-[#ebdcb9] text-[#705c47]"
    },
    mint: {
      id: "mint" as const,
      name: "Vert Protection Yeux",
      wrapperBg: "bg-[#cbd9cd]/90",
      sheetBg: "bg-[#f0f6f1]",
      text: "text-[#1d2d1f]",
      headerText: "text-[#0d1a0f] border-[#cbd9cd]",
      muted: "text-[#5b735e] border-[#cbd9cd]",
      metaBg: "bg-[#e2ebe2] text-[#3b543e]",
      border: "border-[#e5ede5]",
      badge: "bg-[#e2ebe2] text-[#22572b] border-[#cbd6cc]",
      footerBg: "bg-[#e2ebe2] border-t border-[#cbd9cd] text-[#3b543e]"
    },
    night: {
      id: "night" as const,
      name: "Nuit Sombre",
      wrapperBg: "bg-[#121314]",
      sheetBg: "bg-[#1e2022]",
      text: "text-[#d0d4d8]",
      headerText: "text-white border-[#2d3033]",
      muted: "text-[#7a8187] border-[#2d3033]",
      metaBg: "bg-[#25282c] text-[#a0a8b0]",
      border: "border-[#25282c]",
      badge: "bg-[#2d2218]/40 text-amber-500 border-[#ffb266]/10",
      footerBg: "bg-[#181a1b] border-t border-[#2d3033] text-[#7a8187]"
    }
  };

  const activeTheme = THEMES[readingTheme] || THEMES.creme;

  const getLineHeightVal = () => {
    if (lineHeightStyle === "tight") return "1.4";
    if (lineHeightStyle === "loose") return "1.9";
    return "1.65"; // normal
  };

  const getProcessedParagraphs = () => {
    if (!wpsMode) {
      return course.content.split("\n");
    }

    const lines = course.content.split("\n");
    const result: string[] = [];
    let currentParagraph = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      const isHeading = trimmed.startsWith("#");
      const isBullet = trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•") || /^\d+[\.\s]/.test(trimmed);
      const isPageMarker = trimmed.startsWith("---") || (trimmed.startsWith("#") && trimmed.includes("PAGE"));
      const isEmpty = trimmed === "";

      if (isHeading || isBullet || isPageMarker || isEmpty) {
        if (currentParagraph) {
          result.push(currentParagraph.trim());
          currentParagraph = "";
        }
        if (!isEmpty) {
          result.push(line);
        }
      } else {
        if (currentParagraph) {
          const lastChar = currentParagraph.trim().slice(-1);
          const isSentenceEnded = /[.!?:]/.test(lastChar);
          
          if (isSentenceEnded) {
            result.push(currentParagraph.trim());
            currentParagraph = line;
          } else {
            currentParagraph += " " + trimmed;
          }
        } else {
          currentParagraph = line;
        }
      }
    }

    if (currentParagraph) {
      result.push(currentParagraph.trim());
    }

    return result;
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
        const totalParagraphs = paragraphs.length;
        if (totalParagraphs > 0) {
          const targetIndex = Math.min(lineIndex, totalParagraphs - 1);
          paragraphs[targetIndex].scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-white select-none text-slate-800 animate-fade-in">
      
      {/* Top Reading Progress Bar (Ribbon level) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 z-[1001]">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* 1. TOP MAIN CONTROL RIBBON */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-slate-200 gap-4 z-[1002] shadow-sm pt-5">
        
        {/* Left Side: Back/Exit & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition duration-200 border border-slate-200"
            title="Quitter le lecteur plein écran"
          >
            <X size={14} />
            <span>Fermer</span>
          </button>
          
          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-lg border transition duration-200 ${
              showSidebar ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            title="Table des matières"
          >
            <Layers size={15} />
          </button>
          
          <div className="flex flex-col">
            <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 max-w-[220px] md:max-w-md">
              {course.title}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">
              Enseignant : {course.authorName} • {course.id}
            </p>
          </div>
        </div>

        {/* Right Side: Zoom, Search, Watermark and Download Options */}
        <div className="flex items-center space-x-3">
          
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0, prev - 10))}
              disabled={zoomLevel <= 0}
              className="p-1 hover:bg-slate-200 text-slate-500 disabled:opacity-30 rounded transition"
              title="Zoom Arrière"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-700 font-bold w-12 text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              disabled={zoomLevel >= 150}
              className="p-1 hover:bg-slate-200 text-slate-500 disabled:opacity-30 rounded transition"
              title="Zoom Avant"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
              <Search size={12} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-44 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg pl-8 pr-6 py-1.5 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* WPS Visualizer Settings Button */}
          <button
            onClick={() => {
              setShowWpsSettings(!showWpsSettings);
              setShowWatermarkSettings(false); // close watermark if open
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold transition duration-200 ${
              showWpsSettings 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Options de visionneuse (Style WPS)"
          >
            <BookOpen size={13} className={wpsMode ? "text-indigo-600 animate-pulse" : ""} />
            <span>Options WPS</span>
            {wpsMode && (
              <span className="bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded-full text-[8px] uppercase scale-90">
                WPS
              </span>
            )}
          </button>

          {/* Watermark customization button for student */}
          {!isSuperAdmin && (
            <button
              onClick={() => setShowWatermarkSettings(!showWatermarkSettings)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg border text-[11px] font-bold transition duration-200 ${
                showWatermarkSettings 
                  ? "bg-amber-50 border-amber-200 text-amber-700" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title="Paramètres de filigrane"
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">Options Filigrane</span>
            </button>
          )}

          {/* Download button for administrators */}
          {isSuperAdmin ? (
            <button
              onClick={downloadPDFForAdmin}
              className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition duration-200 shadow-sm"
              title="Télécharger l'original au format PDF"
            >
              <Download size={13} />
              <span>Télécharger PDF</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
              <Lock size={12} className="animate-pulse mr-0.5" />
              <span>SÉCURISÉ</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN SPLIT BODY */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Drawer: Table of Contents */}
        {showSidebar && (
          <div className="w-64 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 flex flex-col space-y-3 shrink-0 transition-all duration-300">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">Table des matières</h5>
            
            <div className="space-y-1">
              {toc.map((item) => {
                const isActive = activeTocId === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={() => scrollToLine(item.lineIndex, item.id)}
                    className={`w-full text-left rounded-lg p-2.5 text-xs transition border flex items-start gap-2 ${
                      isActive 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold" 
                        : "bg-transparent border-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                    }`}
                    style={{ paddingLeft: `${Math.max(10, item.level * 8)}px` }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isActive ? "bg-indigo-600 animate-pulse" : "bg-slate-400"}`}></span>
                    <span className="line-clamp-2 leading-relaxed">{item.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Reading stats in side drawer */}
            <div className="border-t border-slate-200 pt-4 mt-auto">
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>Progression</span>
                  <span>{readingProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${readingProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WPS Visualizer Settings Drawer */}
        {showWpsSettings && (
          <div className="absolute top-0 right-0 w-80 bg-white border-l border-slate-200 shadow-2xl h-full z-[1003] p-5 overflow-y-auto animate-fade-in flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <BookOpen size={16} className="text-indigo-600" />
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Options Visionneuse WPS</h4>
                </div>
                <button
                  onClick={() => setShowWpsSettings(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Section 1: Intelligent Reflow Mode */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Mode Relecture Reflow
                </label>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                  Reconstruit les phrases découpées et supprime les grands interlignes artificiels générés par l'import PDF.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWpsMode(true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition text-center ${
                      wpsMode 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Activer WPS
                  </button>
                  <button
                    onClick={() => setWpsMode(false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition text-center ${
                      !wpsMode 
                        ? "bg-slate-100 border-slate-300 text-slate-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Texte Brut
                  </button>
                </div>
              </div>

              {/* Section 2: Paper Theme */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Thème du papier (Couleur)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(THEMES).map((theme) => {
                    const isSelected = readingTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setReadingTheme(theme.id)}
                        className={`p-2.5 rounded-lg border text-left flex flex-col justify-between h-16 transition ${
                          isSelected 
                            ? "border-indigo-600 ring-2 ring-indigo-600/10" 
                            : "border-slate-200 hover:border-slate-300"
                        } ${theme.sheetBg}`}
                      >
                        <span className={`text-[10px] font-black tracking-tight ${theme.text}`}>
                          {theme.name}
                        </span>
                        <div className="flex gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 opacity-20"></span>
                          <span className="w-4 h-1.5 rounded-full bg-indigo-500/30"></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Taille du texte
                  </label>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold">{fontSize}px</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <button
                    onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
                    disabled={fontSize <= 12}
                    className="flex-1 py-1 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded border border-slate-200 disabled:opacity-30 transition"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize(15)}
                    className="px-3 py-1 text-[10px] text-slate-400 font-semibold hover:text-slate-600"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
                    disabled={fontSize >= 24}
                    className="flex-1 py-1 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded border border-slate-200 disabled:opacity-30 transition"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Section 4: Line Height / Spacing */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Espacement des lignes
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-lg border border-slate-150">
                  {(["tight", "normal", "loose"] as const).map((spacing) => {
                    const label = spacing === "tight" ? "Serré" : spacing === "loose" ? "Aéré" : "Normal";
                    const isSelected = lineHeightStyle === spacing;
                    return (
                      <button
                        key={spacing}
                        onClick={() => setLineHeightStyle(spacing)}
                        className={`py-1.5 text-[10px] font-bold rounded-md transition text-center ${
                          isSelected 
                            ? "bg-white text-indigo-700 shadow-sm" 
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="border-t border-slate-100 pt-4 text-[9px] text-slate-400 flex items-center space-x-2 mt-6">
              <Check size={12} className="text-emerald-500 shrink-0" />
              <span>Réglages mémorisés pour votre session actuelle de lecture de cours.</span>
            </div>
          </div>
        )}

        {/* 3. CENTER DOCUMENT CANVAS (WHITE BACKGROUND) */}
        <div 
          id="pdf-document-scroll-canvas"
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex-1 overflow-auto p-4 md:p-8 flex items-start h-full select-none transition-all duration-300 ${activeTheme.wrapperBg} ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {zoomLevel === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-lg max-w-sm mx-auto my-auto animate-fade-in select-none">
              <EyeOff size={32} className="text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-600">Document masqué (Zoom à 0%)</p>
              <p className="text-[10px] text-slate-400 mt-1">Cliquez sur le bouton de zoom avant (+) pour afficher le document.</p>
            </div>
          ) : (
            <div className="min-w-full flex justify-center items-start shrink-0 py-2">
              <div 
                id="pdf-page-canvas" 
                className={`relative select-none border rounded-xl shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden shrink-0 ${activeTheme.sheetBg} ${activeTheme.text} ${activeTheme.border}`}
                style={{ 
                  width: `${680 * (zoomLevel / 100)}px`, 
                  minHeight: "100%",
                  WebkitUserSelect: "none", 
                  userSelect: "none" 
                }}
              >
              {/* CONTINUOUS SVG WATERMARK OVERLAY (Only if student) */}
              {!isSuperAdmin && (
                <div 
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{ 
                    backgroundImage: `url('${getSvgWatermarkDataUri()}')`,
                    backgroundRepeat: 'repeat',
                  }}
                />
              )}

              {/* SECURITY VIOLATION OVERLAY (Ctrl+P blocking) */}
              {showPrintWarning && (
                <div className="fixed inset-0 bg-red-600/95 flex flex-col items-center justify-center text-center p-6 z-[1010] animate-fade-in text-white">
                  <ShieldAlert size={48} className="text-white mb-3 animate-bounce" />
                  <h3 className="text-xl font-black">TENTATIVE D'IMPRESSION BLOQUÉE</h3>
                  <p className="text-sm text-red-100 mt-2 max-w-sm">
                    L'impression ou l'exportation de ce document est interdite afin de prévenir le partage illicite. 
                    Votre matricule <strong className="text-white underline">{userMatricule}</strong> et votre code d'activation ont été tracés.
                  </p>
                </div>
              )}

              {/* THE ACTUAL DOCUMENT CONTENT */}
              <div className="relative z-10 flex-1 flex flex-col p-8 md:p-14">
                
                {/* Document Header */}
                <div className={`flex items-center justify-between border-b pb-3 mb-8 text-[10px] font-mono tracking-wider ${activeTheme.muted}`}>
                  <span>SUPPORT PÉDAGOGIQUE - HALRO MOBILE SCHOOL</span>
                  <span>ID: {course.id}</span>
                </div>

                {/* Title & Author Info block */}
                <div className="mb-8 space-y-3">
                  <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${activeTheme.badge}`}>
                    <FileText size={10} />
                    <span>Document / Ouvrage de Cours</span>
                  </div>
                  <h1 className={`text-2xl md:text-3xl font-black tracking-tight leading-tight ${activeTheme.headerText}`}>
                    {course.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-80">
                    <span className="font-semibold">Enseignant : {course.authorName}</span>
                    <span className="opacity-40">•</span>
                    <span>Publié le {new Date(course.createdAt).toLocaleDateString("fr-FR")}</span>
                    <span className="opacity-40">•</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${activeTheme.metaBg}`}>{course.content.length} caractères</span>
                  </div>
                  <hr className={activeTheme.border} />
                </div>

                {/* Printable-like Text Layout */}
                <div className="flex-1">
                  
                  {/* Render Text content paragraph by paragraph */}
                  <div className="space-y-4">
                    {getProcessedParagraphs().map((paragraph, idx) => {
                      const trimmed = paragraph.trim();
                      const isHeading = trimmed.startsWith("#");
                      const headingText = trimmed.replace(/^#+\s*/, "").trim();
                      const headingLevel = isHeading ? (trimmed.match(/^#+/) || ["#"])[0].length : 0;
                      const isBullet = trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•");

                      if (isHeading) {
                        if (headingLevel === 1) {
                          return (
                            <h2 
                              key={idx} 
                              className={`book-paragraph text-xl md:text-2xl font-black mt-8 mb-4 border-b pb-2 scroll-mt-24 ${activeTheme.headerText}`}
                            >
                              {renderHighlightedContent(headingText)}
                            </h2>
                          );
                        } else if (headingLevel === 2) {
                          return (
                            <h3 
                              key={idx} 
                              className={`book-paragraph text-lg md:text-xl font-bold mt-6 mb-3 scroll-mt-24 ${activeTheme.headerText}`}
                            >
                              {renderHighlightedContent(headingText)}
                            </h3>
                          );
                        } else {
                          return (
                            <h4 
                              key={idx} 
                              className={`book-paragraph text-base md:text-lg font-bold mt-4 mb-2 scroll-mt-24 ${activeTheme.headerText}`}
                            >
                              {renderHighlightedContent(headingText)}
                            </h4>
                          );
                        }
                      }

                      if (!trimmed) {
                        return <div key={idx} className="h-2"></div>;
                      }

                      if (isBullet) {
                        const cleanBulletText = trimmed.replace(/^[-*•]\s*/, "");
                        return (
                          <li 
                            key={idx} 
                            className="book-paragraph text-sm md:text-base ml-6 list-disc font-sans text-justify scroll-mt-24 pl-2 my-2"
                            style={{ 
                              fontSize: `${fontSize}px`, 
                              lineHeight: getLineHeightVal(),
                              color: activeTheme.id === "night" ? "#d0d4d8" : undefined
                            }}
                          >
                            {renderHighlightedContent(cleanBulletText)}
                          </li>
                        );
                      }

                      return (
                        <p 
                          key={idx} 
                          className="book-paragraph text-sm md:text-base font-sans text-justify scroll-mt-24"
                          style={{ 
                            fontSize: `${fontSize}px`, 
                            lineHeight: getLineHeightVal(),
                            marginBottom: "1.25rem",
                            textIndent: wpsMode ? "1.5rem" : "0",
                            color: activeTheme.id === "night" ? "#d0d4d8" : undefined
                          }}
                        >
                          {renderHighlightedContent(paragraph)}
                        </p>
                      );
                    })}
                  </div>

                </div>

                {/* Document Footer */}
                <div className={`flex items-center justify-between border-t pt-4 mt-12 text-[10px] font-mono ${activeTheme.muted}`}>
                  <span>HALRO MOBILE SCHOOL</span>
                  <span className="font-bold">Fin de l'ouvrage</span>
                </div>

              </div>

              {/* Static Trace Security warning footer inside Page */}
              {!isSuperAdmin ? (
                <div className={`relative z-10 p-2 text-center text-[9px] tracking-wider font-mono font-semibold ${
                  activeTheme.id === "night" 
                    ? "bg-red-950/20 border-t border-red-900/40 text-red-400" 
                    : "bg-red-50 border-t border-red-100 text-red-600"
                }`}>
                  SÉCURISÉ PAR FILIGRANE INDÉLÉBILE • LICENCIÉ À : {studentInfo} • TOUTE COPIE S'EXPOSE À DES SANCTIONS
                </div>
              ) : (
                <div className={`relative z-10 p-2 text-center text-[9px] tracking-wider font-mono font-semibold ${
                  activeTheme.id === "night"
                    ? "bg-[#181a1b] border-t border-[#2d3033] text-slate-500"
                    : "bg-slate-50 border-t border-slate-100 text-slate-500"
                }`}>
                  ESPACE DE LECTURE ADMINISTRATEUR • IMPRESSION AUTORISÉE
                </div>
              )}

            </div>
          </div>
          )}
        </div>

      </div>

      {/* 4. BOTTOM FOOTER RIBBON */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200 z-[1002]">
        <div className="text-xs text-slate-500 font-bold">
          Progression : <strong className="text-indigo-600 font-black">{readingProgress}%</strong> complété
        </div>

        <button
          onClick={() => {
            const canvas = document.getElementById("pdf-document-scroll-canvas");
            if (canvas) canvas.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition border border-slate-200"
        >
          <ArrowUp size={13} />
          <span>Haut de page</span>
        </button>
      </div>

    </div>
  );
}
