/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  BookOpen, Users, Key, Shield, Smartphone, Monitor, Info, 
  Wifi, WifiOff, RefreshCw, AlertTriangle, HelpCircle, HardDriveDownload, Lock, Wrench
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
import { saveCoursesToIndexedDB, loadCoursesFromIndexedDB } from "./lib/indexedDbHelper";
import { testFirestoreConnection } from "./lib/firebase";
import { 
  loadAllDataFromFirestore, 
  saveClassToFirestore, 
  deleteClassFromFirestore,
  saveCourseToFirestore, 
  saveTeacherToFirestore, 
  deleteTeacherFromFirestore,
  saveStudentCodeToFirestore, 
  deleteStudentCodeFromFirestore,
  savePayoutRequestToFirestore, 
  deletePayoutRequestFromFirestore,
  saveInvoiceToFirestore,
  deleteInvoiceFromFirestore,
  resetFirestore,
  loadSettingsFromFirestore,
  saveSettingsToFirestore,
  subscribeToGlobalSettings
} from "./lib/firebaseSync";

export default function App() {
  // Application Roles Tabs: 'student' | 'teacher' | 'admin'
  const [activeRole, setActiveRole] = useState<"student" | "teacher" | "admin">("student");

  // Portal Landing Page vs Portal Views: 'portal' | 'student' | 'teacher' | 'admin'
  const [activePortal, setActivePortal] = useState<"portal" | "student" | "teacher" | "admin">("portal");

  // Home Page Sub-tabs: 'student' | 'teacher' | 'admin'
  const [activeHomeTab, setActiveHomeTab] = useState<"student" | "teacher" | "admin">("student");

  // Sandbox Mode: when false, rapid switchers and offline simulation are hidden for security on other devices
  const [sandboxModeEnabled, setSandboxModeEnabled] = useState<boolean>(false);

  // Main global admin password state
  const [superAdminCode, setSuperAdminCode] = useState("admin1234");

  // Maintenance Mode: when true, a professional maintenance screen block is displayed for all non-admin users
  const [maintenanceModeEnabled, setMaintenanceModeEnabled] = useState<boolean>(false);
  const [maintenanceBypassCode, setMaintenanceBypassCode] = useState<string>(() => {
    return localStorage.getItem("halro_bypass_maintenance_code") || "";
  });
  const isMaintenanceBypassed = maintenanceBypassCode === superAdminCode;
  const [maintenanceCodeInput, setMaintenanceCodeInput] = useState("");
  const [maintenanceError, setMaintenanceError] = useState("");

  // Main Persistent State
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [studentCodes, setStudentCodes] = useState<StudentCode[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simulated Device State
  const [currentDeviceId] = useState<string>(() => {
    const stored = localStorage.getItem("halro_device_id");
    if (stored) return stored;
    const newId = "dev-" + Math.floor(100000 + Math.random() * 900000);
    localStorage.setItem("halro_device_id", newId);
    return newId;
  });

  // Network Offline States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulateOffline, setSimulateOffline] = useState(false);

  // Toggle for simulator/sandbox controls to see the pure production view
  const [showSandboxControls, setShowSandboxControls] = useState(true);

  // Derived state: only show sandbox controls if enabled globally AND locally
  const actualShowSandboxControls = sandboxModeEnabled && showSandboxControls;

  // Production Lock Mode: "none" | "student" | "teacher" | "admin"
  // If locked, the sandbox switcher is hidden and the app runs purely as that single role.
  const [productionLock, setProductionLock] = useState<"none" | "student" | "teacher" | "admin">("none");

  // Initialize from Firestore or LocalStorage/IndexedDB fallback
  useEffect(() => {
    const loadDataWithFallback = async () => {
      let firebaseLoaded = false;
      let loadedPayoutRequests: PayoutRequest[] = [];
      let loadedInvoices: Invoice[] = [];
      let loadedStudentCodes: StudentCode[] = [];
      
      const isConnected = await testFirestoreConnection();
      if (isConnected) {
        try {
          console.log("Loading all data from Firestore...");
          const dbData = await loadAllDataFromFirestore();
          
          setClasses(dbData.classes);
          setCourses(dbData.courses);
          setTeachers(dbData.teachers);
          
          loadedStudentCodes = dbData.studentCodes;
          loadedPayoutRequests = dbData.payoutRequests;
          loadedInvoices = dbData.invoices;
          
          // Fetch global settings from Firestore
          try {
            const settings = await loadSettingsFromFirestore();
            setSuperAdminCode(settings.superAdminCode);
            setSandboxModeEnabled(settings.sandboxModeEnabled);
            setMaintenanceModeEnabled(!!settings.maintenanceModeEnabled);
            localStorage.setItem("halro_admin_code", settings.superAdminCode);
            localStorage.setItem("halro_sandbox_mode_enabled", JSON.stringify(settings.sandboxModeEnabled));
            localStorage.setItem("halro_maintenance_mode_enabled", JSON.stringify(!!settings.maintenanceModeEnabled));
          } catch (e) {
            console.error("Failed to load settings from Firestore, using local:", e);
          }
          
          // Back-save to localStorage/IndexedDB for next offline boot
          localStorage.setItem("halro_classes", JSON.stringify(dbData.classes));
          saveCoursesToIndexedDB(dbData.courses);
          localStorage.setItem("halro_teachers", JSON.stringify(dbData.teachers));
          localStorage.setItem("halro_student_codes", JSON.stringify(dbData.studentCodes));
          
          firebaseLoaded = true;
          console.log("✓ All data loaded successfully from cloud Firestore.");
        } catch (e) {
          console.error("Failed to load from Firestore, falling back to LocalStorage:", e);
        }
      }

      if (!firebaseLoaded) {
        console.log("Using LocalStorage/IndexedDB fallback...");
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
          loadedPayoutRequests = [];
          loadedInvoices = [];
          
          setPayoutRequests([]);
          setInvoices([]);
          setIsLoaded(true);
          return;
        }

        const storedClasses = localStorage.getItem("halro_classes");
        const storedTeachers = localStorage.getItem("halro_teachers");
        const storedCodes = localStorage.getItem("halro_student_codes");
        const storedPayouts = localStorage.getItem("halro_payout_requests");
        const storedInvoices = localStorage.getItem("halro_invoices");

        try {
          if (storedClasses) setClasses(JSON.parse(storedClasses));
          else setClasses(initialClasses);
        } catch (e) {
          setClasses(initialClasses);
        }

        try {
          if (storedTeachers) setTeachers(JSON.parse(storedTeachers));
          else setTeachers(initialTeachers);
        } catch (e) {
          setTeachers(initialTeachers);
        }

        try {
          if (storedCodes) loadedStudentCodes = JSON.parse(storedCodes);
          else loadedStudentCodes = [...initialStudentCodes];
        } catch (e) {
          loadedStudentCodes = [...initialStudentCodes];
        }

        try {
          if (storedPayouts) loadedPayoutRequests = JSON.parse(storedPayouts);
        } catch (e) {}

        try {
          if (storedInvoices) loadedInvoices = JSON.parse(storedInvoices);
        } catch (e) {}

        // Load courses asynchronously from IndexedDB
        try {
          const dbCourses = await loadCoursesFromIndexedDB();
          if (dbCourses && dbCourses.length > 0) {
            setCourses(dbCourses);
          } else {
            setCourses(initialCourses);
            saveCoursesToIndexedDB(initialCourses);
          }
        } catch (e) {
          setCourses(initialCourses);
        }
      }

      // 1-Year Automatic Cleanup for Teacher Payment History (PayoutRequests & Invoices)
      try {
        const oneYearAgoMs = Date.now() - 365 * 24 * 60 * 60 * 1000;

        const expiredPayouts = loadedPayoutRequests.filter(p => new Date(p.createdAt).getTime() < oneYearAgoMs);
        const validPayouts = loadedPayoutRequests.filter(p => new Date(p.createdAt).getTime() >= oneYearAgoMs);

        const expiredInvoices = loadedInvoices.filter(i => new Date(i.paidAt).getTime() < oneYearAgoMs);
        const validInvoices = loadedInvoices.filter(i => new Date(i.paidAt).getTime() >= oneYearAgoMs);

        if (expiredPayouts.length > 0 || expiredInvoices.length > 0) {
          console.log(`[Auto-Cleanup] Deleting ${expiredPayouts.length} expired payout requests and ${expiredInvoices.length} expired invoices (older than 1 year).`);
          
          loadedPayoutRequests = validPayouts;
          loadedInvoices = validInvoices;

          if (firebaseLoaded) {
            for (const payout of expiredPayouts) {
              await deletePayoutRequestFromFirestore(payout.id).catch(err => console.error("Firestore sync failed for expired payout:", err));
            }
            for (const invoice of expiredInvoices) {
              await deleteInvoiceFromFirestore(invoice.id).catch(err => console.error("Firestore sync failed for expired invoice:", err));
            }
          }
        }
      } catch (err) {
        console.error("Error during auto-cleanup of old payment history:", err);
      }

      // Automatic Expiry Update & Purge for Expired Student Codes
      try {
        const nowMs = Date.now();
        const tempExpiryThresholdMs = nowMs - 7 * 24 * 60 * 60 * 1000; // 7 days ago
        const definitiveExpiryThresholdMs = nowMs - 180 * 24 * 60 * 60 * 1000; // 180 days ago

        const updatedCodes: StudentCode[] = [];
        const expiredAndDeletedIds: string[] = [];
        const expiredButUpdatedCodes: StudentCode[] = [];

        for (const code of loadedStudentCodes) {
          const expiresMs = new Date(code.expiresAt).getTime();
          const isExpired = expiresMs < nowMs;

          // 1. Permanent deletion threshold check
          if (isExpired) {
            if (code.type === "temporary" && expiresMs < tempExpiryThresholdMs) {
              expiredAndDeletedIds.push(code.id);
              continue; // Skip, do not add to updatedCodes (deleted)
            }
            if (code.type === "definitive" && expiresMs < definitiveExpiryThresholdMs) {
              expiredAndDeletedIds.push(code.id);
              continue; // Skip, do not add to updatedCodes (deleted)
            }
          }

          // 2. Status update check
          if (isExpired && code.status === "active") {
            const updatedCode: StudentCode = { ...code, status: "expired" as const };
            updatedCodes.push(updatedCode);
            expiredButUpdatedCodes.push(updatedCode);
          } else {
            updatedCodes.push(code);
          }
        }

        if (expiredAndDeletedIds.length > 0 || expiredButUpdatedCodes.length > 0) {
          console.log(`[Auto-Cleanup] Deleting ${expiredAndDeletedIds.length} very old expired student codes, and updating status to "expired" for ${expiredButUpdatedCodes.length} student codes.`);
          loadedStudentCodes = updatedCodes;

          if (firebaseLoaded) {
            // Delete very old codes from Firestore
            for (const id of expiredAndDeletedIds) {
              await deleteStudentCodeFromFirestore(id).catch(err => console.error("Firestore sync failed for deleting expired student code:", err));
            }
            // Update status of recently expired codes in Firestore
            for (const code of expiredButUpdatedCodes) {
              await saveStudentCodeToFirestore(code).catch(err => console.error("Firestore sync failed for updating expired student code status:", err));
            }
          }
        }
      } catch (err) {
        console.error("Error during auto-cleanup of student codes:", err);
      }

      setPayoutRequests(loadedPayoutRequests);
      setInvoices(loadedInvoices);
      setStudentCodes(loadedStudentCodes);
      localStorage.setItem("halro_payout_requests", JSON.stringify(loadedPayoutRequests));
      localStorage.setItem("halro_invoices", JSON.stringify(loadedInvoices));
      localStorage.setItem("halro_student_codes", JSON.stringify(loadedStudentCodes));

      // Rest of simple settings that don't live in Firestore collections
      const storedAdminCode = localStorage.getItem("halro_admin_code");
      const storedLock = localStorage.getItem("halro_production_lock");
      const storedSandboxMode = localStorage.getItem("halro_sandbox_mode_enabled");
      const storedMaintenanceMode = localStorage.getItem("halro_maintenance_mode_enabled");

      if (storedAdminCode) setSuperAdminCode(storedAdminCode);
      else setSuperAdminCode("admin1234");

      if (storedSandboxMode) {
        try {
          setSandboxModeEnabled(JSON.parse(storedSandboxMode));
        } catch (e) {
          setSandboxModeEnabled(false);
        }
      } else {
        setSandboxModeEnabled(false);
      }

      if (storedMaintenanceMode) {
        try {
          setMaintenanceModeEnabled(JSON.parse(storedMaintenanceMode));
        } catch (e) {
          setMaintenanceModeEnabled(false);
        }
      } else {
        setMaintenanceModeEnabled(false);
      }

      if (storedLock) {
        setProductionLock(storedLock as any);
        if (storedLock !== "none") {
          setActiveRole(storedLock as any);
          setActivePortal(storedLock as any);
          setShowSandboxControls(false);
        }
      }

      setIsLoaded(true);
    };

    loadDataWithFallback();
  }, []);

  // Live listener to synchronize global settings across all devices in real-time
  useEffect(() => {
    if (isOnline && !simulateOffline) {
      const unsubscribe = subscribeToGlobalSettings((settings) => {
        setSuperAdminCode(settings.superAdminCode);
        setSandboxModeEnabled(settings.sandboxModeEnabled);
        setMaintenanceModeEnabled(!!settings.maintenanceModeEnabled);
        
        localStorage.setItem("halro_admin_code", settings.superAdminCode);
        localStorage.setItem("halro_sandbox_mode_enabled", JSON.stringify(settings.sandboxModeEnabled));
        localStorage.setItem("halro_maintenance_mode_enabled", JSON.stringify(!!settings.maintenanceModeEnabled));
      });
      return () => unsubscribe();
    }
  }, [isOnline, simulateOffline]);

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
      saveCoursesToIndexedDB(courses);
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
    if (isOnline && !simulateOffline) {
      saveClassToFirestore(newCl).catch(e => console.error("Firestore sync failed", e));
    }
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    if (isOnline && !simulateOffline) {
      deleteClassFromFirestore(classId).catch(e => console.error("Firestore sync failed", e));
    }
  };

  // Super Admin / Teacher action: Add Course
  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [...prev, newCourse]);
    if (isOnline && !simulateOffline) {
      saveCourseToFirestore(newCourse).catch(e => console.error("Firestore sync failed", e));
    }
  };

  const handleUpdateCourses = (updated: Course[]) => {
    setCourses(updated);
    if (isOnline && !simulateOffline) {
      updated.forEach(c => saveCourseToFirestore(c).catch(e => console.error("Firestore sync failed", e)));
    }
  };

  // Super Admin action: Enroll Teacher
  const handleAddTeacher = (newTeach: Teacher) => {
    setTeachers(prev => [...prev, newTeach]);
    if (isOnline && !simulateOffline) {
      saveTeacherToFirestore(newTeach).catch(e => console.error("Firestore sync failed", e));
    }
  };

  const handleDeleteTeacher = (teacherId: string) => {
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
    if (isOnline && !simulateOffline) {
      deleteTeacherFromFirestore(teacherId).catch(e => console.error("Firestore sync failed", e));
    }
  };

  // Super Admin / Teacher action: update student codes
  const handleUpdateStudentCodes = (updated: StudentCode[]) => {
    setStudentCodes(updated);
    if (isOnline && !simulateOffline) {
      updated.forEach(c => saveStudentCodeToFirestore(c).catch(e => console.error("Firestore sync failed", e)));
    }
  };

  const handleDeleteStudentCode = (codeId: string) => {
    setStudentCodes(prev => prev.filter(c => c.id !== codeId));
    if (isOnline && !simulateOffline) {
      deleteStudentCodeFromFirestore(codeId).catch(e => console.error("Firestore sync failed", e));
    }
  };

  // Teacher action: Request Payout
  const handleSendPayoutRequest = (req: PayoutRequest) => {
    setPayoutRequests(prev => [req, ...prev]);
    if (isOnline && !simulateOffline) {
      savePayoutRequestToFirestore(req).catch(e => console.error("Firestore sync failed", e));
    }
  };

  // Super Admin action: Resolve Payout Request, reset balance & generate invoice
  const handleResolvePayout = (requestId: string, invoice: Invoice) => {
    // 1. Mark request as paid
    setPayoutRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "paid" } : r));
    
    // 2. Add Invoice record
    setInvoices(prev => [invoice, ...prev]);

    // 3. Reset teacher balance to 0 in active list
    setTeachers(prev => prev.map(t => t.matricule === invoice.teacherMatricule ? { ...t, balance: 0 } : t));

    if (isOnline && !simulateOffline) {
      // Find the request to update
      const targetReq = payoutRequests.find(r => r.id === requestId);
      if (targetReq) {
        savePayoutRequestToFirestore({ ...targetReq, status: "paid" }).catch(e => console.error("Firestore sync failed", e));
      }
      
      // Save Invoice
      saveInvoiceToFirestore(invoice).catch(e => console.error("Firestore sync failed", e));
      
      // Reset teacher balance in Firestore
      const targetTeacher = teachers.find(t => t.matricule === invoice.teacherMatricule);
      if (targetTeacher) {
        saveTeacherToFirestore({ ...targetTeacher, balance: 0 }).catch(e => console.error("Firestore sync failed", e));
      }
    }
  };

  // Super Admin action: Update teachers
  const handleUpdateTeachers = (updated: Teacher[]) => {
    setTeachers(updated);
    if (isOnline && !simulateOffline) {
      updated.forEach(t => saveTeacherToFirestore(t).catch(e => console.error("Firestore sync failed", e)));
    }
  };

  // Super Admin action: Update Super Admin Code
  const handleUpdateSuperAdminCode = (newCode: string) => {
    setSuperAdminCode(newCode);
    setMaintenanceBypassCode(newCode);
    localStorage.setItem("halro_bypass_maintenance_code", newCode);
    if (isOnline && !simulateOffline) {
      saveSettingsToFirestore({ superAdminCode: newCode, sandboxModeEnabled, maintenanceModeEnabled }).catch(e => console.error("Firestore sync failed for settings", e));
    }
  };

  // Super Admin action: Update Sandbox Mode
  const handleUpdateSandboxMode = (enabled: boolean) => {
    setSandboxModeEnabled(enabled);
    localStorage.setItem("halro_sandbox_mode_enabled", JSON.stringify(enabled));
    if (isOnline && !simulateOffline) {
      saveSettingsToFirestore({ superAdminCode, sandboxModeEnabled: enabled, maintenanceModeEnabled }).catch(e => console.error("Firestore sync failed for settings", e));
    }
  };

  // Super Admin action: Update Maintenance Mode
  const handleUpdateMaintenanceMode = (enabled: boolean) => {
    setMaintenanceModeEnabled(enabled);
    localStorage.setItem("halro_maintenance_mode_enabled", JSON.stringify(enabled));
    if (enabled) {
      setMaintenanceBypassCode(superAdminCode);
      localStorage.setItem("halro_bypass_maintenance_code", superAdminCode);
    }
    if (isOnline && !simulateOffline) {
      saveSettingsToFirestore({ superAdminCode, sandboxModeEnabled, maintenanceModeEnabled: enabled }).catch(e => console.error("Firestore sync failed for settings", e));
    }
  };

  // Super Admin / Teacher action: Generate code
  const handleGenerateCode = (newCode: StudentCode, commissionDetails?: string) => {
    setStudentCodes(prev => [newCode, ...prev]);
    if (commissionDetails) {
      console.log("Commissions distribuées :", commissionDetails);
    }
    if (isOnline && !simulateOffline) {
      saveStudentCodeToFirestore(newCode).catch(e => console.error("Firestore sync failed", e));
    }
  };

  const resetAllDataToDefault = async () => {
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

    if (isOnline && !simulateOffline) {
      try {
        await resetFirestore();
        console.log("Firestore reset successfully.");
      } catch (e) {
        console.error("Failed to reset Firestore:", e);
      }
    }

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
      {actualShowSandboxControls ? (
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

            {sandboxModeEnabled && productionLock === "none" && (
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
        {actualShowSandboxControls && activePortal !== "portal" && (
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
          
          {maintenanceModeEnabled && !isMaintenanceBypassed ? (
            <div id="maintenance-mode-screen" className="max-w-2xl mx-auto py-12 px-6 bg-slate-900/40 border border-slate-850 rounded-3xl text-center space-y-6 shadow-2xl animate-fade-in my-10">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Wrench size={32} />
              </div>
              
              <div className="space-y-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-950/60 text-amber-400 rounded-full border border-amber-900/30 text-[11px] font-black tracking-widest uppercase animate-pulse">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                  <span>Maintenance Active</span>
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white">Application Temporairement Indisponible</h2>
                <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  HALRO Mobile School fait l'objet de travaux d'amélioration et de mises à jour pour préparer les nouveaux supports de cours de manière sécurisée.
                </p>
              </div>

              <div className="p-4 bg-slate-950/50 border border-slate-850/60 rounded-2xl max-w-md mx-auto text-left space-y-1.5">
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Vos cours, licences et documents sont conservés en toute sécurité.</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Le service d'études reprendra dès la fin des opérations de modification.</span>
                </p>
              </div>

              {/* Developer / Admin override login */}
              <div className="border-t border-slate-800/60 pt-6 max-w-md mx-auto space-y-4">
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                  <Lock size={14} className="text-slate-500" />
                  <span>Accès Administration & Développement</span>
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (maintenanceCodeInput === superAdminCode) {
                      setMaintenanceBypassCode(superAdminCode);
                      localStorage.setItem("halro_bypass_maintenance_code", superAdminCode);
                      setMaintenanceError("");
                    } else {
                      setMaintenanceError("Code administrateur incorrect.");
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Saisir le Code Super Admin"
                      value={maintenanceCodeInput}
                      onChange={(e) => setMaintenanceCodeInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono tracking-widest"
                    />
                  </div>
                  
                  {maintenanceError && (
                    <p className="text-[10px] text-red-500 font-bold animate-pulse">{maintenanceError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-xl transition duration-200"
                  >
                    Déverrouiller pour Maintenance/Développement
                  </button>
                </form>
              </div>
              
              <p className="text-[10px] text-slate-600 font-mono">
                HALRO Mobile School • Protection Active
              </p>
            </div>
          ) : (
            <>
              {/* PORTAL LANDING SCREEN */}
          {activePortal === "portal" && (
            <div id="portal-landing-page" className="max-w-6xl mx-auto py-4 space-y-6 animate-fade-in">
              
              {/* High-end Brand Header */}
              <div className="text-center space-y-3 mb-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-950/60 text-indigo-400 rounded-full border border-indigo-900/30 text-[11px] font-semibold">
                  <span>Enseignement à distance sécurisé de référence</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white font-sans">
                  HALRO MOBILE SCHOOL
                </h2>
                <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                  L'application professionnelle de partage de supports de cours protégés. 
                  Filigrane dynamique et blocage d'impression intégrés pour préserver la propriété intellectuelle.
                </p>
              </div>

              {/* Three Tabs for Roles */}
              <div className="flex justify-center bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 max-w-lg mx-auto mb-8 shadow-xl">
                <button
                  id="home-tab-student"
                  onClick={() => setActiveHomeTab("student")}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-300 ${
                    activeHomeTab === "student"
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                  }`}
                >
                  <Smartphone size={14} />
                  <span>🎓 Élève</span>
                </button>
                <button
                  id="home-tab-teacher"
                  onClick={() => setActiveHomeTab("teacher")}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-300 ${
                    activeHomeTab === "teacher"
                      ? "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                  }`}
                >
                  <Users size={14} />
                  <span>👨‍🏫 Enseignant</span>
                </button>
                <button
                  id="home-tab-admin"
                  onClick={() => setActiveHomeTab("admin")}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-300 ${
                    activeHomeTab === "admin"
                      ? "bg-gradient-to-tr from-red-650 to-pink-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                  }`}
                >
                  <Shield size={14} />
                  <span>🔑 Admin</span>
                </button>
              </div>

              {/* Tab Contents using hidden class for state preservation */}
              <div className="mt-6">
                
                {/* 1. STUDENT TAB */}
                <div className={activeHomeTab === "student" ? "animate-fade-in" : "hidden"}>
                  <div className="max-w-sm mx-auto">
                    <StudentMobileApp
                      classes={classes}
                      courses={courses}
                      studentCodes={studentCodes}
                      currentDeviceId={currentDeviceId}
                      isOnline={isOnline && !simulateOffline}
                      onUpdateCodes={handleUpdateStudentCodes}
                      onDeleteCode={handleDeleteStudentCode}
                      onBackToPortal={() => {}}
                    />
                  </div>
                </div>

                {/* 2. TEACHER TAB */}
                <div className={activeHomeTab === "teacher" ? "animate-fade-in" : "hidden"}>
                  <div className="py-2 max-w-5xl mx-auto space-y-4">
                    <div className="text-center md:text-left mb-6">
                      <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-500/10 uppercase">
                        Portail Enseignants
                      </span>
                      <h2 className="text-xl font-bold text-slate-100 mt-2">Espace Auteurs de cours & Commissions</h2>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        Publiez des documents protégés, gérez vos classes et suivez vos commissions en temps réel.
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
                      onDeleteTeacher={handleDeleteTeacher}
                    />
                  </div>
                </div>

                {/* 3. ADMIN TAB */}
                <div className={activeHomeTab === "admin" ? "animate-fade-in" : "hidden"}>
                  <div className="py-2 max-w-6xl mx-auto space-y-4">
                    <div className="text-center md:text-left mb-6">
                      <span className="text-[10px] font-extrabold tracking-widest text-red-400 bg-red-950/40 px-2.5 py-1 rounded-full border border-red-500/10 uppercase">
                        Super Administration
                      </span>
                      <h2 className="text-xl font-bold text-slate-100 mt-2">Panneau de Contrôle de la Direction</h2>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        Créez des classes, enrôlez des professeurs auteurs de cours et administrez le système de commissions.
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
                      onDeleteClass={handleDeleteClass}
                      onAddTeacher={handleAddTeacher}
                      onDeleteTeacher={handleDeleteTeacher}
                      onUpdateTeachers={handleUpdateTeachers}
                      onGenerateCode={handleGenerateCode}
                      onUpdateCodes={handleUpdateStudentCodes}
                      onResolvePayout={handleResolvePayout}
                      onUpdateSuperAdminCode={handleUpdateSuperAdminCode}
                      onUpdateProductionLock={setProductionLock}
                      onAddCourse={handleAddCourse}
                      onUpdateCourses={handleUpdateCourses}
                      sandboxModeEnabled={sandboxModeEnabled}
                      onUpdateSandboxMode={handleUpdateSandboxMode}
                      maintenanceModeEnabled={maintenanceModeEnabled}
                      onUpdateMaintenanceMode={handleUpdateMaintenanceMode}
                    />
                  </div>
                </div>

              </div>

              {/* Secure explanation banner */}
              <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 mt-10">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span>Système de Protection Active</span>
                  </h4>
                  <p className="leading-relaxed">
                    Les cours ne sont jamais téléchargeables en PDF brut. La lecture s'effectue au travers de notre visionneuse avec filigrane indélébile contenant le matricule de l'apprenant.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    <span>Juste Rémunération Enseignante</span>
                  </h4>
                  <p className="leading-relaxed">
                    L'enregistrement d'un code élève définitif crédite automatiquement la commission due aux enseignants auteurs de la classe correspondante.
                  </p>
                </div>
              </div>

              {/* Contacter l'administrateur section */}
              <div id="contact-admin-section" className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                    📞 Contacter l'administrateur
                  </h4>
                  <p className="text-xs text-slate-400">
                    Pour toute attribution de code, support technique, demande de partenariat ou question sur la plateforme.
                  </p>
                </div>
                <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800/80 text-center md:text-right">
                  <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-widest font-bold mb-0.5">E-mail de support</span>
                  <a href="mailto:haleurodrigue@gmail.com" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 font-mono transition">
                    haleurodrigue@gmail.com
                  </a>
                </div>
              </div>

              {/* Non-production developer trigger for easy sandbox access */}
              {sandboxModeEnabled && productionLock === "none" && (
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
              {actualShowSandboxControls && (
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
                onDeleteCode={handleDeleteStudentCode}
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
                onDeleteTeacher={handleDeleteTeacher}
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
                onDeleteClass={handleDeleteClass}
                onAddTeacher={handleAddTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onUpdateTeachers={handleUpdateTeachers}
                onGenerateCode={handleGenerateCode}
                onUpdateCodes={handleUpdateStudentCodes}
                onResolvePayout={handleResolvePayout}
                onUpdateSuperAdminCode={handleUpdateSuperAdminCode}
                onUpdateProductionLock={setProductionLock}
                onAddCourse={handleAddCourse}
                onUpdateCourses={handleUpdateCourses}
                sandboxModeEnabled={sandboxModeEnabled}
                onUpdateSandboxMode={handleUpdateSandboxMode}
                maintenanceModeEnabled={maintenanceModeEnabled}
                onUpdateMaintenanceMode={handleUpdateMaintenanceMode}
              />
            </div>
          )}
          </>
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

          {sandboxModeEnabled && productionLock !== "none" && (
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
