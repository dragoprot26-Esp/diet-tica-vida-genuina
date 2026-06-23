/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  isFeatured?: boolean;
}

export interface CustomField {
  label: string;
  value: string;
}

export type ProductType = 'product' | 'promotion' | 'offer';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  minStockAlert: number;
  image: string; // url or Base64
  expirationDate?: string; // YYYY-MM-DD
  weight?: string; // e.g. "500g"
  liters?: string; // e.g. "1L"
  barCode?: string; // barcode or QR key
  type: ProductType;
  customFields?: CustomField[];
  createdAt: string;
}

export type OrderStatus = 'pending' | 'prepared' | 'completed';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  weight?: string;
  liters?: string;
}

export interface Order {
  id: string; // Pickup code, e.g., RET-8293
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
  completedBy?: 'Admin A' | 'Admin B';
}

export interface AdminSession {
  id: 'admin_a' | 'admin_b';
  name: string;
  isLoggedIn: boolean;
  lastActive: string;
  deviceName: string;
}

export interface ThemeConfig {
  primaryColor: string; // Tailwind tint color representation or hex
  accentColor: string;
  bgColor: string;
  fontFamily: 'Inter' | 'Space Grotesk' | 'Playfair Display' | 'JetBrains Mono' | 'Outfit';
}

export interface Diet {
  id: string;
  title: string;
  description: string;
  duration: string;
  tips: string[];
  active: boolean;
  createdAt: string;
}

export interface StoreConfig {
  name: string;
  logo: string; // Base64 or icon name
  address: string;
  phone: string;
  waPrefix?: string; // e.g. "+549" primary country code prefix
  mapEmbedUrl: string; // Custom location or link
  publicTheme: ThemeConfig;
  adminTheme: ThemeConfig;
  selectedPreset?: 'natura_stone' | 'bento_grid' | 'vibrant_palette';
}
