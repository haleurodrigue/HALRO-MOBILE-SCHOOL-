/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Class, Course, Teacher, StudentCode } from "../types";

export const initialClasses: Class[] = [
  { id: "p-a4", name: "Première A4", description: "Série Littéraire - Accent sur la Littérature, Philosophie et Langues." },
  { id: "p-d", name: "Première D", description: "Série Scientifique - Accent sur les Sciences de la Vie et de la Terre." },
  { id: "p-c", name: "Première C", description: "Série Scientifique - Accent sur les Mathématiques et les Sciences Physiques." },
  { id: "t-a4", name: "Terminale A4", description: "Série Littéraire de fin de cycle secondaire." },
  { id: "t-d", name: "Terminale D", description: "Série Scientifique de SVT de fin de cycle secondaire." },
  { id: "t-c", name: "Terminale C", description: "Série Scientifique d'élite de fin de cycle secondaire." }
];

export const initialTeachers: Teacher[] = [];

export const initialCourses: Course[] = [];

export const initialStudentCodes: StudentCode[] = [];
