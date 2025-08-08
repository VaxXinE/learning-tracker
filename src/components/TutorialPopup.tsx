'use client';
import { useState, useEffect } from 'react';

const steps = [
  {
    title: 'Welcome to Learning Tracker 🎯',
    content: 'Di sini kamu bisa mengatur course, lessons, dan tasks dalam satu tempat.'
  },
  {
    title: 'Dashboard',
    content: 'Lihat ringkasan progress belajar dan grafik perkembangan kamu di dashboard.'
  },
  {
    title: 'Courses & Lessons',
    content: 'Tambahkan course, lalu buat lessons di dalamnya. Tandai statusnya sesuai progress.'
  },
  {
    title: 'Tasks (Kanban)',
    content: 'Gunakan papan Kanban untuk mengatur todo list dan deadline kamu.'
  }
];

export default function TutorialPopup() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('tutorial_seen');
    if (!seen) {
      setVisible(true);
    }
  }, []);

  function nextStep() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('tutorial_seen', 'true');
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-xl max-w-md w-full text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">{steps[step].title}</h2>
        <p className="text-zinc-300 mb-4">{steps[step].content}</p>
        <div className="flex justify-end gap-2">
          <button
            className="btn bg-zinc-700 hover:bg-zinc-600"
            onClick={() => {
              localStorage.setItem('tutorial_seen', 'true');
              setVisible(false);
            }}
          >
            Skip
          </button>
          <button
            className="btn bg-blue-600 hover:bg-blue-500"
            onClick={nextStep}
          >
            {step === steps.length - 1 ? 'Got it!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
