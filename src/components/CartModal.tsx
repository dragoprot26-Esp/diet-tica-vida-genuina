/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, CheckCircle, Smartphone, Send } from 'lucide-react';
import { Product, OrderItem } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onOrderSubmission: (customerName: string, customerPhone: string) => void;
  primaryColor: string;
  waPrefix?: string;
}

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onOrderSubmission,
  primaryColor,
  waPrefix
}: CartModalProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [errorString, setErrorString] = useState('');

  // Pre-load WhatsApp default prefix on modal entrance
  useEffect(() => {
    if (isOpen && checkoutStep === 'details' && !customerPhone) {
      setCustomerPhone(waPrefix || '+549');
    }
  }, [isOpen, checkoutStep, waPrefix, customerPhone]);

  if (!isOpen) return null;

  const totalSum = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorString('');

    if (!customerName.trim()) {
      setErrorString('Por favor, ingresa tu nombre completo.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 8) {
      setErrorString('Por favor, ingresa un número de teléfono de contacto válido.');
      return;
    }

    onOrderSubmission(customerName.trim(), customerPhone.trim());
    // Reset form steps
    setCheckoutStep('cart');
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <div id="cart-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs p-0 md:p-4 animate-fade-in">
      <div id="cart-modal-container" className="h-full w-full max-w-md bg-white dark:bg-slate-900 md:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in-right">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {checkoutStep === 'cart' ? 'Tu Carrito Dietético' : 'Completar tu Encargo'}
            </h3>
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">
              {cartItems.length}
            </span>
          </div>
          <button
            id="close-cart-btn"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Step Body */}
        {checkoutStep === 'cart' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/40 rounded-full flex items-center justify-center text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white">El carrito está vacío</h4>
                  <p className="text-xs text-slate-400 mt-1">Explora nuestro catálogo e incorpora semillas, frutos secos y promociones de primera.</p>
                </div>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl"
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg bg-white"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                      {item.product.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {item.product.brand} {item.product.weight && `| ${item.product.weight}`} {item.product.liters && `| ${item.product.liters}`}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 font-mono">
                      ${item.product.price.toLocaleString('es-AR')} c/u
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      id={`remove-item-${item.product.id}`}
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                      title="Eliminar del carro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-200 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                        disabled={item.quantity >= item.product.stock}
                        title={item.quantity >= item.product.stock ? 'Límite de stock' : undefined}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form id="checkout-details-form" onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3.5 rounded-xl flex gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">¿Cómo funciona el pedido?</h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed mt-0.5">
                  Generamos un <b>Código de Retiro</b> para ti. Los administradores prepararán tu orden y te notificarán a tu teléfono para que pases a buscarlo por la tienda. ¡No requiere pagos en la web! Podrás abonar al retirar de nuestro local.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tu Nombre y Apellido *
                </label>
                <input
                  id="checkout-name-input"
                  type="text"
                  required
                  placeholder="Ej: Laura González"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-xl"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tu Número de WhatsApp *
                </label>
                <input
                  id="checkout-phone-input"
                  type="tel"
                  required
                  placeholder="Ej: +5491155554321"
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-xl"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <span className="text-[10px] text-slate-400 italic">
                  Ingresar con código de área (ej: +54911...) para notificaciones directas.
                </span>
              </div>
            </div>

            {errorString && (
              <p className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/25 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40">
                {errorString}
              </p>
            )}

            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Resumen del Pedido</h4>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="truncate max-w-[70%]">{item.product.name} (x{item.quantity})</span>
                    <span className="font-mono">${(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Footer actions area */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-xs font-medium text-slate-500">Total Acumulado</span>
            <span className="text-xl font-black text-slate-800 dark:text-white font-mono">
              ${totalSum.toLocaleString('es-AR')}
            </span>
          </div>

          {checkoutStep === 'cart' ? (
            <button
              id="confirm-checkout-btn"
              onClick={() => {
                if (cartItems.length > 0) setCheckoutStep('details');
              }}
              disabled={cartItems.length === 0}
              style={{ backgroundColor: primaryColor }}
              className="w-full text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:brightness-110 active:scale-95 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
            >
              <Smartphone className="w-5 h-5" />
              Encargar Pedido
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                id="back-to-cart-btn"
                onClick={() => setCheckoutStep('cart')}
                className="px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
              >
                Volver
              </button>
              <button
                id="submit-order-form-btn"
                form="checkout-details-form"
                type="submit"
                onClick={handleCheckoutSubmit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md hover:brightness-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
                Confirmar Código
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
