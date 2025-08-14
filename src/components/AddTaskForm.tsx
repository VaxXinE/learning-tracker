'use client';

import { useState } from 'react';
import type { TaskInput } from '@/lib/firebase/tasks';
import { TaskService } from '@/lib/firebase/tasks';

interface AddTaskFormProps {
  userId: string;
  onDone?: () => void; // opsional: dipakai untuk menutup modal
}

export default function AddTaskForm({ userId, onDone }: AddTaskFormProps) {
  const [form, setForm] = useState<TaskInput>({
    title: '',
    description: '',
    dueDate: new Date(),
    priority: 'medium',
    estimatedTime: 60,
    tags: [],
  });
  const [tagsText, setTagsText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);
    try {
      const input: TaskInput = {
        ...form,
        tags: tagsText
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
      };
      await TaskService.createTask(input, userId);

      // reset
      setForm({
        title: '',
        description: '',
        dueDate: new Date(),
        priority: 'medium',
        estimatedTime: 60,
        tags: [],
      });
      setTagsText('');
      onDone?.();
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-300 mb-1">Title *</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
          value={form.title}
          onChange={(e) => setForm(v => ({ ...v, title: e.target.value }))}
          required
          placeholder="e.g. Finish IBM Capstone video"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
          rows={3}
          value={form.description}
          onChange={(e) => setForm(v => ({ ...v, description: e.target.value }))}
          placeholder="Optional details…"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Due Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            value={form.dueDate.toISOString().split('T')[0]}
            onChange={(e) => setForm(v => ({ ...v, dueDate: new Date(e.target.value) }))}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Priority</label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            value={form.priority}
            onChange={(e) => setForm(v => ({ ...v, priority: e.target.value as any }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Estimated (min)</label>
          <input
            type="number"
            min={1}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            value={form.estimatedTime}
            onChange={(e) => setForm(v => ({ ...v, estimatedTime: parseInt(e.target.value || '60', 10) }))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Tags (comma separated)</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="ibm, course, ui"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? 'Adding…' : 'Add Task'}
      </button>
    </form>
  );
}
