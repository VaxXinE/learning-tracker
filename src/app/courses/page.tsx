'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Trash2, Edit3, Eye, Calendar, Clock, Star, Filter } from 'lucide-react';
import { Course, CourseService } from '@/lib/firebase/courses';
import { useAuth } from '@/components/AuthProvider';

export default function EnhancedCoursesUI() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'Frontend',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    estimatedHours: 0
  });

  const { user } = useAuth();

  const categories = ['All', 'Frontend', 'Backend', 'Design', 'DevOps', 'Mobile'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    if (!user) return;

    const unsubscribe = CourseService.subscribeToCourses(user.uid, (updatedCourses) => {
      setCourses(updatedCourses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredAndSortedCourses = React.useMemo(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          return b.progress - a.progress;
        case 'recent':
          return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
        default:
          return 0;
      }
    });
  }, [courses, searchQuery, selectedCategory, sortBy]);

  const handleCreateCourse = async () => {
    if (!user || !newCourse.title.trim()) return;

    try {
      await CourseService.createCourse(newCourse, user.uid);
      setNewCourse({ title: '', description: '', category: 'Frontend', difficulty: 'Beginner', estimatedHours: 0 });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!user) return;

    try {
      await CourseService.deleteCourse(courseId);
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    const colorMap = {
      Beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      Intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      Advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colorMap[difficulty as keyof typeof colorMap] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      Frontend: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Backend: 'bg-green-500/20 text-green-400 border-green-500/30',
      Design: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      DevOps: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      Mobile: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-slate-300">Loading courses...</p>
        </div>
      </div>
    );
  }

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
                <BookOpen className="w-4 h-4" />
                <span>Courses</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-slate-300">Welcome, {user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-semibold">
                {(user?.displayName || user?.email?.split('@')[0])?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Courses</p>
                <p className="text-2xl font-bold text-white">{courses.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">{courses.filter(c => c.progress === 100).length}</p>
              </div>
              <Star className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-white">{courses.filter(c => c.progress > 0 && c.progress < 100).length}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-white">{courses.reduce((acc, c) => acc + c.estimatedHours, 0)}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">Recent</option>
                  <option value="title">Title</option>
                  <option value="progress">Progress</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {viewMode === 'grid' ? 'List' : 'Grid'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/25"
              >
                <Plus className="w-4 h-4" />
                Create Course
              </button>
            </div>
          </div>
        </div>

        {/* Courses Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCourses.map((course) => (
              <div
                key={course.id}
                className="group bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Course Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {course.title}
                      </h3>
                      {course.featured && (
                        <Star className="w-4 h-4 text-amber-400 fill-current" />
                      )}
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">{course.description}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex gap-2 mb-4">
                  <span className={`px-2 py-1 text-xs rounded-lg border ${getCategoryColor(course.category)}`}>
                    {course.category}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-lg border ${getDifficultyColor(course.difficulty)}`}>
                    {course.difficulty}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Progress</span>
                    <span className="text-sm font-semibold text-white">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="text-slate-400">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    {course.lessonsCount} lessons
                  </div>
                  <div className="text-slate-400">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {course.estimatedHours}h total
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors font-medium">
                    <Eye className="w-4 h-4 inline mr-1" />
                    View
                  </button>
                  <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCourse(course.id!)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="text-left p-6 text-slate-300 font-semibold">Course</th>
                    <th className="text-left p-6 text-slate-300 font-semibold">Category</th>
                    <th className="text-left p-6 text-slate-300 font-semibold">Progress</th>
                    <th className="text-left p-6 text-slate-300 font-semibold">Lessons</th>
                    <th className="text-center p-6 text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCourses.map((course) => (
                    <tr key={course.id} className="border-b border-slate-700/50 hover:bg-slate-700/25 transition-colors">
                      <td className="p-6">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{course.title}</h3>
                            {course.featured && <Star className="w-4 h-4 text-amber-400 fill-current" />}
                          </div>
                          <p className="text-slate-400 text-sm mt-1">{course.description}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded-lg border ${getCategoryColor(course.category)}`}>
                            {course.category}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-lg border ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-white">{course.progress}%</span>
                        </div>
                      </td>
                      <td className="p-6 text-slate-300">{course.lessonsCount}</td>
                      <td className="p-6">
                        <div className="flex justify-center gap-2">
                          <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm">
                            View
                          </button>
                          <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(course.id!)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredAndSortedCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No courses found</h3>
            <p className="text-slate-400 mb-4">
              {searchQuery || selectedCategory !== 'All' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first course'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-all duration-200 font-semibold"
            >
              Create Your First Course
            </button>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Create New Course</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter course title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter course description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                  <select
                    value={newCourse.difficulty}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' }))}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {difficulties.map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Hours</label>
                <input
                  type="number"
                  value={newCourse.estimatedHours}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={!newCourse.title.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-semibold"
              >
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
