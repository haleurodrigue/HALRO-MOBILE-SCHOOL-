import { db } from "./firebase";
import { 
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch, getDoc 
} from "firebase/firestore";
import { 
  Class, Course, Teacher, StudentCode, PayoutRequest, Invoice 
} from "../types";
import { initialClasses } from "../data/seedData";

// Individual upsert functions
export async function saveClassToFirestore(cls: Class): Promise<void> {
  await setDoc(doc(db, "classes", cls.id), cls);
}

export async function deleteClassFromFirestore(classId: string): Promise<void> {
  await deleteDoc(doc(db, "classes", classId));
}

export async function saveCourseToFirestore(course: Course): Promise<void> {
  await setDoc(doc(db, "courses", course.id), course);
}

export async function deleteCourseFromFirestore(courseId: string): Promise<void> {
  await deleteDoc(doc(db, "courses", courseId));
}

export async function saveTeacherToFirestore(teacher: Teacher): Promise<void> {
  await setDoc(doc(db, "teachers", teacher.id), teacher);
}

export async function deleteTeacherFromFirestore(teacherId: string): Promise<void> {
  await deleteDoc(doc(db, "teachers", teacherId));
}

export async function saveStudentCodeToFirestore(code: StudentCode): Promise<void> {
  await setDoc(doc(db, "studentCodes", code.id), code);
}

export async function deleteStudentCodeFromFirestore(codeId: string): Promise<void> {
  await deleteDoc(doc(db, "studentCodes", codeId));
}

export async function savePayoutRequestToFirestore(payout: PayoutRequest): Promise<void> {
  await setDoc(doc(db, "payoutRequests", payout.id), payout);
}

export async function deletePayoutRequestFromFirestore(payoutId: string): Promise<void> {
  await deleteDoc(doc(db, "payoutRequests", payoutId));
}

export async function saveInvoiceToFirestore(invoice: Invoice): Promise<void> {
  await setDoc(doc(db, "invoices", invoice.id), invoice);
}

export async function deleteInvoiceFromFirestore(invoiceId: string): Promise<void> {
  await deleteDoc(doc(db, "invoices", invoiceId));
}

// Bulk fetch function
export async function loadAllDataFromFirestore(): Promise<{
  classes: Class[];
  courses: Course[];
  teachers: Teacher[];
  studentCodes: StudentCode[];
  payoutRequests: PayoutRequest[];
  invoices: Invoice[];
}> {
  const [
    classesSnap,
    coursesSnap,
    teachersSnap,
    studentCodesSnap,
    payoutRequestsSnap,
    invoicesSnap
  ] = await Promise.all([
    getDocs(collection(db, "classes")),
    getDocs(collection(db, "courses")),
    getDocs(collection(db, "teachers")),
    getDocs(collection(db, "studentCodes")),
    getDocs(collection(db, "payoutRequests")),
    getDocs(collection(db, "invoices"))
  ]);

  const classes: Class[] = [];
  classesSnap.forEach((doc) => classes.push(doc.data() as Class));

  // If classes collection is empty, seed it with initialClasses
  if (classes.length === 0) {
    console.log("Seeding initial classes into Firestore...");
    for (const cls of initialClasses) {
      await setDoc(doc(db, "classes", cls.id), cls);
      classes.push(cls);
    }
  }

  const courses: Course[] = [];
  coursesSnap.forEach((doc) => courses.push(doc.data() as Course));

  const teachers: Teacher[] = [];
  teachersSnap.forEach((doc) => teachers.push(doc.data() as Teacher));

  const studentCodes: StudentCode[] = [];
  studentCodesSnap.forEach((doc) => studentCodes.push(doc.data() as StudentCode));

  const payoutRequests: PayoutRequest[] = [];
  payoutRequestsSnap.forEach((doc) => payoutRequests.push(doc.data() as PayoutRequest));

  const invoices: Invoice[] = [];
  invoicesSnap.forEach((doc) => invoices.push(doc.data() as Invoice));

  return {
    classes,
    courses,
    teachers,
    studentCodes,
    payoutRequests,
    invoices
  };
}

// Reset Firestore data
export async function resetFirestore(): Promise<void> {
  const collections = [
    "classes",
    "courses",
    "teachers",
    "studentCodes",
    "payoutRequests",
    "invoices"
  ];

  for (const colName of collections) {
    const snap = await getDocs(collection(db, colName));
    const batch = writeBatch(db);
    snap.forEach((document) => {
      batch.delete(doc(db, colName, document.id));
    });
    await batch.commit();
  }

  // Seed default classes
  for (const cls of initialClasses) {
    await setDoc(doc(db, "classes", cls.id), cls);
  }
}

export interface GlobalSettings {
  superAdminCode: string;
  sandboxModeEnabled: boolean;
}

export async function saveSettingsToFirestore(settings: GlobalSettings): Promise<void> {
  await setDoc(doc(db, "settings", "global"), settings);
}

export async function loadSettingsFromFirestore(): Promise<GlobalSettings> {
  try {
    const snap = await getDoc(doc(db, "settings", "global"));
    if (snap.exists()) {
      const data = snap.data();
      return {
        superAdminCode: data.superAdminCode || "admin1234",
        sandboxModeEnabled: data.sandboxModeEnabled !== undefined ? data.sandboxModeEnabled : false
      };
    }
  } catch (error) {
    console.error("Failed to load settings from Firestore, using defaults:", error);
  }
  return {
    superAdminCode: "admin1234",
    sandboxModeEnabled: false
  };
}
