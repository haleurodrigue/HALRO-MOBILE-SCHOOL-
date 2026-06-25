import { Course } from "../types";

const DB_NAME = "halro_database";
const STORE_NAME = "courses_store";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported by your browser."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error || new Error("Failed to open IndexedDB database."));
    };
  });
}

export async function saveCoursesToIndexedDB(courses: Course[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Clear existing records first
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // Add all courses
        let count = 0;
        if (courses.length === 0) {
          resolve();
          return;
        }

        courses.forEach((course) => {
          const addRequest = store.put(course);
          addRequest.onsuccess = () => {
            count++;
            if (count === courses.length) {
              resolve();
            }
          };
          addRequest.onerror = (e: any) => {
            reject(e.target.error || new Error(`Failed to save course: ${course.title}`));
          };
        });
      };

      clearRequest.onerror = (e: any) => {
        reject(e.target.error || new Error("Failed to clear old courses in IndexedDB."));
      };
    });
  } catch (error) {
    console.error("IndexedDB error, falling back to local storage:", error);
    // Fallback to local storage (which might throw QuotaExceededError if large, but we still try)
    try {
      localStorage.setItem("halro_courses_fallback", JSON.stringify(courses));
    } catch (e) {
      console.error("LocalStorage fallback failed as well:", e);
    }
  }
}

export async function loadCoursesFromIndexedDB(): Promise<Course[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event: any) => {
        resolve(event.target.result || []);
      };

      request.onerror = (event: any) => {
        reject(event.target.error || new Error("Failed to retrieve courses from IndexedDB."));
      };
    });
  } catch (error) {
    console.error("IndexedDB load error, trying local storage fallback:", error);
    const fallback = localStorage.getItem("halro_courses_fallback");
    if (fallback) {
      try {
        return JSON.parse(fallback);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}
