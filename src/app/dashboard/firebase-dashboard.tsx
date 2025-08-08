'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Calendar,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { CourseService } from '@/lib/firebase/courses';
import { TaskService } from '@/lib/firebase/tasks';
import type { Course } from '@/lib/firebase/courses';
import type { Task } from '@/lib/firebase/tasks';

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue",
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<{ size: number }>; // Updated icon type
  trend?: string;
  color?: "blue" | "green" | "orange" | "purple";
  subtitle?: string;
}) {
  const colorClasses: Record<"blue" | "green" | "orange" | "purple", string> = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/25",
    green: "from-green-500 to-green-600 shadow-green-500/25",
    orange: "from-orange-500 to-orange-600 shadow-orange-500/25",
    purple: "from-purple-500 to-purple-600 shadow-purple-500/25",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105`}>
      <div className="absolute -right-4 -top-4 opacity-10">
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <Icon size={24} className="opacity-80" />
          {trend && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm opacity-90">{title}</div>
        {subtitle && (
          <div className="text-xs opacity-75 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  color = "#3b82f6"
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute text-2xl font-bold">
        {Math.round(progress)}%
      </div>
    </div>
  );
}

export default function FirebaseDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [coursesData, tasksData] = await Promise.all([
          CourseService.getCourses(user.uid),
          TaskService.getTasks(user.uid)
        ]);
        
        setCourses(coursesData);
        setTasks(tasksData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      }
    };

    loadData();

    // Set up real-time listeners
    const unsubscribeCourses = CourseService.subscribeToCourses(user.uid, setCourses);
    const unsubscribeTasks = TaskService.subscribeToTasks(user.uid, setTasks);

    return () => {
      unsubscribeCourses();
      unsubscribeTasks();
    };
  }, [user]);

  const kpi = useMemo(() => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progress === 100).length;
    const inProgressCourses = courses.filter(c => c.progress > 0 && c.progress < 100).length;
    
    const overdueTasks = tasks.filter(task => {
      const dueDate = task.dueDate.toDate();
      return dueDate < new Date() && task.status !== 'done';
    }).length;

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      overdueTasks,
      totalHours: courses.reduce((acc, course) => acc + course.estimatedHours, 0)
    };
  }, [courses, tasks]);

  const completionRate = useMemo(() => {
    const totalLessons = courses.reduce((acc, course) => acc + course.lessonsCount, 0);
    const completedLessons = courses.reduce((acc, course) => 
      acc + Math.round((course.progress / 100) * course.lessonsCount), 0
    );
    
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  }, [courses]);

  const chartData = useMemo(() => {
    const completed = courses.filter(c => c.progress === 100).length;
    const inProgress = courses.filter(c => c.progress > 0 && c.progress < 100).length;
    const todo = courses.filter(c => c.progress === 0).length;

    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'In Progress', value: inProgress, color: '#f59e0b' },
      { name: 'To Do', value: todo, color: '#6b7280' },
    ];
  }, [courses]);

  const trendData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // For now, we'll use a simple calculation based on course creation
      // In a real app, you'd track lesson completion dates
      const completedCount = courses.filter(course => {
        const courseDate = course.createdAt?.toDate() || new Date();
        return courseDate.toISOString().split('T')[0] === dateStr && course.progress === 100;
      }).length;

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: completedCount,
        total: Math.max(completedCount, Math.floor(Math.random() * 3) + completedCount)
      });
    }
    return last7Days;
  }, [courses]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/60 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-white/60 rounded-2xl animate-pulse" />
            <div className="h-96 bg-white/60 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Learning Dashboard</h1>
          <p className="text-gray-600">Track your progress and achieve your goals</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Courses"
            value={kpi.totalCourses}
            icon={BookOpen}
            color="blue"
            subtitle="Active courses"
          />
          <StatCard
            title="Completed"
            value={kpi.completedCourses}
            icon={CheckCircle2}
            color="green"
            subtitle={`${Math.round(completionRate)}% completion rate`}
          />
          <StatCard
            title="In Progress"
            value={kpi.inProgressCourses}
            icon={Zap}
            color="purple"
            subtitle="Active learning"
          />
          <StatCard
            title="Overdue Tasks"
            value={kpi.overdueTasks}
            icon={Clock}
            trend={kpi.overdueTasks > 0 ? "Action needed" : "All clear!"}
            color="orange"
            subtitle="Tasks pending"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learning Trend Chart */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={24} />
                Learning Progress
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-200"></div>
                  <span className="text-gray-600">Total</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#cbd5e1" 
                    strokeWidth={2}
                    fill="url(#totalGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fill="url(#completedGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Progress Overview */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="text-green-500" size={24} />
              Progress Overview
            </h2>
            
            <div className="flex flex-col items-center mb-8">
              <ProgressRing progress={completionRate} color="#10b981" />
              <p className="text-gray-600 mt-3 text-center">
                Overall completion rate
              </p>
            </div>

            <div className="space-y-4">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Award className="text-green-600" size={20} />
                <span className="font-semibold text-green-800">Achievement</span>
              </div>
                <p className="text-sm text-green-700">
                  Great job! You&apos;ve completed {kpi.completedCourses} courses.
                </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="text-purple-500" size={24} />
            Recent Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 3).map((course) => (
              <div key={course.id} className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.progress === 100 ? 'bg-green-100 text-green-700' :
                    course.progress > 0 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {course.progress === 100 ? 'Completed' : 
                     course.progress > 0 ? 'In Progress' : 'To Do'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {course.category} • {course.difficulty}
                </p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
