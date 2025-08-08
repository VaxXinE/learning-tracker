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
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Lesson {
  id?: string;
  title: string;
  description: string;
  courseId: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  type: 'reading' | 'video' | 'assignment' | 'quiz' | 'project';
  estimatedTime: number;
  dueDate: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
}

export interface LessonInput {
  title: string;
  description: string;
  courseId: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  type: 'reading' | 'video' | 'assignment' | 'quiz' | 'project';
  estimatedTime: number;
  dueDate: string;
}

export class LessonService {
  private static collectionName = 'lessons';

  static async getLessons(userId: string): Promise<Lesson[]> {
    const lessonsRef = collection(db, this.collectionName);
    const q = query(lessonsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Lesson));
  }

  static async createLesson(lessonData: LessonInput, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...lessonData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<void> {
    const docRef = doc(db, this.collectionName, lessonId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteLesson(lessonId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, lessonId);
    await deleteDoc(docRef);
  }

  static async getLessonById(lessonId: string): Promise<Lesson | null> {
    const docRef = doc(db, this.collectionName, lessonId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Lesson;
    }
    return null;
  }

  static subscribeToLessons(userId: string, callback: (lessons: Lesson[]) => void) {
    const lessonsRef = collection(db, this.collectionName);
    const q = query(lessonsRef, where('userId', '==', userId));
    
    return onSnapshot(q, (snapshot) => {
      const lessons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Lesson));
      callback(lessons);
    });
  }

  static async getLessonsByCourse(userId: string, courseId: string): Promise<Lesson[]> {
    const lessonsRef = collection(db, this.collectionName);
    const q = query(
      lessonsRef, 
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Lesson));
  }

  static async getLessonsByStatus(userId: string, status: Lesson['status']): Promise<Lesson[]> {
    const lessonsRef = collection(db, this.collectionName);
    const q = query(
      lessonsRef, 
      where('userId', '==', userId),
      where('status', '==', status)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Lesson));
  }

  static async bulkUpdateStatus(userId: string, lessonIds: string[], status: Lesson['status']): Promise<void> {
    const batch = writeBatch(db);
    
    lessonIds.forEach(lessonId => {
      const docRef = doc(db, this.collectionName, lessonId);
      batch.update(docRef, {
        status,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  }
}
