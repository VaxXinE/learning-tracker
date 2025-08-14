// src/lib/firebase/tasks.ts
import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  orderBy, query, serverTimestamp, Timestamp, updateDoc, where
} from 'firebase/firestore';
import { db } from './firebase';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Timestamp;
  tags: string[];
  estimatedTime: number;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: Date;            // <- Date saat input
  estimatedTime: number;
  tags: string[];           // <- array string
}

const tasksCol = collection(db, 'tasks');

function toFirestore(input: TaskInput, userId: string) {
  return {
    title: input.title,
    description: input.description || '',
    priority: input.priority,
    status: 'todo' as TaskStatus,
    dueDate: Timestamp.fromDate(input.dueDate),
    estimatedTime: input.estimatedTime || 60,
    tags: input.tags || [],
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export const TaskService = {
  async createTask(input: TaskInput, userId: string) {
    await addDoc(tasksCol, toFirestore(input, userId));
  },

  async updateTask(taskId: string, payload: Partial<Pick<Task, 'title'|'description'|'priority'|'status'|'estimatedTime'|'tags'|'dueDate'>>) {
    const ref = doc(db, 'tasks', taskId);
    const data: any = { ...payload, updatedAt: serverTimestamp() };
    if ((payload as any)?.dueDate instanceof Date) {
      data.dueDate = Timestamp.fromDate(payload.dueDate as unknown as Date);
    }
    await updateDoc(ref, data);
  },

  async deleteTask(taskId: string) {
    await deleteDoc(doc(db, 'tasks', taskId));
  },

  // Realtime subscribe berdasarkan userId
  subscribeToTasks(userId: string, cb: (tasks: Task[]) => void) {
    const q = query(
      tasksCol,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Task, 'id'>),
      })) as Task[];
      cb(items);
    });
  },
};
