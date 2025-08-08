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
import { db } from '../firebase';

export interface Course {
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lessonsCount: number;
  completedLessons: number;
  estimatedHours: number;
  lastAccessed: string;
  progress: number;
  featured: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
}

export interface CourseInput {
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  featured?: boolean;
}

export class CourseService {
  private static collectionName = 'courses';

  static async getCourses(userId: string): Promise<Course[]> {
    const coursesRef = collection(db, this.collectionName);
    const q = query(coursesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));
  }

  static async createCourse(courseData: CourseInput, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...courseData,
      lessonsCount: 0,
      completedLessons: 0,
      progress: 0,
      lastAccessed: new Date().toISOString().split('T')[0],
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async updateCourse(courseId: string, updates: Partial<Course>): Promise<void> {
    const docRef = doc(db, this.collectionName, courseId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteCourse(courseId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, courseId);
    await deleteDoc(docRef);
  }

  static async getCourseById(courseId: string): Promise<Course | null> {
    const docRef = doc(db, this.collectionName, courseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Course;
    }
    return null;
  }

  static subscribeToCourses(userId: string, callback: (courses: Course[]) => void) {
    const coursesRef = collection(db, this.collectionName);
    const q = query(coursesRef, where('userId', '==', userId));
    
    return onSnapshot(q, (snapshot) => {
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Course));
      callback(courses);
    });
  }

  static async updateCourseProgress(courseId: string, progress: number): Promise<void> {
    const docRef = doc(db, this.collectionName, courseId);
    await updateDoc(docRef, {
      progress,
      updatedAt: serverTimestamp()
    });
  }
}
