/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShoppingCart, Info, Sparkles, Tag, Check } from 'lucide-react';
import { Product } from '../types';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  primaryColor: string;
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  primaryColor
}: QuickViewModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div id="quick-view-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div id="quick-view-card" className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        
        {/* Close Button */}
        <button
          id="close-quickview-btn"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-all shadow-md"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Left Column: Image Area */}
          <div className="relative aspect-square md:w-1/2 w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <img
              referrerPolicy="no-referrer"
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {product.type === 'promotion' && (
              <span className="absolute left-3 top-3 bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wider flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> Promoción
              </span>
            )}
            {product.type === 'offer' && (
              <span className="absolute left-3 top-3 bg-amber-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wider flex items-center gap-1 shadow-sm animate-bounce">
                <Tag className="w-3 h-3" /> Oferta Especial
              </span>
            )}
            {product.stock <= product.minStockAlert && (
              <span className="absolute right-3 top-3 bg-rose-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                Últimas unidades
              </span>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="p-6 md:w-1/2 w-full flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.category}
              </span>

              <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white leading-tight">
                {product.name}
              </h3>
              
              <p className="text-xs text-slate-500 font-medium">
                Marca: <span className="text-slate-700 dark:text-slate-300">{product.brand}</span>
              </p>

              {/* Physical details: weight / liters / expiry */}
              <div className="mt-3 flex flex-wrap gap-2">
                {product.weight && (
                  <span className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded font-mono">
                    Peso: {product.weight}
                  </span>
                )}
                {product.liters && (
                  <span className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded font-mono">
                    Medida: {product.liters}
                  </span>
                )}
                {product.expirationDate && (
                  <span className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] px-2 py-1 rounded">
                    Vence: {product.expirationDate}
                  </span>
                )}
              </div>

              {/* Optional Custom Attributes */}
              {product.customFields && product.customFields.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  {product.customFields.map((field, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded">
                      <span className="text-slate-500 font-medium">{field.label}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{field.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-4 text-xs font-mono text-slate-400">
                Cód: {product.barCode || '779000000000'}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs text-slate-500 font-medium">Suma Total</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  ${product.price.toLocaleString('es-AR')}
                </span>
              </div>

              <button
                id="add-to-cart-quickview-btn"
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                disabled={product.stock <= 0}
                style={{ backgroundColor: primaryColor }}
                className="w-full text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed hover:opacity-90"
              >
                {product.stock <= 0 ? (
                  'Sin Stock Disponible'
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Añadir al Carrito
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
