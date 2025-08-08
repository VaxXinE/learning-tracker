'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { LessonService, Lesson } from '@/lib/firebase/lessons';
import { CourseService } from '@/lib/firebase/courses';
import { Plus, Search, Trash2, Clock } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  // Add other properties for the course as needed
}

export default function LessonsPage() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]); // Memperbaiki tipe untuk courses
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    courseId: '',
    status: 'todo' as const,
    priority: 'medium' as const,
    type: 'reading' as const,
    estimatedTime: 30,
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [lessonsData, coursesData] = await Promise.all([
          LessonService.getLessons(user.uid),
          CourseService.getCourses(user.uid)
        ]);
        
        setLessons(lessonsData);
        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribe = LessonService.subscribeToLessons(user.uid, setLessons);
    return unsubscribe;
  }, [user]);

  const filteredLessons = lessons.filter(lesson => 
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateLesson = async () => {
    if (!user || !newLesson.title.trim()) return;

    try {
      await LessonService.createLesson(newLesson, user.uid);
      setShowCreateModal(false);
      setNewLesson({
        title: '',
        description: '',
        courseId: '',
        status: 'todo',
        priority: 'medium',
        type: 'reading',
        estimatedTime: 30,
        dueDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating lesson:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!user) return;
    
    try {
      await LessonService.deleteLesson(lessonId);
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Lessons
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lesson
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map(lesson => (
            <div key={lesson.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white mb-1">{lesson.title}</h3>
                  <p className="text-slate-400 text-sm">{lesson.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteLesson(lesson.id!)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{lesson.estimatedTime}m</span>
              </div>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  lesson.status === 'done' ? 'bg-green-500' :
                  lesson.status === 'in_progress' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}>
                  {lesson.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredLessons.length === 0 && !loading && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No lessons found</h3>
            <p className="text-slate-400 mb-4">
              {searchQuery ? 'No lessons match your search.' : 'Get started by creating your first lesson.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
              >
                Create First Lesson
              </button>
            )}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Create New Lesson</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 rounded-lg"
                    placeholder="Lesson title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 rounded-lg"
                    rows={3}
                    placeholder="Lesson description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estimated Time (minutes)</label>
                  <input
                    type="number"
                    value={newLesson.estimatedTime}
                    onChange={(e) => setNewLesson({...newLesson, estimatedTime: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newLesson.dueDate}
                    onChange={(e) => setNewLesson({...newLesson, dueDate: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateLesson}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
