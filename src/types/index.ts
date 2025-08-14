export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  duration: number;
  completed: boolean;
  date?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  tags?: string[];
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalLessons: number;
  completedLessons: number;
  totalCourses: number;
  completedCourses: number;
  weeklyProgress: number;
  monthlyProgress: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface SearchResult {
  tasks: Task[];
  lessons: Lesson[];
  courses: Course[];
}
