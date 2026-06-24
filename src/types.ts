/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Class {
  id: string;
  name: string; // e.g. "Première A4", "Première D", etc.
  description: string;
}

export interface Course {
  id: string;
  classId: string;
  title: string;
  authorId: string; // Teacher Matricule / ID
  authorName: string;
  content: string[]; // List of page contents to support page-by-page viewing and protection
  createdAt: string;
}

export interface TeacherPermissions {
  generateCodes: boolean;
  addCourses: boolean;
  manageStudents: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  surname: string;
  matricule: string; // ENS-xxxx
  whatsapp: string;
  mobileMoney: string; // Orange / Mobile Money
  defaultCommission: number; // e.g. 100, 150, 200, 250, 500, 1000 FCFA
  balance: number;
  permissions: TeacherPermissions;
  createdAt: string;
}

export type AccessCodeType = "temporary" | "definitive";
export type AccessCodeStatus = "active" | "deactivated" | "expired";

export interface StudentCode {
  id: string;
  code: string; // APP-xxxx or custom format
  matricule: string; // Student matricule e.g. MAT-xxxx
  studentName?: string; // Nom de l'élève
  studentPhone?: string; // Téléphone de l'élève
  type: AccessCodeType;
  classId?: string; // Only for definitive
  status: AccessCodeStatus;
  createdAt: string;
  expiresAt: string; // 30 mins for temp, 1 year for definitive
  devicesUsed: string[]; // List of simulated device IDs
}

export interface PayoutRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherSurname: string;
  teacherMatricule: string;
  whatsapp: string;
  mobileMoney: string;
  amount: number;
  status: "pending" | "paid";
  createdAt: string;
}

export interface Invoice {
  id: string;
  payoutRequestId: string;
  teacherName: string;
  teacherSurname: string;
  teacherMatricule: string;
  whatsapp: string;
  mobileMoney: string;
  amount: number;
  paidAt: string;
  adminCode: string;
}

export interface AppState {
  classes: Class[];
  courses: Course[];
  teachers: Teacher[];
  studentCodes: StudentCode[];
  payoutRequests: PayoutRequest[];
  invoices: Invoice[];
  superAdminCode: string;
}
