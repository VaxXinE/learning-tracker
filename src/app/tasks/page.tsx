// src/app/tasks/page.tsx  (atau lokasi file kamu)
'use client';

import React, { useState, useEffect, useMemo, DragEvent, ChangeEvent } from 'react';
import {
  CheckCircle2, Circle, PlayCircle, Clock, Calendar, AlertCircle, Trash2,
  Timer, Play, RotateCcw, Zap, Target, TrendingUp, Award, Flame,
} from 'lucide-react';
import { TaskService } from '@/lib/firebase/tasks';
import { useAuth } from '@/components/AuthProvider';
import { Timestamp } from 'firebase/firestore';

/* ================= UI helpers (tema-aware) ================= */

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-xl 
         bg-white/80 dark:bg-slate-800/50 
         border border-white/20 dark:border-slate-700/50 
         shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

/* ================= Types ================= */

type Status = 'todo' | 'in_progress' | 'done';
type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string; // kita normalkan agar selalu string
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: Timestamp;
  tags: string[];
  estimatedTime: number;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface TaskInput {
  title: string;
  description: string;
  priority: Priority;
  dueDate: Date;
  estimatedTime: number;
  tags: string; // comma separated
}

interface StatusColumn {
  key: Status;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  countPillClass: string; // kelas tailwind statis (hindari string dinamis yang tak ter-trace)
}

/* Payload aman untuk createTask */
type NewTaskPayload = {
  title: string;
  description: string;
  priority: Priority;
  dueDate: Date;
  estimatedTime: number;
  tags: string[];
};

// Tipe task dari service (id opsional, tags unknown)
type ServiceTask = Omit<Task, 'id' | 'tags'> & { id?: string; tags?: unknown };

