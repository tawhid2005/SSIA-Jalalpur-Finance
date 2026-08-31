import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  where,
  getCountFromServer,
  enableIndexedDbPersistence
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyATsd3R5ygs0BPX7lZ0tt3p8g4WX62UXic",
  authDomain: "ssia-jalalpur-finance.firebaseapp.com",
  projectId: "ssia-jalalpur-finance",
  storageBucket: "ssia-jalalpur-finance.firebasestorage.app",
  messagingSenderId: "510712336953",
  appId: "1:510712336953:web:2fa80b40dba1968d19b3e8",
  measurementId: "G-RLLDW204D9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestoreDb = getFirestore(app);

// Enable offline persistence (cache data locally)
enableIndexedDbPersistence(firestoreDb).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});

class FirestoreCollectionWrapper {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.colRef = collection(firestoreDb, collectionName);
  }

  // Mimic Dexie's toArray()
  async toArray() {
    const snapshot = await getDocs(this.colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Mimic Dexie's add(data)
  async add(data) {
    if (data.id) {
      // If data has an explicit id (like Students 'JAL-0001'), use setDoc
      const id = data.id;
      const dataWithoutId = { ...data };
      delete dataWithoutId.id; // avoid duplicating id in document fields
      await setDoc(doc(firestoreDb, this.collectionName, id), dataWithoutId);
      return id;
    } else {
      // Auto-generate ID
      const docRef = await addDoc(this.colRef, data);
      return docRef.id;
    }
  }

  // Mimic Dexie's put(data) -> update or insert
  async put(data) {
    if (!data.id) throw new Error("put() requires data with an id");
    const id = data.id;
    const dataWithoutId = { ...data };
    delete dataWithoutId.id;
    await setDoc(doc(firestoreDb, this.collectionName, id), dataWithoutId, { merge: true });
    return id;
  }

  // Mimic Dexie's update(id, changes)
  async update(id, changes) {
    const dataWithoutId = { ...changes };
    delete dataWithoutId.id;
    await setDoc(doc(firestoreDb, this.collectionName, String(id)), dataWithoutId, { merge: true });
    return 1; // Number of updated rows
  }

  // Mimic Dexie's get(id)
  async get(id) {
    const docSnap = await getDoc(doc(firestoreDb, this.collectionName, String(id)));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return undefined;
  }

  // Mimic Dexie's delete(id)
  async delete(id) {
    await deleteDoc(doc(firestoreDb, this.collectionName, String(id)));
  }

  // Mimic Dexie's count() (Used in generateStudentId)
  async count() {
    const snapshot = await getCountFromServer(this.colRef);
    return snapshot.data().count;
  }

  // Custom mimic for MockTests.jsx specifically (where...count)
  where(field) {
    return {
      equals: (value) => {
        return {
          count: async () => {
            const q = query(this.colRef, where(field, "==", value));
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
          }
        };
      }
    };
  }

  // Custom mimic for db.students.orderBy('id').last() used in generateStudentId
  orderBy(field) {
    return {
      last: async () => {
        // To get the last added student by ID (e.g. JAL-0001) we can sort by id desc, limit 1
        // Note: Firestore requires __name__ for sorting by document ID
        const sortField = field === 'id' ? '__name__' : field;
        const q = query(this.colRef, orderBy(sortField, "desc"), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    };
  }
}

// Export the "db" object that mimics Dexie's structure
export const db = {
  students: new FirestoreCollectionWrapper('students'),
  fee_collections: new FirestoreCollectionWrapper('fee_collections'),
  mock_tests: new FirestoreCollectionWrapper('mock_tests'),
  incomes: new FirestoreCollectionWrapper('incomes'),
  expenses: new FirestoreCollectionWrapper('expenses'),
  marketing: new FirestoreCollectionWrapper('marketing'),
  teacher_salary: new FirestoreCollectionWrapper('teacher_salary'),
  attendance: new FirestoreCollectionWrapper('attendance'),
  staff_accounts: new FirestoreCollectionWrapper('staff_accounts')
};

// Auto ID generation specifically for students
export const generateStudentId = async () => {
  try {
    const lastStudent = await db.students.orderBy('id').last();
    if (!lastStudent) return 'JAL-0001';

    // lastStudent.id should be like "JAL-0025"
    const lastNumber = parseInt(lastStudent.id.split('-')[1]);
    return `JAL-${(lastNumber + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Error generating ID, falling back to count:", error);
    const count = await db.students.count();
    return `JAL-${(count + 1).toString().padStart(4, '0')}`;
  }
};
