// src/lib/firebase/tasks.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
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
  /** Date saat input */
  dueDate: Date;
  estimatedTime: number;
  /** array string */
  tags: string[];
}

/** Payload update yang aman (dueDate boleh Date atau Timestamp) */
export type TaskUpdate = Partial<{
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedTime: number;
  tags: string[];
  dueDate: Date | Timestamp;
}>;

const tasksCol = collection(db, 'tasks');

function toFirestore(input: TaskInput, userId: string): Record<string, unknown> {
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

function coerceTask(id: string, raw: Record<string, unknown>): Task {
  const tsNow = Timestamp.fromDate(new Date());
  return {
    id,
    title: (raw.title as string) ?? '',
    description: (raw.description as string) ?? '',
    status: (raw.status as TaskStatus) ?? 'todo',
    priority: (raw.priority as TaskPriority) ?? 'medium',
    dueDate: (raw.dueDate as Timestamp) ?? tsNow,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    estimatedTime: typeof raw.estimatedTime === 'number' ? (raw.estimatedTime as number) : 60,
    userId: (raw.userId as string) ?? '',
    createdAt: (raw.createdAt as Timestamp) ?? tsNow,
    updatedAt: (raw.updatedAt as Timestamp) ?? tsNow,
  };
}

export const TaskService = {
  async createTask(input: TaskInput, userId: string): Promise<void> {
    await addDoc(tasksCol, toFirestore(input, userId));
  },

  async updateTask(taskId: string, payload: TaskUpdate): Promise<void> {
    const ref = doc(db, 'tasks', taskId);

    const data: Record<string, unknown> = {
      ...payload,
      updatedAt: serverTimestamp(),
    };

    // Normalisasi dueDate jika datang sebagai Date
    if (payload.dueDate instanceof Date) {
      data.dueDate = Timestamp.fromDate(payload.dueDate);
    }

    await updateDoc(ref, data);
  },

  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tasks', taskId));
  },

  /** Ambil sekali (non-realtime) */
  async getTasks(userId: string): Promise<Task[]> {
    const qy = query(tasksCol, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => coerceTask(d.id, d.data() as Record<string, unknown>));
  },

  /** Realtime subscribe berdasarkan userId */
  subscribeToTasks(userId: string, cb: (tasks: Task[]) => void) {
    const qy = query(tasksCol, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(qy, (snap) => {
      const items = snap.docs.map((d) => coerceTask(d.id, d.data() as Record<string, unknown>));
      cb(items);
    });
  },
};
