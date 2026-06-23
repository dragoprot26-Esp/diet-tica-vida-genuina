/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, StoreConfig, AdminSession, Order, Diet } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Almendras Peladas Naturales',
    brand: 'Granola Real',
    category: 'Frutos Secos',
    price: 1500,
    stock: 25,
    minStockAlert: 8,
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6cd9?auto=format&fit=crop&q=80&w=400',
    weight: '500g',
    barCode: '779123456781',
    type: 'product',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Granola Premium con Miel y Castañas',
    brand: 'NutriSemillas',
    category: 'Cereales',
    price: 850,
    stock: 40,
    minStockAlert: 10,
    image: 'https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&q=80&w=400',
    weight: '1kg',
    barCode: '779123456782',
    type: 'product',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Semillas de Chía Orgánicas',
    brand: 'EcoAndes',
    category: 'Semillas',
    price: 480,
    stock: 4, // Triggers low stock notification since minStockAlert is 5
    minStockAlert: 5,
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=400',
    weight: '250g',
    barCode: '779123456783',
    type: 'product',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    name: 'Té Verde Matcha Ceremonial',
    brand: 'ZenTea',
    category: 'Infusiones',
    price: 2100,
    stock: 12,
    minStockAlert: 3,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400',
    weight: '100g',
    barCode: '779123456784',
    type: 'product',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    name: 'Harina de Almendras Finamente Molida',
    brand: 'NutriVeg',
    category: 'Harinas',
    price: 1230,
    stock: 15,
    minStockAlert: 6,
    image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=400',
    weight: '500g',
    barCode: '779123456785',
    type: 'product',
    customFields: [
      { label: 'Certificación', value: 'Sin TACC' },
      { label: 'Origen', value: 'Mendoza, Argentina' }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    name: 'Aceite de Coco Neutro Virgen',
    brand: 'IndoCoco',
    category: 'Aceites',
    price: 1800,
    stock: 3, // Low stock too
    minStockAlert: 5,
    image: 'https://images.unsplash.com/photo-1540324155974-7265d7cf671f?auto=format&fit=crop&q=80&w=400',
    liters: '500ml',
    barCode: '779123456786',
    type: 'offer',
    customFields: [{ label: 'Prensado en frío', value: 'Sí' }],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-7',
    name: 'Super Promoción: Pack 4x Barritas Proteicas de Frutos Rojos',
    brand: 'Fuerza Natural',
    category: 'Barritas',
    price: 1100,
    stock: 35,
    minStockAlert: 8,
    image: 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&q=80&w=400',
    weight: '180g',
    barCode: '779123456787',
    type: 'promotion',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-8',
    name: 'Galletas Integrales de Avena y Limón',
    brand: 'FibraPlat',
    category: 'Dulces',
    price: 320,
    stock: 22,
    minStockAlert: 5,
    image: 'https://images.unsplash.com/photo-1558961309-db0364436f59?auto=format&fit=crop&q=80&w=400',
    weight: '300g',
    barCode: '779123456788',
    type: 'product',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'RET-3829',
    customerName: 'María Eugenia Rossi',
    customerPhone: '+5491155554321',
    items: [
      { productId: 'prod-1', productName: 'Almendras Peladas Naturales', price: 1500, quantity: 2, weight: '500g' },
      { productId: 'prod-3', productName: 'Semillas de Chía Orgánicas', price: 480, quantity: 1, weight: '250g' }
    ],
    totalAmount: 3480,
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hours ago
  },
  {
    id: 'RET-5921',
    customerName: 'Juan Carlos Pereyra',
    customerPhone: '+5491122223333',
    items: [
      { productId: 'prod-2', productName: 'Granola Premium con Miel y Castañas', price: 850, quantity: 1, weight: '1kg' },
      { productId: 'prod-7', productName: 'Super Promoción: Pack 4x Barritas Proteicas de Frutos Rojos', price: 1100, quantity: 1, weight: '180g' }
    ],
    totalAmount: 1950,
    status: 'prepared',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString() // 8 hours ago
  },
  {
    id: 'RET-1090',
    customerName: 'Gisela Belén Domínguez',
    customerPhone: '+5493415559876',
    items: [
      { productId: 'prod-5', productName: 'Harina de Almendras Finamente Molida', price: 1230, quantity: 1, weight: '500g' },
      { productId: 'prod-6', productName: 'Aceite de Coco Neutro Virgen', price: 1800, quantity: 1, liters: '500ml' }
    ],
    totalAmount: 3030,
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // Yesterday
    completedAt: new Date(Date.now() - 3600000 * 23).toISOString(),
    completedBy: 'Admin A'
  }
];

