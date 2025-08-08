'use client';
import { useEffect, useRef, useState } from 'react';

export default function Pomodoro(){
  const [sec, setSec] = useState<number>(()=> Number(localStorage.getItem('pomodoro')) || 25*60);
  const [run, setRun] = useState(false);
  const t = useRef<NodeJS.Timeout|undefined>(undefined);
  useEffect(()=>{ if(run){ t.current = setInterval(()=> setSec(s=>{ const n=s-1; localStorage.setItem('pomodoro', String(n)); return n>0?n:0; }), 1000); } return ()=>{ if(t.current) clearInterval(t.current); }; },[run]);
  const mm = String(Math.floor(sec/60)).padStart(2,'0');
  const ss = String(sec%60).padStart(2,'0');
  return (
    <div className="badge gap-2">
      <span>{mm}:{ss}</span>
      <button className="underline" onClick={()=>setRun(r=>!r)}>{run?'Pause':'Start'}</button>
      <button className="underline" onClick={()=>setSec(25*60)}>Reset</button>
    </div>
  );
}