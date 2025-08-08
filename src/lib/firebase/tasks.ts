import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  Timestamp,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  tags?: string[];
  estimatedTime?: number; // in minutes
}

export interface TaskInput {
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
}

export class TaskService {
  private static collectionName = 'tasks';

  static async getTasks(userId: string): Promise<Task[]> {
    const tasksRef = collection(db, this.collectionName);
    const q = query(tasksRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  }

  static async createTask(taskData: TaskInput, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...taskData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const docRef = doc(db, this.collectionName, taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteTask(taskId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, taskId);
    await deleteDoc(docRef);
  }

  static async getTaskById(taskId: string): Promise<Task | null> {
    const docRef = doc(db, this.collectionName, taskId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Task;
    }
    return null;
  }

  static subscribeToTasks(userId: string, callback: (tasks: Task[]) => void) {
    const tasksRef = collection(db, this.collectionName);
    const q = query(tasksRef, where('userId', '==', userId));
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      callback(tasks);
    });
  }

  static async getOverdueTasks(userId: string): Promise<Task[]> {
    const tasksRef = collection(db, this.collectionName);
    const now = new Date();
    const q = query(
      tasksRef, 
      where('userId', '==', userId),
      where('dueDate', '<', now),
      where('status', '!=', 'done')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  }
}