export const INITIAL_CONFIG: StoreConfig = {
  name: 'Dietética Vida Genuina',
  logo: 'Leaf', // Icon key
  address: 'Av. Juan B. Justo 3450, Palermo, CABA, Argentina',
  phone: '+54 9 11 6543-2101',
  waPrefix: '+549',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.9750014022883!2d-58.43542472426095!3d-34.57948257321689!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5996bcffbff%3s0x95bcb599c2770a99%3A0xe54950fa3a99bb8e!2sAv.%20Juan%20B.%20Justo%2C%20Buenos%2520Aires!5e0!3m2!1ses-419!2sar!4v1700000000000!5m2!1ses-419!2sar',
  publicTheme: {
    primaryColor: '#2d3a2d', // Earthy deep forest/stone green
    accentColor: '#c49b66', // Warm organic gold sand
    bgColor: '#f4f0e6', // Warm organic linen stone
    fontFamily: 'Outfit'
  },
  adminTheme: {
    primaryColor: '#0f172a', // Slate 900
    accentColor: '#3b82f6', // Sapphire blue
    bgColor: '#f8fafc', // Slate 50
    fontFamily: 'Outfit'
  },
  selectedPreset: 'natura_stone'
};

export const INITIAL_DIETS: Diet[] = [
  {
    id: 'diet-1',
    title: 'Dieta de la Luna',
    description: 'Plan enfocado en la hidratación y desintoxicación celular aprovechando los cambios de fase lunar (principalmente durante la transición a Luna Llena o Luna Nueva).',
    duration: '26 horas continuas por fase',
    tips: [
      'Mantener un consumo exclusivo de líquidos naturales durante las 26 horas de cambio de fase lunar.',
      'Evitar azúcares procesados, alcohol, grasas y harinas refinadas por completo.',
      'Incorporar caldos vegetales colados caseros, infusiones herbales sin endulzar, té de rooibos y agua mineral de manantial.'
    ],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'diet-2',
    title: 'Dieta del Sol (Ritmo Circadiano)',
    description: 'Régimen de nutrición activa basado en las curvas del metabolismo circadiano, priorizando la ingesta proteica y de carbohidratos complejos en las horas de máxima radiación solar diurna.',
    duration: 'Tratamiento continuo regular',
    tips: [
      'Realizar un desayuno nutritivo completo rico en fibras y grasas saludables dentro de la primera hora del alba.',
      'Almorzar de forma balanceada entre las 12:00 y las 14:00 horas como comida principal.',
      'Cenar de forma extremadamente ligera preferentemente antes de que comience el crepúsculo vespertino para maximizar el descanso reparador.'
    ],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'diet-3',
    title: 'Dieta de la Noche (Metabolismo Lento)',
    description: 'Enfoque de asimilación lenta para optimizar la regeneración nocturna y equilibrar los índices glucémicos antes del sueño prolongado.',
    duration: '14 días de ajuste',
    tips: [
      'Priorizar proteínas de absorción gradual (por ejemplo, semillas cargadas de triptófano o quesos de semillas maduros).',
      'Ingerir infusiones tibias no estimulantes de melisa, lavanda o manzanilla media hora antes de acostarse.',
      'Suspender por completo el consumo de carbohidratos simples o azúcares de frutas después de las 19:30 horas.'
    ],
    active: true,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_SESSIONS: AdminSession[] = [
  {
    id: 'admin_a',
    name: 'Admin A (Sofía)',
    isLoggedIn: true,
    lastActive: new Date().toISOString(),
    deviceName: 'iPhone 15 Pro - Safari'
  },
  {
    id: 'admin_b',
    name: 'Admin B (Luciano)',
    isLoggedIn: true,
    lastActive: new Date().toISOString(),
    deviceName: 'Samsung Galaxy S24 - Chrome'
  }
];

export const AVAILABLE_FONTS = [
  { id: 'Inter', name: 'Inter (Sanc-serif Limpio)', cssValue: '"Inter", sans-serif' },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech Moderno)', cssValue: '"Space Grotesk", sans-serif' },
  { id: 'Playfair Display', name: 'Playfair Display (Serif Elegante)', cssValue: '"Playfair Display", serif' },
  { id: 'Outfit', name: 'Outfit (Geométrico Suave)', cssValue: '"Outfit", sans-serif' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono (Codigo Brutal)', cssValue: '"JetBrains Mono", monospace' }
];

export const CATEGORIES = [
  'Todos',
  'Frutos Secos',
  'Semillas',
  'Cereales',
  'Infusiones',
  'Harinas',
  'Aceites',
  'Barritas',
  'Dulces'
];
