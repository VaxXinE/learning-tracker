'use client';

import React, { useState, useMemo, useEffect, DragEvent, ChangeEvent } from 'react';
import { Search, Plus, CheckCircle2, Circle, PlayCircle, Clock, Calendar, Tag, AlertCircle, MoreVertical, Trash2, Edit3, Timer, Play, Pause, RotateCcw, Zap, Target, TrendingUp, Award, Users, Flame } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate: string;
  estimatedTime: number;
  completedTime: number;
  createdAt: string;
  assignee: string;
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

interface StatusColumn {
  key: 'todo' | 'in_progress' | 'done';
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface PriorityOption {
  value: 'low' | 'medium' | 'high';
  label: string;
  color: string;
}

interface NewTaskForm {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  estimatedTime: number;
  tags: string;
}

interface TaskCardProps {
  task: Task;
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  totalEstimatedTime: number;
  completedTime: number;
  productivity: number;
}

// Pomodoro Timer Component
const PomodoroTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [sessions, setSessions] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (!isBreak) {
        setSessions(sessions => sessions + 1);
        setTimeLeft(5 * 60); // 5 minute break
        setIsBreak(true);
      } else {
        setTimeLeft(25 * 60); // 25 minute work session
        setIsBreak(false);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = (): void => {
    setIsActive(!isActive);
  };

  const resetTimer = (): void => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className={`w-5 h-5 ${isBreak ? 'text-green-400' : 'text-red-400'}`} />
          <span className="font-semibold text-white">
            {isBreak ? 'Break Time' : 'Focus Time'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-400">
          <Flame className="w-4 h-4 text-orange-400" />
          <span>{sessions}</span>
        </div>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-white mb-2">
          {formatTime(timeLeft)}
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              isBreak ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
            }`}
            style={{ 
              width: `${((isBreak ? 5 * 60 : 25 * 60) - timeLeft) / (isBreak ? 5 * 60 : 25 * 60) * 100}%` 
            }}
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={toggleTimer}
          className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            isActive 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30' 
              : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
          }`}
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors border border-slate-600"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function EnhancedTasksUI(): React.ReactElement {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    estimatedTime: 60,
    tags: ''
  });

  // Memoize the statusColumns to prevent unnecessary recalculations
  const statusColumns = useMemo<StatusColumn[]>(() => [
    { 
      key: 'todo', 
      title: 'To Do', 
      icon: Circle, 
      color: 'slate',
      bgColor: 'bg-slate-500/20',
      borderColor: 'border-slate-500/30'
    },
    { 
      key: 'in_progress', 
      title: 'In Progress', 
      icon: PlayCircle, 
      color: 'amber',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30'
    },
    { 
      key: 'done', 
      title: 'Done', 
      icon: CheckCircle2, 
      color: 'green',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30'
    }
  ], []); // Empty dependency array ensures this is only computed once

  // Filter tasks based on selected criteria
  const filteredTasks = useMemo<Task[]>(() => {
    const filtered: Task[] = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || task.tags.includes(selectedTag);
      const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;
      const matchesStatus = selectedStatus === 'All' || task.status === selectedStatus;
      return matchesSearch && matchesTag && matchesPriority && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [tasks, searchQuery, selectedTag, selectedPriority, selectedStatus, sortBy]);

  const tasksByStatus = useMemo<Record<string, Task[]>>(() => {
    const grouped: Record<string, Task[]> = {};
    statusColumns.forEach(column => {
      grouped[column.key] = filteredTasks.filter(task => task.status === column.key);
    });
    return grouped;
  }, [filteredTasks, statusColumns]);

  const stats = useMemo<Stats>(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      const today = new Date();
      const dueDate = new Date(t.dueDate);
      return dueDate < today && t.status !== 'done';
    }).length;
    const totalEstimatedTime = tasks.reduce((acc, t) => acc + t.estimatedTime, 0);
    const completedTime = tasks.filter(t => t.status === 'done').reduce((acc, t) => acc + t.completedTime, 0);
    
    return {
      total,
      completed,
      inProgress,
      pending: total - completed - inProgress,
      overdue,
      totalEstimatedTime,
      completedTime,
      productivity: totalEstimatedTime > 0 ? Math.round((completedTime / totalEstimatedTime) * 100) : 0
    };
  }, [tasks]);

  const handleCreateTask = (): void => {
    if (!newTask.title.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority as 'low' | 'medium' | 'high',
      tags: newTask.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      dueDate: newTask.dueDate,
      estimatedTime: newTask.estimatedTime,
      completedTime: 0,
      createdAt: new Date().toISOString().split('T')[0],
      assignee: mockUser.name,
      subtasks: []
    };
    
    setTasks(prev => [task, ...prev]);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      estimatedTime: 60,
      tags: ''
    });
    setShowCreateModal(false);
  };

  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'in_progress' | 'done'): void => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const handleDeleteTask = (taskId: string): void => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, task: Task): void => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: 'todo' | 'in_progress' | 'done'): void => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      handleStatusChange(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    const daysUntilDue = getDaysUntilDue(task.dueDate);
    const isOverdue = daysUntilDue < 0 && task.status !== 'done';
    const isDueSoon = daysUntilDue <= 2 && daysUntilDue >= 0;
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    const progress = task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length) * 100 : 0;

    return (
      <div
        draggable
        onDragStart={(e: DragEvent<HTMLDivElement>) => handleDragStart(e, task)}
        className="group bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-move mb-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
              task.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              'bg-blue-500/20 text-blue-400 border-blue-500/30'
            }`}>
              {task.priority.toUpperCase()}
            </span>
            {isOverdue && (
              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                OVERDUE
              </span>
            )}
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700 rounded">
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-3">
          <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
            {task.title}
          </h3>
          <p className="text-slate-400 text-sm line-clamp-2">{task.description}</p>
        </div>

        {/* Subtasks Progress */}
        {task.subtasks.length > 0 && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400">Subtasks</span>
              <span className="text-xs text-slate-400">{completedSubtasks}/{task.subtasks.length}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(task.estimatedTime)}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className={
              isOverdue ? 'text-red-400' :
              isDueSoon ? 'text-amber-400' :
              'text-slate-400'
            }>
              {formatDate(task.dueDate)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {task.assignee}
          </div>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.map((tag: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <select
            value={task.status}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleStatusChange(task.id, e.target.value as 'todo' | 'in_progress' | 'done')}
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {statusColumns.map(status => (
              <option key={status.key} value={status.key}>{status.title}</option>
            ))}
          </select>
          <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteTask(task.id)}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Learning Tracker
              </h1>
              <div className="hidden md:flex items-center space-x-2 text-slate-400">
                <span>/</span>
                <Target className="w-4 h-4" />
                <span>Tasks</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-slate-300">Welcome, {mockUser.name}</span>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-semibold">
                {mockUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-8">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Tasks</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-white">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-red-500/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Overdue</p>
                    <p className="text-2xl font-bold text-white">{stats.overdue}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedPriority}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedPriority(e.target.value)}
                      className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Priority</option>
                      {priorityOptions.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
                      className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="title">Title</option>
                      <option value="createdAt">Created</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/25"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </div>
              </div>

              {/* Tag Filters */}
              {allTags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-slate-400 mr-2">Tags:</span>
                    <button
                      onClick={() => setSelectedTag('')}
                      className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                        selectedTag === '' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      All
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 flex items-center gap-1 ${
                          selectedTag === tag ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {statusColumns.map(column => (
                <div
                  key={column.key}
                  className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 min-h-[600px]"
                  onDragOver={handleDragOver}
                  onDrop={(e: DragEvent<HTMLDivElement>) => handleDrop(e, column.key)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <column.icon className={`w-5 h-5 text-${column.color}-400`} />
                      <h3 className="text-lg font-semibold text-white">{column.title}</h3>
                      <span className={`${column.bgColor} text-${column.color}-400 px-2 py-1 rounded-full text-xs font-medium ${column.borderColor} border`}>
                        {tasksByStatus[column.key]?.length || 0}
                      </span>
                    </div>
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {tasksByStatus[column.key]?.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    
                    {(!tasksByStatus[column.key] || tasksByStatus[column.key].length === 0) && (
                      <div className="text-center py-8 text-slate-400">
                        <column.icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No {column.title.toLowerCase()} tasks</p>
                        <p className="text-sm mt-1">Drag tasks here or create new ones</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Pomodoro Timer */}
            <PomodoroTimer />

            {/* Quick Stats */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Productivity
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Completion Rate</span>
                    <span className="text-sm font-semibold text-white">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Time Efficiency</span>
                    <span className="text-sm font-semibold text-white">{stats.productivity}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.productivity}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{formatTime(stats.completedTime)}</p>
                    <p className="text-xs text-slate-400">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{formatTime(stats.totalEstimatedTime)}</p>
                    <p className="text-xs text-slate-400">Total Estimated</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Achievements
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">On Fire!</p>
                    <p className="text-xs text-slate-400">5 tasks completed this week</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Quick Learner</p>
                    <p className="text-xs text-slate-400">Completed 3 high priority tasks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Task</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Time (minutes)</label>
                <input
                  type="number"
                  value={newTask.estimatedTime}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTask({...newTask, estimatedTime: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTask.tags}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTask({...newTask, tags: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="react, learning, frontend"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateTask}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg text-white font-semibold transition-all duration-200"
              >
                Create Task
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
