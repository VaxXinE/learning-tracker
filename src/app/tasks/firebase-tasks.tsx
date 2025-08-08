'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { TaskService, Task as FirebaseTask } from '@/lib/firebase/tasks';
import { Timestamp } from 'firebase/firestore';
import { Search, Plus, CheckCircle2, Circle, PlayCircle, Clock, Calendar, Tag, AlertCircle, MoreVertical, Filter, Trash2, Edit3, Timer, Play, Pause, RotateCcw, Zap, Target, TrendingUp, Award, Users, Flame } from 'lucide-react';

// Convert Firebase Task to local Task interface
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

interface TaskInput {
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  tags: string[];
}

// Helper function to convert Firestore timestamp to string
const timestampToString = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString().split('T')[0];
};

// Helper function to convert string to Firestore timestamp
const stringToTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString));
};

export default function FirebaseTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('dueDate');

  // Status columns configuration
  const statusColumns = [
    { 
      key: 'todo' as const, 
      title: 'To Do', 
      icon: Circle, 
      color: 'slate',
      bgColor: 'bg-slate-500/20',
      borderColor: 'border-slate-500/30'
    },
    { 
      key: 'in_progress' as const, 
      title: 'In Progress', 
      icon: PlayCircle, 
      color: 'amber',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30'
    },
    { 
      key: 'done' as const, 
      title: 'Done', 
      icon: CheckCircle2, 
      color: 'green',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30'
    }
  ];

  // Fetch tasks from Firebase
  useEffect(() => {
    if (!user) return;

    const unsubscribe = TaskService.subscribeToTasks(user.uid, (firebaseTasks) => {
      const convertedTasks = firebaseTasks.map(task => ({
        id: task.id!,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        tags: task.tags || [],
        dueDate: timestampToString(task.dueDate as Timestamp),
        estimatedTime: task.estimatedTime || 0,
        completedTime: 0,
        createdAt: task.createdAt ? timestampToString(task.createdAt as Timestamp) : new Date().toISOString().split('T')[0],
        assignee: user.email || 'User',
        subtasks: []
      }));
      
      setTasks(convertedTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
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

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    statusColumns.forEach(column => {
      grouped[column.key] = filteredTasks.filter(task => task.status === column.key);
    });
    return grouped;
  }, [filteredTasks]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main component render
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
              <span className="text-slate-300">Welcome, {user?.email}</span>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
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
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  

                  <div className="flex gap-2">
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
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
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </div>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {statusColumns.map(column => (
                <div
                  key={column.key}
                  className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <column.icon className={`w-5 h-5 text-${column.color}-400`} />
                      <h3 className="text-lg font-semibold text-white">{column.title}</h3>
                      <span className={`${column.bgColor} text-${column.color}-400 px-2 py-1 rounded-full text-xs font-medium ${column.borderColor} border`}>
                        {tasksByStatus[column.key]?.length || 0}
                      </span>
                    </div>
                  </div>
                  

                  <div className="space-y-4">
                    {tasksByStatus[column.key]?.map(task => (
                      <div key={task.id} className="bg-slate-700/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">{task.title}</h4>
                        <p className="text-sm text-slate-400 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-slate-400">{task.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Tasks</span>
                  <span className="font-bold">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed</span>
                  <span className="font-bold text-green-400">{tasks.filter(t => t.status === 'done').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">In Progress</span>
                  <span className="font-bold text-amber-400">{tasks.filter(t => t.status === 'in_progress').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
