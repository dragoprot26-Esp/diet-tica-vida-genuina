/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, ShieldCheck, Mail, MapPin, 
  Share2, ArrowRight, Eye, Sparkles, Tag, 
  ChevronRight, Compass, LogIn, Send, CheckCircle, Leaf, Lock, Bell, X, BookOpen, Search, RefreshCw
} from 'lucide-react';
import { Product, StoreConfig, AdminSession, Order, OrderItem, Diet, Category } from './types';
import {
  INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CONFIG,
  INITIAL_SESSIONS, INITIAL_DIETS, AVAILABLE_FONTS, CATEGORIES,
  DEFAULT_HERO_LINES, HERO_SIZE_CSS
} from './data/initialData';
import QuickViewModal from './components/QuickViewModal';
import CartModal from './components/CartModal';
import AdminPortal from './components/AdminPortal';
import DietDetailModal from './components/DietDetailModal';
import { checkLicense, verifyCollaborator, asegurarCuentaSeguraDueno } from './lib/supabase';
import { cloudLoad, cloudSave, vidaPublica, vidaAgregarPedido, signOut as cloudSignOut } from './lib/cloud';
import * as bio from './lib/biometric';

export default function App() {
  // Global States persisted directly in LocalStorage
  const [products, setProducts] = useState<Product[]>(() => {
    const raw = localStorage.getItem('diet_products');
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const raw = localStorage.getItem('diet_orders');
    return raw ? JSON.parse(raw) : INITIAL_ORDERS;
  });

  const [config, setConfig] = useState<StoreConfig>(() => {
    const raw = localStorage.getItem('diet_config');
    return raw ? JSON.parse(raw) : INITIAL_CONFIG;
  });

  const [sessions, setSessions] = useState<AdminSession[]>(() => {
    const raw = localStorage.getItem('diet_sessions');
    return raw ? JSON.parse(raw) : INITIAL_SESSIONS;
  });

  const [diets, setDiets] = useState<Diet[]>(() => {
    const raw = localStorage.getItem('diet_diets');
    return raw ? JSON.parse(raw) : INITIAL_DIETS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const raw = localStorage.getItem('diet_categories_obj');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }

    const legacyRaw = localStorage.getItem('diet_categories');
    if (legacyRaw) {
      try {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed)) {
          if (typeof parsed[0] === 'string') {
            const iconsMap: Record<string, string> = {
              'Todos': '🌍',
              'Frutos Secos': '🥜',
              'Cereales': '🌾',
              'Semillas': '🌱',
              'Infusiones': '🍵',
              'Harinas': '🍞',
              'Aceites': '🥥',
              'Barritas': '🍫',
              'Dulces': '🍭'
            };
            return parsed.map((c: string) => ({
              id: c.toLowerCase().replace(/\s+/g, '-'),
              name: c,
              icon: iconsMap[c] || '📦',
              active: true
            }));
          } else {
            return parsed; // already objects
          }
        }
      } catch (e) {}
    }

    const defaultIcons: Record<string, string> = {
      'Todos': '🌍',
      'Frutos Secos': '🥜',
      'Cereales': '🌾',
      'Semillas': '🌱',
      'Infusiones': '🍵',
      'Harinas': '🍞',
      'Aceites': '🥥',
      'Barritas': '🍫',
      'Dulces': '🍭'
    };
    return CATEGORIES.map((c) => ({
      id: c.toLowerCase().replace(/\s+/g, '-'),
      name: c,
      icon: defaultIcons[c] || '📦',
      active: true
    }));
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [currentAdmin, setCurrentAdmin] = useState<'admin_a' | 'admin_b'>('admin_a');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  // Public Client States
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductQuickView, setSelectedProductQuickView] = useState<Product | null>(null);
  const [selectedDiet, setSelectedDiet] = useState<Diet | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Order completed notification modal content
  const [latestGeneratedPickupCode, setLatestGeneratedPickupCode] = useState<string | null>(null);

  // Administrative entry forms
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [licenseCode, setLicenseCode] = useState(() => localStorage.getItem('diet_license') || '');
  const [isLicenseInputOpen, setIsLicenseInputOpen] = useState(true);

  // Sync con la nube (molde del ecosistema)
  const [collaborators, setCollaborators] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('diet_collaborators') || '[]'); } catch (e) { return []; }
  });
  const [cloudCode, setCloudCode] = useState<string>('');   // código del local para sincronizar
  const [isPublicView, setIsPublicView] = useState(false);  // true si entró un cliente por ?codigo=
  const [selectedLoginRole, setSelectedLoginRole] = useState<'admin' | 'collaborator'>('admin');
  const [bioAvail, setBioAvail] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioCheck, setBioCheck] = useState(false);
  useEffect(() => { bio.bioSupported().then(setBioAvail); setBioOn(bio.bioEnabled()); }, []);
  const [isLoginChecking, setIsLoginChecking] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Contact Form Footer States
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);

  // Persist state updates inside local storage
  useEffect(() => {
    localStorage.setItem('diet_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('diet_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('diet_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('diet_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('diet_diets', JSON.stringify(diets));
  }, [diets]);

  useEffect(() => {
    localStorage.setItem('diet_categories_obj', JSON.stringify(categories));
    localStorage.setItem('diet_categories', JSON.stringify(categories.map(c => c.name)));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('diet_collaborators', JSON.stringify(collaborators));
  }, [collaborators]);

  // ── Vidriera pública: si la URL trae ?codigo=VIDA-..., cargar ese local
  //    desde la nube (lectura segura por vida_publica, sin tocar tablas).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('codigo') || params.get('local') || '').trim().toUpperCase();
    if (!code) return;
    setIsPublicView(true);
    setCloudCode(code);
    (async () => {
      const data = await vidaPublica(code);
      if (data) {
        if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
        if (Array.isArray(data.products)) setProducts(data.products);
        if (Array.isArray(data.diets)) setDiets(data.diets);
        if (Array.isArray(data.categories) && data.categories.length) setCategories(data.categories);
      }
    })();
  }, []);

  // ── Guardado en la nube (solo admin logueado): debounce + traer-antes-de-guardar
  //    para no pisar pedidos que entraron desde la vidriera del cliente.
  useEffect(() => {
    if (!isAdminLoggedIn || !cloudCode || isPublicView) return;
    const t = setTimeout(async () => {
      const remote = await cloudLoad(cloudCode);
      const remoteOrders = (remote && Array.isArray(remote.orders)) ? remote.orders : [];
      const localIds = new Set(orders.map(o => o.id));
      const nuevos = remoteOrders.filter((o: any) => o && o.id && !localIds.has(o.id));
      const mergedOrders = nuevos.length ? [...nuevos, ...orders] : orders;
      if (nuevos.length) setOrders(mergedOrders);
      await cloudSave(cloudCode, { config, products, orders: mergedOrders, diets, categories, collaborators });
    }, 1200);
    return () => clearTimeout(t);
  }, [products, orders, config, diets, categories, collaborators, isAdminLoggedIn, cloudCode, isPublicView]);

  // Aviso sonoro + notificación del navegador cuando entra un pedido nuevo.
  const avisarNuevoPedido = (n: number) => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = 880; g.gain.value = 0.12;
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { /* noop */ }
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 Nuevo pedido', { body: `Tenés ${n} pedido(s) nuevo(s) en tu tienda.` });
      }
    } catch (e) { /* noop */ }
  };

  // ── Campanita: cada 15s traer pedidos nuevos de la nube, así los dos admins
  //    (dueño y colaborador) ven los encargos sin recargar, con aviso sonoro.
  useEffect(() => {
    if (!isAdminLoggedIn || !cloudCode || isPublicView) return;
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) { /* noop */ }
    }
    const iv = setInterval(async () => {
      const remote = await cloudLoad(cloudCode);
      if (!remote || !Array.isArray(remote.orders)) return;
      setOrders(prev => {
        const ids = new Set(prev.map(o => o.id));
        const nuevos = (remote.orders as any[]).filter((o: any) => o && o.id && !ids.has(o.id));
        if (nuevos.length) avisarNuevoPedido(nuevos.length);
        return nuevos.length ? [...nuevos, ...prev] : prev;
      });
    }, 15000);
    return () => clearInterval(iv);
  }, [isAdminLoggedIn, cloudCode, isPublicView]);

  // Security Session listener: If someone forces session termination
  const currentSessionObj = sessions.find(s => s.id === currentAdmin);
  const isSessionTerminatedByPartner = currentSessionObj ? !currentSessionObj.isLoggedIn : false;

  useEffect(() => {
    if (isAdminLoggedIn && isSessionTerminatedByPartner) {
      // Force exit and display security warning
      setIsAdminLoggedIn(false);
      alert(`⚠️ ALERTA DE SEGURIDAD: Su sesión para "${currentAdmin === 'admin_a' ? 'Admin A (Sofía)' : 'Admin B (Luciano)'}" fue cerrada remotamente por su colega desde otra terminal por detectarse pérdida o peligro del terminal móvil.`);
    }
  }, [sessions, currentAdmin, isAdminLoggedIn, isSessionTerminatedByPartner]);

  // Cart operations helpers
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        // Enforce stock boundaries
        if (existing.quantity >= product.stock) {
          alert('¡Límite de stock máximo alcanzado para este producto dietético!');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          const next = item.quantity + delta;
          if (next <= 0) return item;
          // check stock limit
          const inStock = products.find(p => p.id === productId)?.stock || 0;
          if (next > inStock) {
            alert('Límite de stock en mostrador superado.');
            return item;
          }
          return { ...item, quantity: next };
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Submit purchase order and decrement stock
  const handleOrderSubmission = (customerName: string, customerPhone: string) => {
    const generatedCode = `RET-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      weight: item.product.weight,
      liters: item.product.liters
    }));

    const newOrder: Order = {
      id: generatedCode,
      customerName,
      customerPhone,
      items: orderItems,
      totalAmount: cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Add order to list
    setOrders([newOrder, ...orders]);

    // Registrar el pedido en la nube del local (alta pública segura por RPC),
    // así le aparece a los dos admins con su código de retiro.
    if (cloudCode) { vidaAgregarPedido(cloudCode, newOrder); }

    // Clear shopping cart
    setCart([]);
    setIsCartOpen(false);

    // Save generated code to alert the client immediately
    setLatestGeneratedPickupCode(generatedCode);
  };

  // Admin login handling with license selection + Supabase auth compatibility
  const handleAdminFormLogin = async (
    e: React.FormEvent | null,
    override?: { codigo: string; usuario: string; password: string; role: 'admin' | 'collaborator' }
  ) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoginChecking(true);

    const valLicense = (override?.codigo ?? licenseCode).trim().toUpperCase();
    const rol = override?.role ?? selectedLoginRole;
    const uname = override?.usuario ?? loginForm.username;
    const pass = override?.password ?? loginForm.password;

    // La licencia es obligatoria (sin modo prueba): igual que las demás apps.
    if (!valLicense) {
      setLoginError('Ingresá tu código de licencia para entrar.');
      setIsLoginChecking(false);
      return;
    }

    if (!valLicense.startsWith('VIDA')) {
      setLoginError('El código de licencia debe comenzar con "VIDA" (ej: VIDA-0001-2026-XXXX)');
      setIsLoginChecking(false);
      return;
    }

    try {
      const lic = await checkLicense(valLicense);
      if (!lic) {
        setLoginError('Licencia inválida, inactiva o vencida.');
        setIsLoginChecking(false);
        return;
      }

      // Apply the store name dynamically from license metadata
      const storeName = lic.nombre_negocio || lic.cliente_nombre || 'Dietética Vida Genuina';
      setConfig(prev => ({
        ...prev,
        name: storeName
      }));
      localStorage.setItem('diet_license', valLicense);

      if (rol === 'admin') {
        const adminUser = uname.trim() || 'Admin';
        const res = await asegurarCuentaSeguraDueno(adminUser, pass, valLicense);
        if (!res.ok) {
          setLoginError(res.msg || 'Usuario o contraseña de administrador incorrectos.');
          setIsLoginChecking(false);
          return;
        }

        // Successfully logged in admin
        const requestedId = 'admin_a'; // Map to default admin profile
        const updated = sessions.map(s => {
          if (s.id === requestedId) {
            return { 
              ...s, 
              name: adminUser,
              isLoggedIn: true, 
              lastActive: new Date().toISOString() 
            };
          }
          return s;
        });

        setSessions(updated);
        setCurrentAdmin(requestedId);
        setIsAdminLoggedIn(true);
        setIsLoginModalOpen(false);
        setLoginForm({ username: 'admin_a', password: '' });
      } else {
        // Collaborator check
        const collabUser = uname.trim();
        const collab = await verifyCollaborator(valLicense, collabUser, pass);
        if (!collab) {
          setLoginError('Ingreso de Colaborador incorrecto bajo esta licencia o aún no habilitado.');
          setIsLoginChecking(false);
          return;
        }

        // Successfully logged in collaborator
        const requestedId = 'admin_b'; // Map to collaborator/assisting profile
        const updated = sessions.map(s => {
          if (s.id === requestedId) {
            return { 
              ...s, 
              name: collab.name || collabUser,
              isLoggedIn: true, 
              lastActive: new Date().toISOString() 
            };
          }
          return s;
        });

        setSessions(updated);
        setCurrentAdmin(requestedId);
        setIsAdminLoggedIn(true);
        setIsLoginModalOpen(false);
        setLoginForm({ username: 'admin_a', password: '' });
      }

      // Registrar huella en este equipo si el usuario lo tildó (login manual exitoso)
      if (!override && bioCheck && bioAvail) {
        try { await bio.bioEnable({ codigo: valLicense, usuario: uname.trim(), password: pass, role: rol }); setBioOn(true); }
        catch (e) { /* si la huella falla, igual entró */ }
      }

      // Hidratar desde la nube: traer los datos de ESTE local (del dueño/colaborador).
      setCloudCode(valLicense);
      const cd = await cloudLoad(valLicense);
      if (cd && ((Array.isArray(cd.products) && cd.products.length) || cd.config || (Array.isArray(cd.orders) && cd.orders.length) || (Array.isArray(cd.diets) && cd.diets.length))) {
        if (cd.config) setConfig(prev => ({ ...prev, ...cd.config }));
        if (Array.isArray(cd.products)) setProducts(cd.products);
        if (Array.isArray(cd.orders)) setOrders(cd.orders);
        if (Array.isArray(cd.diets)) setDiets(cd.diets);
        if (Array.isArray(cd.categories) && cd.categories.length) setCategories(cd.categories);
        if (Array.isArray(cd.collaborators)) setCollaborators(cd.collaborators);
      } else {
        // Primera vez: sembrar la nube con lo que haya cargado localmente.
        await cloudSave(valLicense, { config, products, orders, diets, categories, collaborators });
      }
    } catch (err: any) {
      console.error(err);
      setLoginError('Error de red/conexión. Verifique su internet o configuración.');
    } finally {
      setIsLoginChecking(false);
    }
  };

  // Ingreso con huella / Face ID: recupera credenciales y reusa el login completo
  const handleBioLogin = async () => {
    setLoginError('');
    let creds;
    try { creds = await bio.bioLogin(); }
    catch (e) { setLoginError('Huella cancelada o no disponible en este dispositivo.'); return; }
    if (!creds) { setLoginError('No se pudo leer la huella. Entrá con tus datos.'); return; }
    await handleAdminFormLogin(null, creds);
  };

  // Contact footer submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) return;

    setIsContactSubmitted(true);
    setTimeout(() => {
      setIsContactSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 4000);
  };

  // Share Page trigger
  const handleSharePage = (method: 'whatsapp' | 'email') => {
    const publicUrl = cloudCode ? `${window.location.origin}/?codigo=${cloudCode}` : window.location.href;
    const text = `¡Hola! Te recomiendo visitar la tienda dietética "${config.name}". Tienen semillas orgánicas, frutos secos, harinas sin gluten y promociones geniales para comer sano. Entrá y hacé tu pedido por la web: ${publicUrl}`;
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`mailto:?subject=Dietética Saludable ${config.name}&body=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // Dynamic Theme configuration Injection
  const activeTheme = isAdminLoggedIn ? config.adminTheme : config.publicTheme;
  const appliedFontObj = AVAILABLE_FONTS.find(f => f.id === activeTheme.fontFamily);
  const fontCssValue = appliedFontObj ? appliedFontObj.cssValue : '"Inter", sans-serif';

  // Products filtering for catalog display
  const filteredProducts = products.filter(p => {
    const pCatObj = categories.find(c => c.name === p.category);
    const isCatActive = pCatObj ? pCatObj.active : true;
    if (!isCatActive) return false;

    const matchCategory = activeCategory === 'Todos' || p.category === activeCategory;
    const isStandardProduct = p.type === 'product'; // Cards in main grid show normal catalog items
    
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && isStandardProduct && matchesSearch;
  });

  // Extract new additions, promo packs and offers for left column/spotlight
  const newsAndPromos = products.filter(p => p.type === 'promotion' || p.type === 'offer');

  return (
    <div id="app-viewport-root" className="min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white" style={{ backgroundColor: activeTheme.bgColor }}>
      
      {/* Injecting CSS Custom Variables dynamically on style header */}
      <style>{`
        :root {
          --theme-primary: ${activeTheme.primaryColor};
          --theme-accent: ${activeTheme.accentColor};
          --theme-bg: ${activeTheme.bgColor};
        }
        body {
          font-family: ${fontCssValue} !important;
          background-color: ${activeTheme.bgColor};
          color: ${config.selectedPreset === 'natura_stone' || !config.selectedPreset ? '#2F3E3F' : 'inherit'};
        }
        
        /* 1. NATURA STONE STYLE PRESET DEFINITIONS */
        ${(config.selectedPreset === 'natura_stone' || !config.selectedPreset) ? `
          .preset-card-shape {
            border-radius: 24px !important;
            border: 1px solid #E8E4DB !important;
            box-shadow: 0 4px 12px rgba(130, 148, 123, 0.08) !important;
            background-color: #ffffff !important;
            transition: all 0.3s ease;
          }
          .preset-card-shape:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(130, 148, 123, 0.14) !important;
            border-color: #82947B !important;
          }
          .preset-serif-title {
            font-family: 'Playfair Display', 'Georgia', serif !important;
            font-style: italic !important;
          }
          .preset-badge {
            background-color: #D68C7A !important;
            color: #ffffff !important;
          }
          .preset-bg-section {
            background-color: #F9F7F2 !important;
          }
          .preset-header-bg {
            background-color: #ffffff !important;
            border-color: #E8E4DB !important;
          }
          .preset-btn-primary {
            background-color: #82947B !important;
            color: #ffffff !important;
          }
          .preset-accent-text {
            color: #82947B !important;
          }
        ` : config.selectedPreset === 'bento_grid' ? `
          /* 2. BENTO GRID LAYOUT PRESET DEFINITIONS */
          .preset-card-shape {
            border-radius: 12px !important;
            border: 2px solid #181c24 !important;
            box-shadow: 4px 4px 0px 0px #181c24 !important;
            background-color: #ffffff !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .preset-card-shape:hover {
            transform: translate(-3px, -3px);
            box-shadow: 7px 7px 0px 0px #181c24 !important;
          }
          .preset-serif-title {
            font-family: 'Space Grotesk', sans-serif !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: -0.04em !important;
          }
          .preset-badge {
            background-color: #10b981 !important;
            color: #ffffff !important;
          }
          .preset-bg-section {
            background-color: #fafafa !important;
          }
          .preset-header-bg {
            background-color: #ffffff !important;
            border-color: #181c24 !important;
            border-bottom-width: 2px !important;
          }
          .preset-btn-primary {
            background-color: #181c24 !important;
            color: #ffffff !important;
          }
          .preset-accent-text {
            color: #10b981 !important;
          }
        ` : `
          /* 3. VIBRANT PALETTE PRESET DEFINITIONS */
          .preset-card-shape {
            border-radius: 18px !important;
            border: 1px solid #f3e8ff !important;
            box-shadow: 0 4px 20px rgba(124, 58, 237, 0.07) !important;
            background-color: #ffffff !important;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .preset-card-shape:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 28px rgba(124, 58, 237, 0.18) !important;
            border-color: #c084fc !important;
          }
          .preset-serif-title {
            font-family: 'Inter', sans-serif !important;
            font-weight: 800 !important;
            letter-spacing: -0.03em !important;
            background: linear-gradient(135deg, #7c3aed, #ec4899) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
          }
          .preset-badge {
            background-color: #ef4444 !important;
            color: #ffffff !important;
          }
          .preset-bg-section {
            background-color: #faf5ff !important;
          }
          .preset-header-bg {
            background-color: #ffffff !important;
            border-color: #f3e8ff !important;
          }
          .preset-btn-primary {
            background-color: #7c3aed !important;
            color: #ffffff !important;
          }
          .preset-accent-text {
            color: #7c3aed !important;
          }
        `}
      `}</style>

      {isAdminLoggedIn && !isPreviewMode ? (
        /* ==================== ACTIVE ADMIN VIEW ==================== */
        <AdminPortal
          products={products}
          orders={orders}
          config={config}
          sessions={sessions}
          currentAdmin={currentAdmin}
          diets={diets}
          onUpdateProducts={setProducts}
          onUpdateOrders={setOrders}
          onUpdateConfig={setConfig}
          onUpdateSessions={setSessions}
          onSwitchAdmin={setCurrentAdmin}
          onLogout={() => { cloudSignOut(); setIsAdminLoggedIn(false); setCloudCode(''); }}
          onTogglePreview={() => setIsPreviewMode(true)}
          onUpdateDiets={setDiets}
          categories={categories}
          onUpdateCategories={setCategories}
          collaborators={collaborators}
          onUpdateCollaborators={setCollaborators}
          publicCode={cloudCode}
        />
      ) : (
        /* ==================== PUBLIC END USER VIEW ==================== */
        <div id="public-ecommerce-frame" className="flex flex-col min-h-screen">
          
          {isAdminLoggedIn && isPreviewMode && (
            <div className="bg-slate-900 border-b border-emerald-500/30 text-white text-[11px] px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
              <div className="flex items-center gap-2">
                <span className="relative flex h-20 w-2 shrink-0 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>👋 <strong>Vista Espejo Activa:</strong> Estás previsualizando la tienda activa tal como la ven tus compradores.</span>
              </div>
              <button
                onClick={() => setIsPreviewMode(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] uppercase font-bold px-3 py-1 rounded shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" /> Regresar al Panel
              </button>
            </div>
          )}
          
          {/* Main Top Header */}
          <header className="sticky top-0 z-30 shadow-xs backdrop-blur-md border-b bg-white/90 border-slate-100 preset-header-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
              
              {/* Left: Brand Identity Logo */}
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white p-1"
                  style={{ backgroundColor: config.publicTheme.primaryColor }}
                >
                  {config.logo.startsWith('http') || config.logo.startsWith('data:') ? (
                    <img referrerPolicy="no-referrer" src={config.logo} alt="logo" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <Leaf className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h1 
                    className="text-sm sm:text-lg font-black tracking-tight leading-none"
                    style={{ color: config.publicTheme.primaryColor }}
                  >
                    {config.name}
                  </h1>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Productos Dietéticos de Selección</span>
                </div>
              </div>

              {/* Middle: Live Counter Cart Trigger */}
              <div className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-150 p-1.5 rounded-2xl">
                <button
                  id="open-top-cart-btn"
                  onClick={() => setIsCartOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-emerald-500/15 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Mi Pedido ({cart.reduce((s,i)=>s+i.quantity, 0)})</span>
                  <span className="font-mono bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-md">
                    ${cart.reduce((s,i) => s + i.product.price * i.quantity, 0).toLocaleString()}
                  </span>
                </button>
              </div>

              {/* Right: Login trigger for admins */}
              <div className="flex items-center gap-2">
                {/* Mobile Cart counter */}
                <button
                  id="mobile-cart-trigger"
                  onClick={() => setIsCartOpen(true)}
                  className="md:hidden relative p-2.5 bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                      {cart.reduce((s,i)=>s+i.quantity, 0)}
                    </span>
                  )}
                </button>

                <button
                  id="open-login-btn"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                  style={{ fontFamily: config.publicTheme.fontFamily }}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Ingreso Admin</span>
                </button>
              </div>

            </div>
          </header>

          {/* Hero Banner / Introduction */}
          <section className="bg-gradient-to-br from-emerald-50/70 via-white to-[#f0f8f0] py-12 px-4 shadow-inner border-b border-emerald-50 preset-bg-section">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              {(config.heroLines && config.heroLines.length ? config.heroLines : DEFAULT_HERO_LINES).map((ln, i) => {
                if (!ln || !ln.text) return null;
                const fontObj = AVAILABLE_FONTS.find(f => f.id === ln.font);
                const style: React.CSSProperties = {
                  fontFamily: fontObj ? fontObj.cssValue : undefined,
                  fontSize: HERO_SIZE_CSS[ln.size] || undefined
                };
                if (i === 0) {
                  return (
                    <span key={i} className="bg-emerald-100/70 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-250 uppercase tracking-widest inline-block preset-badge" style={style}>
                      {ln.text}
                    </span>
                  );
                }
                if (i === 1) {
                  return (
                    <h2 key={i} className="font-extrabold tracking-tight preset-serif-title" style={{ ...style, color: config.publicTheme.primaryColor }}>
                      {ln.text}
                    </h2>
                  );
                }
                return (
                  <p key={i} className="text-slate-600 max-w-xl mx-auto leading-relaxed" style={style}>
                    {ln.text}
                  </p>
                );
              })}
            </div>
          </section>

          {/* Interactive Catalog and Spotlight grid */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col lg:flex-row gap-8">
            
            {/* Catalog Area (Left/Main section) */}
            <section className="flex-1 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/45 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-xs">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5 preset-serif-title">
                    <Compass className="w-5 h-5 preset-accent-text" /> Catálogo Interactivo
                  </h3>
                  <p className="text-xs text-slate-500">Filtrá por categorías o escribí lo que buscás en tiempo real.</p>
                </div>

                {/* Elegant Search Bar */}
                <div className="relative w-full md:w-72">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscá granolas, harinas, frutos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent cursor-pointer"
                      title="Limpiar búsqueda"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
                {categories.filter(cat => cat.active).map((cat) => (
                  <button
                    id={`filter-cat-${cat.id}`}
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`text-xs px-3.5 py-2.5 rounded-xl transition-all font-semibold cursor-pointer flex items-center gap-1.5 ${
                      activeCategory === cat.name
                        ? 'text-white font-bold shadow-xs border-0'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                    style={activeCategory === cat.name ? { backgroundColor: config.publicTheme.primaryColor } : {}}
                  >
                    {cat.icon && <span className="text-sm">{cat.icon}</span>}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Products Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-white/30 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-sm font-semibold">
                      {searchQuery 
                        ? `No encontramos productos que coincidan con "${searchQuery}"`
                        : `No encontramos productos en la categoría "${activeCategory}"`
                      }
                    </p>
                    <button 
                      onClick={() => {
                        setActiveCategory('Todos');
                        setSearchQuery('');
                      }}
                      className="text-xs text-emerald-600 font-bold underline mt-2 block mx-auto cursor-pointer border-0 bg-transparent"
                    >
                      Restablecer todos los filtros y búsqueda
                    </button>
                  </div>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const isOutOfStock = p.stock <= 0;
                    const isBentoPreset = config.selectedPreset === 'bento_grid';
                    // In bento grid layout, let's highlight specific index items with custom structures
                    const isWide = isBentoPreset && (idx % 3 === 0);

                    // We can also render custom static tiles right inside the grid to make it look like a fully fledged Bento Board!
                    // E.g. at index === 2 we can show a nice "Delivery gratis en Palermo" tile
                    // E.g. at index === 5 we can show a "Encontranos en Av. Juan B. Justo..." map/embed quick link tile
                    const showInfoTileA = isBentoPreset && idx === 2;
                    const showInfoTileB = isBentoPreset && idx === 5;

                    return (
                      <React.Fragment key={p.id}>
                        {showInfoTileA && (
                          <div id="bento-tile-delivery" className="col-span-1 p-5 rounded-3xl bg-emerald-950 text-white flex flex-col justify-between border border-emerald-900/60 shadow-xs relative overflow-hidden min-h-[260px]">
                            {/* Decorative background circle */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 -translate-y-8" />
                            
                            <div className="relative">
                              <span className="bg-emerald-800 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">Envío Veloz</span>
                              <h4 className="text-sm font-black mt-2 leading-tight">ENTREGA SIN CARGO EN ZONA PALERMO</h4>
                              <p className="text-[11px] text-emerald-200/80 mt-1 leading-normal">
                                Realizá tu pedido por la web. Retirá gratis por Av. Juan B. Justo o consultá tarifas de envío súper económicas aledañas.
                              </p>
                            </div>

                            <div className="relative pt-3 border-t border-emerald-900 flex items-center justify-between text-[11px] font-mono font-bold text-emerald-300">
                              <span>MÍNIMO: $1.000</span>
                              <span>💬 WhatsApp Directo</span>
                            </div>
                          </div>
                        )}

                        {showInfoTileB && (
                          <div id="bento-tile-organic" className="col-span-1 sm:col-span-2 p-5 rounded-3xl bg-slate-950 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-900 shadow-xs relative overflow-hidden min-h-[140px]">
                            {/* Decorative graphic background lines */}
                            <div className="absolute inset-0 bg-radial from-slate-800 to-transparent opacity-50 pointer-events-none" />
                            
                            <div className="relative flex-1 text-left">
                              <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-amber-500/20">Ingredientes Reales</span>
                              <h4 className="text-sm font-black mt-2 leading-tight">MÁXIMA CALIDAD GARANTIZADA</h4>
                              <p className="text-[11px] text-slate-300 mt-1 leading-normal max-w-sm">
                                Seleccionamos minuciosamente a los productores agroecológicos nacionales. Frutos secos frescos de estación, semillas orgánicas sin conservantes ni químicos.
                              </p>
                            </div>

                            <div className="relative shrink-0 bg-slate-900 p-3 rounded-2xl flex flex-col items-center gap-0.5 border border-slate-800 min-w-[120px]">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Línea de Pedidos</span>
                              <span className="text-xs font-black text-amber-300">{config.phone}</span>
                            </div>
                          </div>
                        )}

                        <div
                          className={`overflow-hidden flex flex-col justify-between p-5 relative group preset-card-shape ${
                            isWide 
                              ? 'sm:col-span-2 sm:flex-row sm:items-center gap-6' 
                              : 'col-span-1'
                          }`}
                        >
                          {/* Out of Stock stamp */}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex items-center justify-center rounded-3xl">
                              <span className="bg-rose-100/90 text-rose-800 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-rose-250">
                                SIN STOCK MOMENTÁNEO
                              </span>
                            </div>
                          )}

                          <div className={isWide ? 'flex-1 flex flex-col sm:flex-row gap-5 items-center' : 'w-full'}>
                            {/* Image Container */}
                            <div className={`aspect-square rounded-2xl bg-slate-50 overflow-hidden relative shrink-0 ${
                              isWide ? 'w-full sm:w-36' : 'w-full mb-4'
                            }`}>
                              <img
                                referrerPolicy="no-referrer"
                                src={p.image}
                                alt={p.name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {p.stock <= p.minStockAlert && p.stock > 0 && (
                                <span className="absolute left-2.5 top-2.5 bg-rose-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-md whitespace-nowrap shadow-xs">
                                  ¡ÚLTIMAS UNIDADES!
                                </span>
                              )}
                            </div>

                            <div className="flex-1 text-left">
                              {/* Classification category */}
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 mt-2 sm:mt-0">
                                <span>{p.category}</span>
                                <span>{p.brand}</span>
                              </div>

                              {/* Name & sizing */}
                              <h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-2 leading-tight min-h-[36px]">
                                {p.name}
                              </h4>
                              
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {p.weight ? `Cont. Neto: ${p.weight}` : p.liters ? `Medida: ${p.liters}` : 'Venta suelta'}
                              </p>

                              {isWide && (
                                <span className="inline-block mt-2 bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                                  ⭐ Producto Seleccionado de la Semana
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Cost & action triggers */}
                          <div className={`pt-3.5 border-t border-slate-100 flex items-center justify-between ${
                            isWide ? 'sm:border-t-0 sm:pt-0 sm:flex-col sm:justify-center sm:items-end gap-2 shrink-0' : 'mt-4'
                          }`}>
                            <div className="text-left">
                              {isWide && <span className="text-[9px] text-slate-400 block uppercase font-bold leading-none">Precio Especial</span>}
                              <span className="text-base font-black font-mono text-slate-900">
                                ${p.price.toLocaleString('es-AR')}
                              </span>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                id={`quickview-btn-${p.id}`}
                                onClick={() => setSelectedProductQuickView(p)}
                                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                                title="Detalle del producto"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                id={`add-cart-btn-${p.id}`}
                                onClick={() => handleAddToCart(p)}
                                style={{ backgroundColor: config.publicTheme.primaryColor }}
                                className="px-3.5 py-2.5 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
                              >
                                <span>Añadir</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </section>

            {/* Promotions & Offers Area (Right side column) */}
            <aside className="w-full lg:w-80 shrink-0 space-y-6">
              <div 
                className="text-white p-6 rounded-3xl space-y-4 shadow-md relative overflow-hidden"
                style={{ backgroundColor: config.publicTheme.primaryColor }}
              >
                {/* Visual decoration overlay */}
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-x-10 translate-y-10" />

                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h3 className="text-base font-extrabold tracking-tight">Promos & Ofertas</h3>
                </div>
                <p className="text-xs text-emerald-200 leading-relaxed">
                  Consigue rebajas extremas de la semana cargadas por los administradores. ¡Se añaden al mismo pedido!
                </p>

                <div className="space-y-4 pt-2">
                  {newsAndPromos.length === 0 ? (
                    <p className="text-xs text-center text-emerald-300 italic py-4">No hay ofertas destacadas este fin de semana.</p>
                  ) : (
                    newsAndPromos.map((p) => (
                      <div 
                        key={p.id} 
                        className="bg-white/10 border border-white/10 rounded-2xl p-3 flex gap-2.5 items-center justify-between text-xs"
                      >
                        <img
                          referrerPolicy="no-referrer"
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg bg-emerald-900/40"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-[11px] truncate">{p.name}</p>
                          <div className="flex gap-2 items-center mt-0.5">
                            <span className="font-mono font-bold text-amber-300">${p.price.toLocaleString()}</span>
                            {p.type === 'offer' ? (
                              <span className="bg-amber-400/20 text-amber-300 font-extrabold text-[8px] uppercase tracking-wider px-1 py-0.2 rounded">
                                Oferta
                              </span>
                            ) : (
                              <span className="bg-indigo-500/20 text-indigo-300 font-extrabold text-[8px] uppercase tracking-wider px-1 py-0.2 rounded">
                                Promo
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          id={`promo-add-btn-${p.id}`}
                          onClick={() => handleAddToCart(p)}
                          className="p-1.5 bg-white text-emerald-950 hover:bg-emerald-100 rounded-lg shrink-0 transition-colors"
                          title="Llevar promo"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dietas Saludables Sidebar Card */}
              <div className="bg-white border rounded-3xl p-5 space-y-4 shadow-sm border-slate-150">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs font-black uppercase text-slate-800">Dietario del Local</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Guías de nutrición y regímenes recomendados por profesionales para balancear tu rutina alimentaria.
                </p>

                <div className="space-y-2 pt-1 font-semibold text-xs">
                  {diets.filter(d => d.active).length === 0 ? (
                    <div className="p-4 bg-slate-50 text-slate-400 italic rounded-2xl text-center">
                      Planificando próximas dietas...
                    </div>
                  ) : (
                    diets.filter(d => d.active).map((diet) => (
                      <button
                        key={diet.id}
                        id={`diet-button-${diet.id}`}
                        onClick={() => setSelectedDiet(diet)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-150 hover:border-emerald-200 rounded-2xl transition-all cursor-pointer text-left group"
                      >
                        <div className="flex-1 min-w-0 pr-2 font-semibold">
                          <p className="font-bold text-[11px] group-hover:text-emerald-800 transition-colors truncate">{diet.title}</p>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">⏱️ {diet.duration}</span>
                        </div>
                        <span className="bg-emerald-600 group-hover:bg-emerald-700 text-white text-[9px] px-2.5 py-1 rounded-lg font-bold shadow-xs shrink-0 flex items-center gap-1 transition-all">
                          Ver Plan <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Business Location Section */}
              <div className="bg-white border rounded-3xl p-5 space-y-4 shadow-sm border-slate-150">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <h4 className="text-xs font-black uppercase text-slate-800">Nuestra Ubicación</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Encuéntranos de lunes a sábados de 09:00 a 20:00 hs en: <span className="text-slate-700 font-bold block mt-1">{config.address}</span>
                </p>

                {/* Secure Map iframe */}
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-100">
                  <iframe
                    src={config.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    title="Store Address Navigation map"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(config.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline"
                >
                  Abrir Mapa en Google Maps Completo
                </a>
              </div>
            </aside>
          </main>

          {/* Checkout code confirmation dialog */}
          {latestGeneratedPickupCode && (
            <div id="pickup-code-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-scale-up">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-8 h-8" />
                </div>
                
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">¡Encargo Generado con éxito!</h3>
                  <p className="text-xs text-slate-500 mt-1">Presenta este código al retirar del comercio físico.</p>
                </div>

                <div className="py-2 px-6 bg-slate-50 dark:bg-slate-950/65 border border-slate-150 rounded-2xl">
                  <span className="text-3xl font-black font-mono text-emerald-600 tracking-wider">
                    {latestGeneratedPickupCode}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Hemos enviado las alertas a administración. Una vez que tu pedido esté preparado, se te enviará un WhatsApp de aviso al número registrado. ¡Muchas gracias por elegirnos!
                </p>

                <div className="pt-2">
                  <button
                    id="close-pickup-modal-btn"
                    onClick={() => setLatestGeneratedPickupCode(null)}
                    style={{ backgroundColor: config.publicTheme.primaryColor }}
                    className="w-full text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors hover:brightness-110"
                  >
                    Entendido, Seguir Comprando
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PWA Floating Cart Bottom summary for Mobile Screens */}
          <div className="md:hidden fixed bottom-6 right-6 z-20">
            <button
              id="sticky-cart-counter-btn"
              onClick={() => setIsCartOpen(true)}
              style={{ backgroundColor: config.publicTheme.primaryColor }}
              className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center relative active:scale-95 transition-transform"
            >
              <ShoppingBag className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((s,i)=>s+i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Section: Footer contacts, networks & share features */}
          <footer className="bg-slate-900 text-slate-300 pt-12 pb-6 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs pb-10 border-b border-slate-800">
              
              {/* Profile Details col */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-1.5 bg-emerald-500 text-slate-900 rounded-md font-extrabold text-xs">
                    DV
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase">{config.name}</h4>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Ofrecemos opciones dietéticas seleccionadas de alta calidad, semillas libres de gluten, y atención personalizada de vanguardia.
                </p>
                <div className="space-y-1.5 text-slate-400">
                  <p><b>Dirección:</b> {config.address}</p>
                  <p><b>Tel:</b> {config.phone}</p>
                </div>
              </div>

              {/* Dynamic Customer Contact Form */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">Formulario de Contacto</h4>
                
                {isContactSubmitted ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center text-emerald-400 space-y-1.5">
                    <CheckCircle className="w-6 h-6 mx-auto text-emerald-400" />
                    <p className="font-bold">¡Mensaje enviado con éxito!</p>
                    <p className="text-[10px] text-emerald-300">Te responderemos a la brevedad por correo electrónico.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-2 text-slate-900">
                    <input
                      id="footer-contact-name"
                      type="text"
                      required
                      placeholder="Tu Nombre completo"
                      className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs placeholder:text-slate-500"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    />
                    <input
                      id="footer-contact-email"
                      type="email"
                      required
                      placeholder="Tu Correo Electrónico"
                      className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs placeholder:text-slate-500"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                    <textarea
                      id="footer-contact-msg"
                      required
                      rows={2}
                      placeholder="Tu consulta para la dietética..."
                      className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs placeholder:text-slate-500"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    />
                    <button
                      id="footer-contact-submit"
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" /> Enviar Mensaje
                    </button>
                  </form>
                )}
              </div>

              {/* Share & Social Network details */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">Nuestras Redes y Compartir</h4>
                <p className="text-slate-400 leading-relaxed">
                  ¿Te gusta nuestra dietética? Ayúdanos compartiendo este catálogo con tus familiares o amigos de forma rápida.
                </p>

                <div className="flex gap-2">
                  <button
                    id="share-whatsapp-btn"
                    onClick={() => handleSharePage('whatsapp')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    id="share-email-btn"
                    onClick={() => handleSharePage('email')}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" /> Correo
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800 flex gap-4 text-slate-400 font-semibold justify-center">
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a>
                  <span>•</span>
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook</a>
                  <span>•</span>
                  <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter (X)</a>
                </div>
              </div>

            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
              <p>© {new Date().getFullYear()} {config.name}. Todos los derechos reservados.</p>
              <div className="flex gap-4 font-medium">
                <span>Politica de Privacidad</span>
                <span>Términos del Servicio</span>
              </div>
            </div>
          </footer>

          {/* Login Simulation Modal Dialog for Administrators */}
          {isLoginModalOpen && (
            <div id="login-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl animate-scale-up">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" /> Control & Licencia Genuina
                  </h3>
                  <button 
                    onClick={() => setIsLoginModalOpen(false)} 
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850 p-1 cursor-pointer border-0 bg-transparent"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAdminFormLogin} className="space-y-3.5">
                  {bioAvail && bioOn && (
                    <div>
                      <button
                        type="button"
                        onClick={handleBioLogin}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        🔐 Ingresar con huella / Face ID
                      </button>
                      <div className="flex items-center gap-2 my-2">
                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        <span className="text-[10px] text-slate-400 uppercase">o con tus datos</span>
                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                      </div>
                    </div>
                  )}
                  {/* Collapsible License Badge */}
                  <div 
                    onClick={() => setIsLicenseInputOpen(!isLicenseInputOpen)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                      licenseCode.trim() 
                        ? 'bg-emerald-50/70 border-emerald-500/20 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    <span>🔑</span>
                    <span className="flex-1 truncate">
                      {licenseCode.trim().toUpperCase().startsWith('DIET') 
                        ? `Licencia: ${licenseCode.trim().toUpperCase()}` 
                        : 'Tengo un código de licencia'}
                    </span>
                    <span className="text-[10px] text-slate-400">{isLicenseInputOpen ? '▲' : '▼'}</span>
                  </div>

                  {isLicenseInputOpen && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Código de Licencia</label>
                      <input 
                        type="text"
                        placeholder="VIDA-0001-2026-XXXX"
                        value={licenseCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setLicenseCode(val);
                        }}
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-mono placeholder-slate-400 font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  )}

                  {/* Role Selector toggler */}
                  <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSelectedLoginRole('admin')}
                      className={`py-1.5 text-[10px] rounded-lg transition-all font-bold cursor-pointer flex items-center justify-center gap-1 border-0 ${
                        selectedLoginRole === 'admin' 
                          ? 'bg-emerald-600 text-white shadow-xs font-black' 
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 bg-transparent'
                      }`}
                    >
                      👤 Administrador
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLoginRole('collaborator')}
                      className={`py-1.5 text-[10px] rounded-lg transition-all flex items-center justify-center cursor-pointer border-0 font-bold ${
                        selectedLoginRole === 'collaborator' 
                          ? 'bg-emerald-600 text-white shadow-xs font-black' 
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 bg-transparent'
                      }`}
                    >
                      🤝 Colaborador
                    </button>
                  </div>

                  {/* Username/Selection depending on simulated vs real online */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Usuario de Acceso</label>
                    <input
                      type="text"
                      placeholder="Ej: sofia, luciano..."
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>

                  {/* Contraseña / PIN input with toggle visibility */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contraseña</label>
                    </div>
                    <div className="relative">
                      <input
                        id="login-pass-input"
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••"
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-mono text-center tracking-widest text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-355 bg-transparent border-0 cursor-pointer"
                        title={showLoginPassword ? "Ocultar" : "Mostrar"}
                      >
                        {showLoginPassword ? "👁" : "👁‍🗨"}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <p className="text-[10px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/25 p-2.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
                      {loginError}
                    </p>
                  )}

                  {bioAvail && !bioOn && (
                    <label className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bioCheck}
                        onChange={(e) => setBioCheck(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-emerald-600"
                      />
                      <span>🔒 <strong>Activar ingreso con huella / Face ID</strong> en este dispositivo, para no volver a tipear las credenciales.</span>
                    </label>
                  )}

                  <div className="pt-2 space-y-2">
                    <button
                      id="login-submit-btn"
                      type="submit"
                      disabled={isLoginChecking}
                      className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      {isLoginChecking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" /> Verificando con Supabase...
                        </>
                      ) : (
                        'Ingresar al Panel Seguro'
                      )}
                    </button>

                    {licenseCode.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setLicenseCode('');
                          setLoginForm({ username: 'admin_a', password: '' });
                          setLoginError('');
                        }}
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 py-1.5 px-4 rounded-xl text-[10px] transition-colors border-0 cursor-pointer text-center font-bold"
                      >
                        🖊 Volver a Modo Prueba (local / sin Supabase)
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Client QuickView modal */}
          <QuickViewModal
            product={selectedProductQuickView}
            isOpen={selectedProductQuickView !== null}
            onClose={() => setSelectedProductQuickView(null)}
            onAddToCart={handleAddToCart}
            primaryColor={config.publicTheme.primaryColor}
          />

          {/* Client Shopping Cart modal */}
          <CartModal
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onOrderSubmission={handleOrderSubmission}
            primaryColor={config.publicTheme.primaryColor}
            waPrefix={config.waPrefix}
          />

          {/* Client Diet Detail/Checklist modal */}
          <DietDetailModal
            diet={selectedDiet}
            isOpen={selectedDiet !== null}
            onClose={() => setSelectedDiet(null)}
            primaryColor={config.publicTheme.primaryColor}
          />

        </div>
      )}

    </div>
  );
}
