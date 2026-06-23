/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, BookOpen, Clock, Check } from 'lucide-react';
import { Diet } from '../types';

interface DietDetailModalProps {
  diet: Diet | null;
  isOpen: boolean;
  onClose: () => void;
  primaryColor: string;
}

export default function DietDetailModal({
  diet,
  isOpen,
  onClose,
  primaryColor
}: DietDetailModalProps) {
  if (!isOpen || !diet) return null;

  // Track finished steps checklist locally for extra interactive feel!
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div id="diet-detail-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-fade-in font-sans">
      <div id="diet-detail-card" className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header Block with primary brand color */}
        <div 
          className="p-6 text-white relative flex items-center gap-3 shrink-0" 
          style={{ backgroundColor: primaryColor }}
        >
          <div className="bg-white/20 p-2.5 rounded-full shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-white/15 text-white/90 px-2 py-0.5 rounded">
              Planificación Saludable
            </span>
            <h3 className="text-base font-extrabold text-white mt-1 leading-tight truncate">{diet.title}</h3>
          </div>

          <button
            id="close-diet-modal-btn"
            onClick={onClose}
            className="rounded-full bg-white/20 hover:bg-white/30 p-2 text-white transition-all shadow-xs cursor-pointer focus:outline-hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Duration info */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">Duración Recomendada:</span>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-250">
              {diet.duration}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Sobre la Dieta</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold italic">
              "{diet.description}"
            </p>
          </div>

          {/* Guidelines Steps (checklist) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Pautas y Recomendaciones</h4>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {Object.values(completedSteps).filter(Boolean).length} / {diet.tips.length} completados
              </span>
            </div>

            <div className="space-y-2">
              {diet.tips.map((step, idx) => {
                const isDone = !!completedSteps[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-start gap-3 cursor-pointer select-none ${
                      isDone 
                        ? 'bg-emerald-50/45 dark:bg-emerald-950/20 border-emerald-200 text-emerald-950 dark:text-emerald-205 line-through opacity-75' 
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-150 hover:border-slate-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isDone 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'border-slate-300 bg-white dark:bg-slate-900 group-hover:border-slate-400'
                    }`}>
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="leading-tight font-medium text-slate-800 dark:text-slate-200">{step}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-normal pt-2 font-medium">
            💡 <em>Todos los súper alimentos, harinas, frutos secos y semillas recomendados en estas dietas están disponibles en nuestro catálogo. ¡Arma tu carrito y encárgalos hoy mismo!</em>
          </p>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-xs transition-colors animate-pulse"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
