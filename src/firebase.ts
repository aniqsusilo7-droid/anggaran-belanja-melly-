import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { BudgetCategory, Expense, SystemNotification } from './types';

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAYhzW0_D2beIiEWz27yQvom37DGjRIx1k",
  authDomain: "zeta-conduit-7cf5x.firebaseapp.com",
  projectId: "zeta-conduit-7cf5x",
  storageBucket: "zeta-conduit-7cf5x.firebasestorage.app",
  messagingSenderId: "200557523184",
  appId: "1:200557523184:web:7b7dcb7e7cfc6a11615235",
  firestoreDatabaseId: "ai-studio-anggaranbelanja-9304b653-d053-42d2-b8d3-f8d638eaeda8"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID provided in the configuration
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');

// Collections names
const CATS_COLLECTION = 'categories';
const EXPENSES_COLLECTION = 'expenses';
const NOTIFS_COLLECTION = 'notifications';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Fetch all categories from Firestore
 */
export async function fetchCategories(): Promise<BudgetCategory[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CATS_COLLECTION));
    const list: BudgetCategory[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as BudgetCategory);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, CATS_COLLECTION);
    return [];
  }
}

/**
 * Fetch all expenses from Firestore
 */
export async function fetchExpenses(): Promise<Expense[]> {
  try {
    const querySnapshot = await getDocs(collection(db, EXPENSES_COLLECTION));
    const list: Expense[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Expense);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, EXPENSES_COLLECTION);
    return [];
  }
}

/**
 * Fetch all notifications from Firestore
 */
export async function fetchNotifications(): Promise<SystemNotification[]> {
  try {
    const querySnapshot = await getDocs(collection(db, NOTIFS_COLLECTION));
    const list: SystemNotification[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as SystemNotification);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, NOTIFS_COLLECTION);
    return [];
  }
}

/**
 * Save or update a category in Firestore
 */
export async function saveCategory(category: BudgetCategory): Promise<void> {
  try {
    await setDoc(doc(db, CATS_COLLECTION, category.id), category);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CATS_COLLECTION}/${category.id}`);
  }
}

/**
 * Delete a category and its associated expenses in Firestore
 */
export async function deleteCategoryAndExpenses(categoryId: string, associatedExpenseIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Delete the category document
    batch.delete(doc(db, CATS_COLLECTION, categoryId));
    
    // Delete all associated expenses documents
    associatedExpenseIds.forEach((expenseId) => {
      batch.delete(doc(db, EXPENSES_COLLECTION, expenseId));
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CATS_COLLECTION}/${categoryId}`);
  }
}

/**
 * Save or update an expense in Firestore
 */
export async function saveExpense(expense: Expense): Promise<void> {
  try {
    await setDoc(doc(db, EXPENSES_COLLECTION, expense.id), expense);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${EXPENSES_COLLECTION}/${expense.id}`);
  }
}

/**
 * Delete an expense in Firestore
 */
export async function deleteExpenseDoc(expenseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, EXPENSES_COLLECTION, expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EXPENSES_COLLECTION}/${expenseId}`);
  }
}

/**
 * Batch save all notifications
 */
export async function saveNotifications(notifications: SystemNotification[]): Promise<void> {
  try {
    // Save in batches of 500
    const chunks: SystemNotification[][] = [];
    for (let i = 0; i < notifications.length; i += 500) {
      chunks.push(notifications.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((notif) => {
        batch.set(doc(db, NOTIFS_COLLECTION, notif.id), notif);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, NOTIFS_COLLECTION);
  }
}

/**
 * Perform a full-sync: Write all current local data to Firestore
 */
export async function uploadAllLocalData(
  categories: BudgetCategory[],
  expenses: Expense[],
  notifications: SystemNotification[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Categories
    categories.forEach((cat) => {
      batch.set(doc(db, CATS_COLLECTION, cat.id), cat);
    });

    // Expenses
    expenses.forEach((exp) => {
      batch.set(doc(db, EXPENSES_COLLECTION, exp.id), exp);
    });

    // Notifications
    notifications.forEach((notif) => {
      batch.set(doc(db, NOTIFS_COLLECTION, notif.id), notif);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "BATCH_UPLOAD");
  }
}