// Normalisasi task agar sesuai interface lokal Task
function normalizeTask(t: ServiceTask): Task {
  return {
    ...(t as Omit<Task, 'id' | 'tags'>),
    id: t.id ?? (globalThis.crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    tags: Array.isArray(t.tags) ? (t.tags as string[]) : t.tags ? [String(t.tags)] : [],
  };
}

/* ================= Pomodoro ================= */

const PomodoroTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [sessions, setSessions] = useState<number>(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (!isBreak) {
        setSessions((s) => s + 1);
        setTimeLeft(5 * 60);
        setIsBreak(true);
      } else {
        setTimeLeft(25 * 60);
        setIsBreak(false);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = (): void => setIsActive((v) => !v);
  const resetTimer = (): void => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };
  const formatTime = (seconds: number): string =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60)
      .toString()
      .padStart(2, '0')}`;

  return (
    <GlassCard>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Timer
              className={`w-5 h-5 ${
                isBreak ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            />
            <span className="font-semibold text-slate-900 dark:text-white">
              {isBreak ? 'Break Time' : 'Focus Time'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
            <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <span>{sessions}</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {formatTime(timeLeft)}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                isBreak ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
              style={{
                width: `${
                  (((isBreak ? 300 : 1500) - timeLeft) / (isBreak ? 300 : 1500)) * 100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleTimer}
            className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isActive
                ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-300 dark:border-red-500/30'
                : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200 dark:bg-green-500/20 dark:hover:bg-green-500/30 dark:text-green-300 dark:border-green-500/30'
            }`}
          >
            <Play className="w-4 h-4" />
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="px-4 py-2 rounded-xl transition-colors border bg-slate-100 border-slate-200 hover:bg-slate-200
                       text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

/* ================= Page ================= */

export default function EnhancedTasksUI(): React.ReactElement {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery] = useState<string>('');
  const [selectedPriority] = useState<'All' | Priority>('All');
  const [selectedStatus] = useState<'All' | Status>('All');
  const [sortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('dueDate');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const [newTask, setNewTask] = useState<TaskInput>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: new Date(),
    estimatedTime: 60,
    tags: '',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // FIX TS2345: jangan beri anotasi tipe param di callback; biarkan infer dari service.
    // Normalisasi id (jika undefined) dan tags agar memenuhi interface Task lokal (id: string).
    const unsubscribe = TaskService.subscribeToTasks(user.uid, (incoming) => {
      const normalized: Task[] = (incoming ?? [])
        .filter(Boolean)
        .map((t) => normalizeTask(t as ServiceTask));

      setTasks(normalized);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateTask = async () => {
    if (!user || !newTask.title.trim()) return;
    try {
      const payload: NewTaskPayload = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        estimatedTime: newTask.estimatedTime,
        tags: newTask.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      };
      await TaskService.createTask(payload as unknown as NewTaskPayload, user.uid);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: new Date(),
        estimatedTime: 60,
        tags: '',
      });
    } catch (err) {
      console.error('Task creation error:', err);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Status) => {
    if (!user) return;
    await TaskService.updateTask(taskId, { status: newStatus });
  };
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    await TaskService.deleteTask(taskId);
  };
  const handleDragStart = (_e: DragEvent<HTMLDivElement>, task: Task) => setDraggedTask(task);
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: Status) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) handleStatusChange(draggedTask.id, newStatus);
    setDraggedTask(null);
  };

  const formatDate = (timestamp: Timestamp) =>
    timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const getDaysUntilDue = (timestamp: Timestamp) => {
    const today = new Date();
    const due = timestamp.toDate();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filteredTasks = useMemo(() => {
    if (!user) return [];
    let filtered = tasks;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }
    if (selectedPriority !== 'All') filtered = filtered.filter((t) => t.priority === selectedPriority);
    if (selectedStatus !== 'All') filtered = filtered.filter((t) => t.status === selectedStatus);

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return a.dueDate.toMillis() - b.dueDate.toMillis();
        case 'priority': {
          const order: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
          return order[b.priority] - order[a.priority];
        }
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
        default:
          return a.createdAt.toMillis() - b.createdAt.toMillis();
      }
    });
  }, [tasks, searchQuery, selectedPriority, selectedStatus, sortBy, user]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<Status, Task[]> = { todo: [], in_progress: [], done: [] };
    filteredTasks.forEach((t) => {
      grouped[t.status].push(t);
    });
    return grouped;
  }, [filteredTasks]);

  const stats = useMemo(() => {
    if (!user || tasks.length === 0)
      return { total: 0, completed: 0, inProgress: 0, overdue: 0 };
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter((t) => t.dueDate.toMillis() < Date.now() && t.status !== 'done').length;
    return { total, completed, inProgress, overdue };
  }, [tasks, user]);

  const statusColumns: StatusColumn[] = [
    {
      key: 'todo',
      title: 'To Do',
      icon: Circle,
      iconClass: 'text-slate-600 dark:text-slate-400',
      countPillClass: 'bg-slate-500/20 border border-slate-500/30 text-slate-700 dark:text-slate-400',
    },
    {
      key: 'in_progress',
      title: 'In Progress',
      icon: PlayCircle,
      iconClass: 'text-amber-600 dark:text-amber-400',
      countPillClass: 'bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400',
    },
    {
      key: 'done',
      title: 'Done',
      icon: CheckCircle2,
      iconClass: 'text-green-600 dark:text-green-400',
      countPillClass: 'bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-400',
    },
  ];

  const priorityOptions: Array<{ value: Priority; label: string }> = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  /* ================= Loading (full-bleed) ================= */
  if (loading) {
    return (
      <div
        className="
        min-h-[100svh] md:min-h-dvh w-full overflow-x-hidden px-3 sm:px-4 md:px-6 py-4 sm:py-6
        bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
        dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
      "
      >
        <div className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[1600px] space-y-6 animate-pulse">
          <GlassCard>
            <div className="h-12" />
          </GlassCard>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <GlassCard key={i}>
                <div className="h-24" />
              </GlassCard>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <GlassCard key={i}>
                <div className="h-96" />
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================= Render (full-bleed & responsif) ================= */
  return (
    <div
      className="
        min-h-[100svh] md:min-h-dvh w-full overflow-x-hidden
        px-3 sm:px-4 md:px-6 py-4 sm:py-6
        bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
        dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
        text-slate-900 dark:text-white
      "
    >
      <div className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[1600px]">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* LEFT */}
          <div className="xl:col-span-3 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassCard>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Total Tasks</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Overdue</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.overdue}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </GlassCard>
            </div>

            {/* Boards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {statusColumns.map((column) => (
                <GlassCard key={column.key} className="h-[60svh] md:h-[65svh] flex flex-col">
                  <div
                    className="p-6 h-full flex flex-col"
                    onDragOver={handleDragOver}
                    onDrop={(e: DragEvent<HTMLDivElement>) => handleDrop(e, column.key)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <column.icon className={`w-5 h-5 ${column.iconClass}`} />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {column.title}
                        </h3>
                        <span
                          className={`${column.countPillClass} px-2 py-1 rounded-full text-xs font-medium`}
                        >
                          {tasksByStatus[column.key]?.length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
                      {tasksByStatus[column.key]?.map((task) => (
                        <GlassCard
                          key={task.id}
                          className="border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300/60 dark:hover:border-blue-500/50 transition-all duration-300 cursor-move"
                        >
                          <div
                            draggable
                            onDragStart={(e: DragEvent<HTMLDivElement>) => handleDragStart(e, task)}
                            className="p-4 group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                                    task.priority === 'high'
                                      ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'
                                      : task.priority === 'medium'
                                      ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                                      : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                                  }`}
                                >
                                  {task.priority.toUpperCase()}
                                </span>
                                {getDaysUntilDue(task.dueDate) < 0 && task.status !== 'done' && (
                                  <span
                                    className="px-2 py-1 rounded-lg text-xs font-medium
                                                   bg-red-100 text-red-700 border border-red-200
                                                   dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30 animate-pulse"
                                  >
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded
                                           hover:bg-slate-100 dark:hover:bg-slate-700"
                                aria-label="Delete task"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>

                            <div className="mb-3">
                              <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {task.title}
                              </h3>
                              <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
                                {task.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(task.estimatedTime)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span
                                  className={
                                    getDaysUntilDue(task.dueDate) < 0
                                      ? 'text-red-600 dark:text-red-400'
                                      : getDaysUntilDue(task.dueDate) <= 2
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : ''
                                  }
                                >
                                  {formatDate(task.dueDate)}
                                </span>
                              </div>
                            </div>

                            {task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {task.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200 text-xs rounded-md"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <select
                                value={task.status}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                  handleStatusChange(task.id, e.target.value as Status)
                                }
                                className="flex-1 px-3 py-2 rounded-lg text-sm
                                           bg-white/70 border border-slate-300 text-slate-900
                                           focus:outline-none focus:ring-2 focus:ring-blue-500
                                           dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Change task status"
                              >
                                {statusColumns.map((status) => (
                                  <option key={status.key} value={status.key}>
                                    {status.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </GlassCard>
                      ))}

                      {(!tasksByStatus[column.key] || tasksByStatus[column.key].length === 0) && (
                        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                          <column.icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No {column.title.toLowerCase()} tasks</p>
                          <p className="text-sm mt-1">Drag tasks here or create new ones</p>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="xl:col-span-1 space-y-6 xl:sticky xl:top-4 self-start">
            {/* Create Task Panel */}
            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create Task</h3>

                {user ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg
                                   bg-white/70 border border-slate-300 text-slate-900
                                   placeholder-slate-500
                                   focus:outline-none focus:ring-2 focus:ring-blue-500
                                   dark:bg-slate-900/50 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                        value={newTask.title}
                        onChange={(e) => setNewTask((v) => ({ ...v, title: e.target.value }))}
                        placeholder="e.g. Finish IBM Capstone video"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Description</label>
                      <textarea
                        className="w-full px-3 py-2 rounded-lg
                                   bg-white/70 border border-slate-300 text-slate-900
                                   focus:outline-none focus:ring-2 focus:ring-blue-500
                                   dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                        rows={3}
                        value={newTask.description}
                        onChange={(e) => setNewTask((v) => ({ ...v, description: e.target.value }))}
                        placeholder="Optional details…"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 rounded-lg
                                     bg-white/70 border border-slate-300 text-slate-900
                                     focus:outline-none focus:ring-2 focus:ring-blue-500
                                     dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                          value={newTask.dueDate.toISOString().split('T')[0]}
                          onChange={(e) => setNewTask((v) => ({ ...v, dueDate: new Date(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                        <select
                          className="w-full px-3 py-2 rounded-lg
                                     bg-white/70 border border-slate-300 text-slate-900
                                     focus:outline-none focus:ring-2 focus:ring-blue-500
                                     dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                          value={newTask.priority}
                          onChange={(e) =>
                            setNewTask((v) => ({ ...v, priority: e.target.value as Priority }))
                          }
                        >
                          {priorityOptions.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
                          Est. (min)
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="w-full px-3 py-2 rounded-lg
                                     bg-white/70 border border-slate-300 text-slate-900
                                     focus:outline-none focus:ring-2 focus:ring-blue-500
                                     dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                          value={newTask.estimatedTime}
                          onChange={(e) =>
                            setNewTask((v) => ({
                              ...v,
                              estimatedTime: parseInt(e.target.value || '60', 10),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
                        Tags (comma separated)
                      </label>
                      <input
                        className="w-full px-3 py-2 rounded-lg
                                   bg-white/70 border border-slate-300 text-slate-900
                                   focus:outline-none focus:ring-2 focus:ring-blue-500
                                   dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                        value={newTask.tags}
                        onChange={(e) => setNewTask((v) => ({ ...v, tags: e.target.value }))}
                        placeholder="ibm, course, ui"
                      />
                    </div>

                    <button
                      onClick={handleCreateTask}
                      disabled={!newTask.title.trim()}
                      className="w-full py-2 rounded-xl font-semibold
                                 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                                 text-white disabled:opacity-50"
                    >
                      Add Task
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Please login to add tasks.</p>
                )}
              </div>
            </GlassCard>

            <PomodoroTimer />

            {/* Productivity */}
            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Productivity
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.completed}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Total Tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Achievements */}
            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Achievements
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-slate-700/30">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">On Fire!</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Keep going!</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-slate-700/30">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Quick Learner</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Stay productive!</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
          {/* /RIGHT */}
        </div>
      </div>
    </div>
  );
}
