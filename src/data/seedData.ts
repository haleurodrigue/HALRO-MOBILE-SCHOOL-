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

export const initialTeachers: Teacher[] = [
  {
    id: "t1",
    name: "Kouam",
    surname: "Rodrigue",
    matricule: "ENS-1024",
    whatsapp: "+237677123456",
    mobileMoney: "OM-677123456",
    defaultCommission: 250,
    balance: 5000,
    permissions: {
      generateCodes: true,
      addCourses: true,
      manageStudents: false
    },
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "t2",
    name: "Fotso",
    surname: "Jean-Paul",
    matricule: "ENS-2048",
    whatsapp: "+237699987654",
    mobileMoney: "MOMO-699987654",
    defaultCommission: 500,
    balance: 1500,
    permissions: {
      generateCodes: false,
      addCourses: true,
      manageStudents: false
    },
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  }
];

export const initialCourses: Course[] = [
  {
    id: "c1",
    classId: "p-d",
    title: "SVT - Physiologie de la Reproduction chez l'Homme",
    authorId: "ENS-1024",
    authorName: "M. Kouam Rodrigue",
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    content: [
      "Page 1: Introduction à la Physiologie Humaine\n\nLe système reproducteur humain est un ensemble d'organes spécialisés travaillant de concert pour assurer la survie de l'espèce. Chez l'homme et la femme, les gonades (testicules et ovaires) produisent des gamètes et des hormones sexuelles indispensables.\n\nNous étudierons dans ce chapitre la régulation hormonale mâle ainsi que les cycles féminins qui sont des questions récurrentes au baccalauréat.",
      "Page 2: Régulation chez l'homme\n\nL'axe hypothalamo-hypophysaire contrôle de manière étroite le fonctionnement des testicules :\n- L'hypothalamus sécrète la GnRH de manière pulsatile.\n- La GnRH stimule l'hypophyse qui produit la LH et la FSH.\n- La LH stimule les cellules de Leydig pour produire la Testostérone.\n- La FSH stimule les cellules de Sertoli pour la spermatogenèse.\n\nUn rétrocontrôle négatif de la testostérone régule cet axe pour maintenir un taux constant dans le sang.",
      "Page 3: Cycle ovarien et utérin chez la femme\n\nContrairement à l'homme où la production est continue, la physiologie féminine est cyclique (cycle de 28 jours en moyenne) :\n1. Phase folliculaire (jours 1 à 14) : Développement des follicules sous l'effet de la FSH, pic d'oestrogènes.\n2. Ovulation (jour 14) : Déclenchée par un pic de LH.\n3. Phase lutéale (jours 14 à 28) : Transformation du follicule rompu en corps jaune qui produit de la progestérone."
    ]
  },
  {
    id: "c2",
    classId: "p-c",
    title: "Mathématiques - Les Limites et Continuité des Fonctions",
    authorId: "ENS-2048",
    authorName: "M. Fotso Jean-Paul",
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    content: [
      "Page 1: Notion de Limite d'une Fonction\n\nSoit f une fonction numérique à variable réelle. L'étude des limites permet de comprendre le comportement de la fonction lorsque la variable x s'approche d'une valeur particulière a (finie) ou vers l'infini.\n\nFormule fondamentale : \nlim (x -> x0) [f(x)] = L signifie que f(x) peut être aussi proche de L que l'on veut, pourvu que x soit suffisamment proche de x0.",
      "Page 2: Formes Indéterminées et Méthodes de Résolution\n\nIl existe quatre formes indéterminées classiques :\n1. '0 / 0'\n2. 'infini / infini'\n3. '0 * infini'\n4. '+infini - infini'\n\nPour lever l'indétermination, on utilise :\n- La factorisation par le terme prépondérant.\n- L'expression conjuguée.\n- Le taux de variation (nombre dérivé).\n- Les règles des limites de fonctions de référence."
    ]
  },
  {
    id: "c3",
    classId: "t-a4",
    title: "Philosophie - Introduction à la Métaphysique",
    authorId: "ENS-1024",
    authorName: "M. Kouam Rodrigue",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    content: [
      "Page 1: Qu'est-ce que la Métaphysique ?\n\nÉtymologiquement, 'meta-physika' signifie 'ce qui vient après la physique'. Fondée par Aristote comme la 'philosophie première', elle s'occupe de l'être en tant qu'être, des premières causes et des principes fondamentaux de la réalité.\n\nElle cherche à répondre aux questions universelles : Pourquoi y a-t-il quelque chose plutôt que rien ? L'âme est-elle immortelle ? Dieu existe-t-il ?",
      "Page 2: Les grands courants métaphysiques\n\n- Le Dualisme (Platon, Descartes) : Séparation stricte du monde sensible et du monde intelligible (les Idées), ou du corps et de l'esprit.\n- Le Monisme (Spinoza) : Une seule substance fondamentale constitue tout l'univers.\n- Le Matérialisme (Démocrite, Marx) : Seule la matière existe, l'esprit n'est qu'un épiphénomène physique."
    ]
  }
];

export const initialStudentCodes: StudentCode[] = [
  {
    id: "sc1",
    code: "APP-4012",
    matricule: "MAT-2026-001",
    type: "definitive",
    classId: "p-d",
    status: "active",
    createdAt: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 265 * 24 * 3600 * 1000).toISOString(), // 1 year from creation
    devicesUsed: ["simulated-device-1"]
  },
  {
    id: "sc2",
    code: "APP-5089",
    matricule: "MAT-2026-002",
    type: "temporary",
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins
    devicesUsed: ["simulated-device-2"]
  }
];
