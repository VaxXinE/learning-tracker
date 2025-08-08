import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface BaseItem {
  createdAt?: any;
  [key: string]: unknown;
}

export async function addItem(uid: string, col: 'courses'|'lessons'|'tasks', data: BaseItem) {
  const ref = collection(db, 'users', uid, col);
  return addDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function listItems(uid: string, col: 'courses'|'lessons'|'tasks') {
  const q = query(collection(db, 'users', uid, col), orderBy('createdAt','desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateItem(uid: string, col: 'courses'|'lessons'|'tasks', id: string, data: BaseItem) {
  return updateDoc(doc(db, 'users', uid, col, id), data);
}

export async function removeItem(uid: string, col: 'courses'|'lessons'|'tasks', id: string) {
  return deleteDoc(doc(db, 'users', uid, col, id));
}
