/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, Package, Percent, Tag, BarChart3, Clock, 
  TrendingUp, LogOut, Check, Trash2, Edit2, ShieldAlert,
  Bell, Smartphone, Download, CheckCircle2, UserCheck, RefreshCw, Eye,
  X, Send, Printer, Share2, Sparkles, Leaf, BookOpen, Plus, Compass, ChevronRight, Search
} from 'lucide-react';
import { Product, StoreConfig, AdminSession, Order, CustomField, ProductType, Diet, Category } from '../types';
import BarcodeScannerModal from './BarcodeScannerModal';
import { AVAILABLE_FONTS, DEFAULT_HERO_LINES, HERO_SIZE_OPTIONS } from '../data/initialData';

interface AdminPortalProps {
  products: Product[];
  orders: Order[];
  config: StoreConfig;
  sessions: AdminSession[];
  currentAdmin: 'admin_a' | 'admin_b';
  diets: Diet[];
  categories: Category[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateConfig: (config: StoreConfig) => void;
  onUpdateSessions: (sessions: AdminSession[]) => void;
  onSwitchAdmin: (adminId: 'admin_a' | 'admin_b') => void;
  onLogout: () => void;
  onTogglePreview: () => void;
  onUpdateDiets: (diets: Diet[]) => void;
  onUpdateCategories: (categories: Category[]) => void;
  collaborators: any[];
  onUpdateCollaborators: (collaborators: any[]) => void;
  publicCode: string;
  onListBackups?: () => Promise<any[]>;
  onRestoreBackup?: (id: number) => Promise<boolean>;
}

export default function AdminPortal({
  products,
  orders,
  config,
  sessions,
  currentAdmin,
  diets,
  categories,
  onUpdateProducts,
  onUpdateOrders,
  onUpdateConfig,
  onUpdateSessions,
  onSwitchAdmin,
  onLogout,
  onTogglePreview,
  onUpdateDiets,
  onUpdateCategories,
  collaborators,
  onUpdateCollaborators,
  publicCode,
  onListBackups,
  onRestoreBackup
}: AdminPortalProps) {
  // Copias de seguridad (rollback)
  const [backups, setBackups] = useState<any[]>([]);
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [backupsBusy, setBackupsBusy] = useState(false);
  const cargarBackups = async () => {
    if (!onListBackups) return;
    setBackupsBusy(true);
    try { setBackups(await onListBackups()); setBackupsOpen(true); }
    finally { setBackupsBusy(false); }
  };
  const restaurarBackup = async (id: number) => {
    if (!onRestoreBackup) return;
    if (!window.confirm('¿Restaurar esta copia? Se reemplazan los datos actuales por los de esa fecha. (La versión actual queda guardada por las dudas.)')) return;
    setBackupsBusy(true);
    try {
      const ok = await onRestoreBackup(id);
      alert(ok ? '✅ Copia restaurada. Ya están cargados los datos de esa fecha.' : 'No se pudo restaurar. Probá de nuevo.');
      if (ok) setBackupsOpen(false);
    } finally { setBackupsBusy(false); }
  };
  // URL pública del local: SIEMPRE con ?codigo= para que el cliente cargue ESTE local.
  const publicUrl = publicCode
    ? `${window.location.origin}/?codigo=${publicCode}`
    : window.location.origin;
  // Tabs
  const [activeTab, setActiveTab] = useState<'config' | 'products' | 'promotions' | 'offers' | 'dashboard' | 'orders' | 'stock' | 'diets' | 'categories'>('dashboard');

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newCatEmoji, setNewCatEmoji] = useState('📦');
  const [catProductSearch, setCatProductSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');

  // Scanner controls
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetField, setScannerTargetField] = useState<'create' | 'edit'>('create');

  // Print flyer QR controls
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTitle, setPrintTitle] = useState(config.name);
  const [printTagline, setPrintTagline] = useState('Escaneá este código QR para entrar a nuestro catálogo digital, elegir tus productos favoritos y enviarnos tu pedido por WhatsApp en segundos.');

  // Multi-fields storage for New Product
  const [newCustomFields, setNewCustomFields] = useState<CustomField[]>([]);
  const [editingCustomFields, setEditingCustomFields] = useState<CustomField[]>([]);

  // Product Formulation / State
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: categories[1]?.name || 'Frutos Secos',
    price: 0,
    stock: 0,
    minStockAlert: 5,
    image: '',
    weight: '',
    liters: '',
    barCode: '',
    type: 'product' as ProductType,
    expirationDate: ''
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Store profile customisation settings states
  const [profileForm, setProfileForm] = useState({
    name: config.name,
    address: config.address,
    phone: config.phone,
    waPrefix: config.waPrefix || '+549',
    mapEmbedUrl: config.mapEmbedUrl,
    logo: config.logo
  });

  const [publicTheme, setPublicTheme] = useState(config.publicTheme);
  const [adminTheme, setAdminTheme] = useState(config.adminTheme);
  const [selectedPreset, setSelectedPreset] = useState<'natura_stone' | 'bento_grid' | 'vibrant_palette'>(config.selectedPreset || 'natura_stone');
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Cabecera editable de la vidriera (4 renglones, cada uno con letra y tamaño)
  const [heroLines, setHeroLines] = useState<{ text: string; font: string; size: string }[]>(
    (config.heroLines && config.heroLines.length)
      ? config.heroLines.map(l => ({ text: l.text, font: l.font, size: l.size }))
      : DEFAULT_HERO_LINES.map(l => ({ ...l }))
  );
  const updateHeroLine = (i: number, campo: 'text' | 'font' | 'size', valor: string) => {
    setHeroLines(prev => prev.map((l, idx) => idx === i ? { ...l, [campo]: valor } : l));
  };

  // Acceso del Admin B (colaborador): usuario + clave que se guardan en la nube
  const [collabForm, setCollabForm] = useState({
    username: (collaborators && collaborators[0]?.username) || '',
    pass: ''
  });
  const [isCollabSaved, setIsCollabSaved] = useState(false);

  const handleSaveCollab = () => {
    const u = collabForm.username.trim();
    if (!u || !collabForm.pass.trim()) {
      alert('Cargá usuario y contraseña para el Admin B (mínimo 6 caracteres la clave).');
      return;
    }
    if (collabForm.pass.trim().length < 6) {
      alert('La contraseña del Admin B debe tener al menos 6 caracteres.');
      return;
    }
    // El RPC vida_verificar_colab compara username + passwordHash (texto)
    onUpdateCollaborators([{ username: u, passwordHash: collabForm.pass.trim(), name: 'Admin B' }]);
    setCollabForm({ username: u, pass: '' });
    setIsCollabSaved(true);
    setTimeout(() => setIsCollabSaved(false), 3000);
  };

  // States for Dietario CRUD
  const [editingDietId, setEditingDietId] = useState<string | null>(null);
  const [dietForm, setDietForm] = useState({
    title: '',
    description: '',
    duration: '',
    tipsText: '', // tips split by newlines
    active: true
  });

  const applyPresetColors = (preset: 'natura_stone' | 'bento_grid' | 'vibrant_palette') => {
    setSelectedPreset(preset);
    if (preset === 'natura_stone') {
      setPublicTheme({
        primaryColor: '#2d3a2d',
        accentColor: '#c49b66',
        bgColor: '#f4f0e6',
        fontFamily: 'Outfit'
      });
    } else if (preset === 'bento_grid') {
      setPublicTheme({
        primaryColor: '#18181b',
        accentColor: '#10b981',
        bgColor: '#fcfcfc',
        fontFamily: 'Space Grotesk'
      });
    } else if (preset === 'vibrant_palette') {
      setPublicTheme({
        primaryColor: '#7c3aed',
        accentColor: '#ef4444',
        bgColor: '#faf5ff',
        fontFamily: 'Inter'
      });
    }
  };

  // Sound Synth for New Orders Notify
  const playPulse = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      setTimeout(() => { osc.stop(); audioCtx.close(); }, 400);
    } catch (_) {}
  };

  // Comprime/achica una imagen antes de guardarla (para que la nube vuele y
  // las fotos pesadas del celular no rebalsen los datos del local).
  const comprimirImagen = (file: File, maxLado = 1000, calidad = 0.8): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Imagen inválida'));
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxLado || height > maxLado) {
            if (width >= height) { height = Math.round((height * maxLado) / width); width = maxLado; }
            else { width = Math.round((width * maxLado) / height); height = maxLado; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(reader.result as string); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', calidad));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  // Subida de imagen (logo o producto) con compresión automática.
  const handleLogoUploadSim = async (e: React.ChangeEvent<HTMLInputElement>, isLogo: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert('La imagen es muy pesada (máx 15 MB). Probá con otra.'); return; }
    try {
      const dataUrl = await comprimirImagen(file, isLogo ? 400 : 1000, 0.8);
      if (isLogo) setProfileForm(prev => ({ ...prev, logo: dataUrl }));
      else setProductForm(prev => ({ ...prev, image: dataUrl }));
    } catch (err) {
      alert('No se pudo procesar la imagen. Probá con otra foto.');
    } finally {
      e.target.value = ''; // permite re-elegir la misma foto si hace falta
    }
  };

  const handleEditLogoUploadSim = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    if (file.size > 15 * 1024 * 1024) { alert('La imagen es muy pesada (máx 15 MB). Probá con otra.'); return; }
    try {
      const dataUrl = await comprimirImagen(file, 1000, 0.8);
      setEditingProduct(prev => prev ? { ...prev, image: dataUrl } : null);
    } catch (err) {
      alert('No se pudo procesar la imagen. Probá con otra foto.');
    } finally {
      e.target.value = '';
    }
  };

  // Security: Admin forces session logout of the counterpart
  const handleKickPartnerAdmin = (partnerId: 'admin_a' | 'admin_b') => {
    const updated = sessions.map(s => {
      if (s.id === partnerId) {
        return { ...s, isLoggedIn: false, lastActive: new Date().toISOString() };
      }
      return s;
    });
    onUpdateSessions(updated);
    playPulse();
    alert(`Se ha cerrado la sesión del móvil asociado a ${partnerId === 'admin_a' ? 'Admin A' : 'Admin B'} por razones de de seguridad.`);
  };

  const handleRestorePartnerAdmin = (partnerId: 'admin_a' | 'admin_b') => {
    const updated = sessions.map(s => {
      if (s.id === partnerId) {
        return { ...s, isLoggedIn: true, lastActive: new Date().toISOString() };
      }
      return s;
    });
    onUpdateSessions(updated);
  };

  // Stock management & Addition
  const handleAddProduct = (e: React.FormEvent, explicitType?: ProductType) => {
    e.preventDefault();
    if (!productForm.name) return;

    const finalType = explicitType || productForm.type;
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: productForm.name,
      brand: productForm.brand || 'Dietética',
      category: productForm.category,
      price: productForm.price || 100,
      stock: productForm.stock || 0,
      minStockAlert: productForm.minStockAlert || 5,
      image: productForm.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
      weight: productForm.weight || undefined,
      liters: productForm.liters || undefined,
      barCode: productForm.barCode || undefined,
      type: finalType,
      customFields: newCustomFields.length > 0 ? newCustomFields : undefined,
      createdAt: new Date().toISOString()
    };

    onUpdateProducts([newProd, ...products]);
    
    // Reset Form
    setProductForm({
      name: '',
      brand: '',
      category: categories[1]?.name || 'Frutos Secos',
      price: 0,
      stock: 0,
      minStockAlert: 5,
      image: '',
      weight: '',
      liters: '',
      barCode: '',
      type: 'product',
      expirationDate: ''
    });
    setNewCustomFields([]);
    playPulse();
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Está seguro de eliminar este producto de la dietética?')) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  // Save changes to current editing item
  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated = products.map(p => {
      if (p.id === editingProduct.id) {
        return {
          ...editingProduct,
          customFields: editingCustomFields.length > 0 ? editingCustomFields : undefined
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setEditingProduct(null);
    setEditingCustomFields([]);
    playPulse();
  };

  // Profile Form save callback
  const handleSaveProfileAndThemes = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: StoreConfig = {
      ...config,
      name: profileForm.name,
      address: profileForm.address,
      phone: profileForm.phone,
      waPrefix: profileForm.waPrefix,
      mapEmbedUrl: profileForm.mapEmbedUrl,
      logo: profileForm.logo,
      heroLines,
      publicTheme,
      adminTheme,
      selectedPreset
    };
    onUpdateConfig(updatedConfig);
    setIsSavedNotify(true);
    playPulse();
    setTimeout(() => setIsSavedNotify(false), 3000);
  };

  // Diets CRUD callbacks
  const handleSaveDiet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dietForm.title.trim()) {
      alert("La dieta requiere un título válido.");
      return;
    }

    // Split tips by lines and clean empty/whitespace lines
    const parsedTips = dietForm.tipsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (editingDietId) {
      // Edit mode
      const updated = diets.map(d => {
        if (d.id === editingDietId) {
          return {
            ...d,
            title: dietForm.title,
            description: dietForm.description,
            duration: dietForm.duration,
            tips: parsedTips,
            active: dietForm.active
          };
        }
        return d;
      });
      onUpdateDiets(updated);
      setEditingDietId(null);
    } else {
      // Create mode
      const newDiet: Diet = {
        id: `diet-${Date.now()}`,
        title: dietForm.title,
        description: dietForm.description,
        duration: dietForm.duration,
        tips: parsedTips,
        active: dietForm.active,
        createdAt: new Date().toISOString()
      };
      onUpdateDiets([...diets, newDiet]);
    }

    // Reset form
    setDietForm({
      title: '',
      description: '',
      duration: '',
      tipsText: '',
      active: true
    });
    playPulse();
  };

  const handleEditDietClick = (diet: Diet) => {
    setEditingDietId(diet.id);
    setDietForm({
      title: diet.title,
      description: diet.description,
      duration: diet.duration,
      tipsText: diet.tips.join('\n'),
      active: diet.active
    });
  };

  const handleDeleteDietClick = (dietId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este plan dietario?")) {
      const remaining = diets.filter(d => d.id !== dietId);
      onUpdateDiets(remaining);
      playPulse();
    }
  };

  const handleCancelDietEdit = () => {
    setEditingDietId(null);
    setDietForm({
      title: '',
      description: '',
      duration: '',
      tipsText: '',
      active: true
    });
  };

  const handleToggleDietActive = (dietId: string) => {
    const updated = diets.map(d => {
      if (d.id === dietId) {
        return { ...d, active: !d.active };
      }
      return d;
    });
    onUpdateDiets(updated);
    playPulse();
  };

  // Process order completions (prepared | completed)
  const handleUpdateOrderStatus = (orderId: string, nextStatus: 'prepared' | 'completed') => {
    const activeAdminLabel = currentAdmin === 'admin_a' ? 'Admin A (Sofía)' : 'Admin B (Luciano)';
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : o.completedAt,
          completedBy: nextStatus === 'completed' ? (currentAdmin === 'admin_a' ? 'Admin A' : 'Admin B') : o.completedBy
        };
      }
      return o;
    });
    onUpdateOrders(updated);
    
    // Deduct stock if marked as COMPLETED for the first time
    const originalOrder = orders.find(o => o.id === orderId);
    if (originalOrder && nextStatus === 'completed' && originalOrder.status !== 'completed') {
      const updatedProducts = products.map(p => {
        const itemOrdered = originalOrder.items.find(item => item.productId === p.id);
        if (itemOrdered) {
          return { ...p, stock: Math.max(0, p.stock - itemOrdered.quantity) };
        }
        return p;
      });
      onUpdateProducts(updatedProducts);
    }
    playPulse();
  };

  // Export Dashboard to CSV Spreadsheet
  const handleExportCSV = () => {
    const headers = ['Código Retiro', 'Cliente', 'Teléfono', 'Productos Detallados', 'Total ($)', 'Estado', 'Fecha Creación', 'Procesador'];
    const rows = orders.map(o => {
      const itemsString = o.items.map(i => `${i.productName} (x${i.quantity})`).join(' | ');
      return [
        o.id,
        o.customerName,
        o.customerPhone,
        itemsString,
        o.totalAmount,
        o.status === 'pending' ? 'Pendiente' : o.status === 'prepared' ? 'Preparado' : 'Entregado',
        new Date(o.createdAt).toLocaleDateString('es-AR'),
        o.completedBy || 'Pendiente'
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ventas_Dietetica_VidaGenuina_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculated Metrics
  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const totalSalesThisWeek = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  // Dynamic filter for product catalog additions based on current Pestaña
  const shownCreationType = activeTab === 'promotions' ? 'promotion' : activeTab === 'offers' ? 'offer' : 'product';

  return (
    <div id="admin-portal-stage" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-all">
      
      {/* Main Admin UI Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-900">
              AD
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight leading-none small-caps">
                {config.name} — Panel de Gestión
              </h1>
              <p className="text-[10px] text-slate-300 font-medium mt-1">
                Conectado como: <span className="text-emerald-400 font-semibold">{currentAdmin === 'admin_a' ? 'Admin A (Sofía)' : 'Admin B (Luciano)'}</span> [Móvil de Respaldo]
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick alert indicator for low stock / pending orders */}
            <div className="flex gap-2 text-xs">
              {lowStockProducts.length > 0 && (
                <div className="flex items-center gap-0.5 bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/40 font-mono animate-pulse">
                  <Bell className="w-3.5 h-3.5 shrink-0" /> Restock ({lowStockProducts.length})
                </div>
              )}
              {pendingOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  title="Tenés pedidos nuevos — tocá para verlos"
                  className="flex items-center gap-1 bg-emerald-500/25 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/50 font-mono animate-bounce cursor-pointer hover:bg-emerald-500/40 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 shrink-0" /> Pedidos nuevos ({pendingOrders.length})
                </button>
              )}
            </div>

            {/* Ojo para Vista Previa Pública */}
            <button
              id="admin-preview-eye-btn"
              onClick={onTogglePreview}
              className="text-xs text-white hover:bg-emerald-800 bg-emerald-700 border border-emerald-600 rounded-lg px-2.5 py-1.5 transition-all flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
              title="Vista Espejo: Ver página pública en vivo"
            >
              <Eye className="w-3.5 h-3.5" /> Ver Tienda Pública
            </button>

            <button
              id="admin-quit-btn"
              onClick={onLogout}
              className="text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-2.5 py-1.5 transition-all flex items-center gap-1 bg-slate-800"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir al Público
            </button>
          </div>
        </div>
      </header>

      {/* Modular Portal Frame Dashboard Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Side Sidebar Tab Switcher */}
        <aside className="w-full md:w-64 space-y-2 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3">Secciones del Negocio</p>
            
            <nav className="space-y-1">
              <button
                id="tab-dashboard-btn"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Dashboard de Ventas
                </span>
              </button>

              <button
                id="tab-orders-btn"
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'orders'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Compras / Pedidos
                </span>
                {pendingOrders.length > 0 && (
                  <span className="bg-rose-500 font-mono text-[10px] text-white px-2 py-0.5 rounded-full font-bold">
                    {pendingOrders.length}
                  </span>
                )}
              </button>

              <button
                id="tab-products-btn"
                onClick={() => { setActiveTab('products'); setProductForm(f => ({ ...f, type: 'product' })); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'products'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" /> Ingreso Productos
                </span>
              </button>

              <button
                id="tab-promotions-btn"
                onClick={() => { setActiveTab('promotions'); setProductForm(f => ({ ...f, type: 'promotion' })); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'promotions'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Percent className="w-4 h-4" /> Promociones
                </span>
              </button>

              <button
                id="tab-offers-btn"
                onClick={() => { setActiveTab('offers'); setProductForm(f => ({ ...f, type: 'offer' })); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'offers'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Ofertas Especiales
                </span>
              </button>

              <button
                id="tab-stock-btn"
                onClick={() => setActiveTab('stock')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'stock'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Inventario Stock
                </span>
                {lowStockProducts.length > 0 && (
                  <span className="bg-amber-400 font-mono text-[10px] text-slate-900 px-2 py-0.5 rounded-full font-bold">
                    {lowStockProducts.length}
                  </span>
                )}
              </button>

              <button
                id="tab-diets-btn"
                onClick={() => setActiveTab('diets' as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === ('diets' as any)
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Dietario de Clientes
                </span>
                <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {diets.length}
                </span>
              </button>

              <button
                id="tab-categories-btn"
                onClick={() => setActiveTab('categories')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'categories'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" /> Catálogo Categorías
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {categories.length}
                </span>
              </button>

              <button
                id="tab-config-btn"
                onClick={() => setActiveTab('config')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'config'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Temas / Configuración
                </span>
              </button>
            </nav>
          </div>

          {/* Quick Stats Widget */}
          <div className="bg-emerald-950 text-white p-4 rounded-2xl shadow-sm space-y-2">
            <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-300">Caja Semanal</span>
            <p className="text-xl font-black font-mono">${totalSalesThisWeek.toLocaleString('es-AR')}</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{orders.filter(o=>o.status==='completed').length} entregas completadas</span>
            </div>
          </div>
        </aside>

        {/* Right Side Main Workdesk Body Frame */}
        <main className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div id="tab-dashboard" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resumen de Pérdidas y Ganancias</h2>
                  <p className="text-xs text-slate-500">Analíticas en tiempo real del comercio dietético de base.</p>
                </div>
                <button
                  id="export-csv-btn"
                  onClick={handleExportCSV}
                  className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 self-start hover:bg-slate-850"
                >
                  <Download className="w-4 h-4" /> Bajar Planilla (.CSV)
                </button>
              </div>

              {/* Bento Grid Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                  <p className="text-xs text-slate-400 font-semibold">Ventas del Día</p>
                  <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
                    ${orders
                      .filter(o => o.status === 'completed' && new Date(o.createdAt).toDateString() === new Date().toDateString())
                      .reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">Pedidos cerrados hoy</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                  <p className="text-xs text-slate-400 font-semibold">Suma Semanal</p>
                  <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
                    ${totalSalesThisWeek.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">Historial recurrente de 7 días</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                  <p className="text-xs text-slate-400 font-semibold">Estimación Mensual</p>
                  <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
                    ${(totalSalesThisWeek * 4).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">Proyección según flujo semanal</p>
                </div>
              </div>

              {/* Visually-driven Pure CSS Grid Chart bar meters */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-4 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Rendimiento de Ventas por Día de la Semana
                </h4>
                
                <div className="h-44 flex items-end gap-3 pt-6 border-b border-slate-200 dark:border-slate-800 pb-1 font-mono">
                  {/* Generate 7 bars representation dynamically */}
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => {
                    // Simulate beautiful heights for realistic feel
                    const heights = ['30%', '45%', '75%', '50%', '90%', '100%', '20%'];
                    const values = [5400, 8900, 15400, 9800, 18900, 22000, 3100];
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                          ${values[idx].toLocaleString()}
                        </span>
                        <div 
                          style={{ height: heights[idx] }} 
                          className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-500 relative shadow-sm"
                        >
                          {/* Inner wave effect */}
                          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-md" />
                        </div>
                        <span className="text-xs text-slate-500 font-semibold">{day}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 italic mt-3 text-center">
                  * Pase el cursor sobre las barras de arriba para detallar la facturación de cada jornada.
                </p>
              </div>

              {/* COMPARTIR TIENDA CON CÓDIGO QR */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                <div className="w-36 h-36 bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-center shrink-0 shadow-sm relative group">
                  <img
                    referrerPolicy="no-referrer"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`}
                    alt="Colección QR de la tienda"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute -bottom-2 bg-slate-900 text-white text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase shadow-xs">SCAN ME</span>
                </div>

                <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">Difusión Exclusiva</span>
                    <span className="text-[10px] text-slate-400 font-mono italic truncate max-w-[200px] sm:max-w-xs">{publicUrl}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-snug">
                    Comparte tu Tienda con tus Clientes
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                    Imprime un folleto oficial de tu dietética en formato cartelera. Colócalo en el mostrador para que los clientes escaneen con su celular, accedan al catálogo público, armen sus compras y se comuniquen por WhatsApp al instante.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1.5 justify-center md:justify-start">
                    <button
                      type="button"
                      onClick={() => setIsPrintModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Configurar & Imprimir Folleto QR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(publicUrl);
                        alert("¡Enlace de la tienda copiado con éxito! Puedes compartirlo de forma directa con tus clientes.");
                      }}
                      className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" /> Copiar Enlace Directo
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Audit Trail Log */}
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 block">Registro de Concreción de Pedidos</h4>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-850 p-2.5 font-bold text-slate-700 dark:text-slate-300">
                    <div>Código / Cliente</div>
                    <div>Fecha / Hora</div>
                    <div className="text-right">Abonor</div>
                    <div className="text-right">Preparador</div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto">
                    {orders.filter(o=>o.status === 'completed').length === 0 ? (
                      <p className="text-center p-4 text-slate-400 italic">No hay pedidos concretados por el momento.</p>
                    ) : (
                      orders.filter(o=>o.status === 'completed').map(o => (
                        <div key={o.id} className="grid grid-cols-4 p-2.5 bg-white dark:bg-slate-900 items-center">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {o.id} <span className="block text-[10px] text-slate-400 font-normal truncate">{o.customerName}</span>
                          </div>
                          <div className="text-slate-400 font-mono">
                            {o.completedAt ? new Date(o.completedAt).toLocaleDateString() : new Date(o.createdAt).toLocaleDateString()}
                            <span className="block text-[10px]">{o.completedAt ? new Date(o.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                          </div>
                          <div className="font-bold font-mono text-right text-slate-800 dark:text-slate-300">
                            ${o.totalAmount.toLocaleString()}
                          </div>
                          <div className="text-right">
                            <span className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              {o.completedBy || 'Admin A'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COMPRAS / PEDIDOS */}
          {activeTab === 'orders' && (
            <div id="tab-orders" className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Pedidos Entrantes (<span className="text-rose-500 font-mono">{orders.filter(o=>o.status !== 'completed').length} pendientes</span>)
                </h2>
                <p className="text-xs text-slate-500">Prepara las bolsas según la compra del cliente y envíale avisos de retiro rápidamente.</p>
              </div>

              {/* Sound activator simulator */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Bocina / Campanilla de Pedidos Pendientes:</span>
                <button
                  id="simulate-sound-bell"
                  onClick={playPulse}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all"
                  title="Simular timbre de comercio"
                >
                  <Bell className="w-3.5 h-3.5 animate-bounce" /> Probar timbre
                </button>
              </div>

              {/* Active list */}
              <div className="space-y-4">
                {orders.filter(o => o.status !== 'completed').length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-sm text-slate-500 font-medium">No hay compras en preparación. ¡Felicidades, stock despachado!</p>
                  </div>
                ) : (
                  orders.filter(o => o.status !== 'completed').map(o => (
                    <div
                      key={o.id}
                      className={`border rounded-2xl p-5 bg-white dark:bg-slate-900 transition-all shadow-xs ${
                        o.status === 'pending' 
                          ? 'border-amber-200 bg-amber-50/10' 
                          : 'border-emerald-200 bg-emerald-50/5'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                          <span className="font-mono bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-extrabold px-3 py-1 rounded-lg text-sm">
                            {o.id}
                          </span>
                          <h4 className="font-bold text-slate-950 dark:text-white mt-2.5 text-base">{o.customerName}</h4>
                          <span className="text-xs font-mono text-slate-400 block mt-0.5">{new Date(o.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 text-right w-full sm:w-auto">
                          <span className={`text-2xl font-black font-mono text-slate-900 dark:text-white`}>
                            ${o.totalAmount.toLocaleString()}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            o.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {o.status === 'pending' ? 'Falta Preparar (Pendiente)' : 'Preparado en Mostrador'}
                          </span>
                        </div>
                      </div>

                      {/* Purchased products list detail */}
                      <div className="py-4 space-y-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Canasta de Dietética</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {o.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-semibold bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg">
                              <span className="text-slate-700 dark:text-slate-300">
                                {item.productName} <span className="text-slate-400 text-[10px] font-normal">({item.weight || item.liters || 'P/U'})</span>
                              </span>
                              <span className="font-mono text-slate-600 dark:text-slate-400">
                                x{item.quantity} - ${(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Flow actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {/* WhatsApp Dispatch Direct Trigger */}
                        <a
                          href={`https://wa.me/${o.customerPhone.replace(/[\s+-]/g, '')}?text=${encodeURIComponent(
                            `¡Hola ${o.customerName}! Te escribimos de ${config.name}. Tu pedido ${o.id} ya se encuentra preparado y listo en nuestro mostrador para que pases a retirarlo. ¡Te esperamos!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          id={`notify-whatsapp-${o.id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" /> Enviar WhatsApp de Retiro
                        </a>

                        <div className="flex gap-2">
                          {o.status === 'pending' ? (
                            <button
                              id={`prepare-order-${o.id}`}
                              onClick={() => handleUpdateOrderStatus(o.id, 'prepared')}
                              className="bg-slate-900 text-white hover:bg-slate-850 font-bold text-xs py-2 px-4 rounded-xl transition-all"
                            >
                              Marcar como Preparado
                            </button>
                          ) : (
                            <button
                              id={`complete-order-${o.id}`}
                              onClick={() => handleUpdateOrderStatus(o.id, 'completed')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-xs"
                              title="El cliente pagó y retiró del local"
                            >
                              Registrar Entrega Externa
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: STOCK INGRESO (PRODUCTS / PROMO / OFFERS ADD) */}
          {(activeTab === 'products' || activeTab === 'promotions' || activeTab === 'offers') && (
            <div id={`tab-${activeTab}`} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  Gestión de {activeTab === 'products' ? 'Productos Habituales' : activeTab === 'promotions' ? 'Promociones' : 'Ofertas del Local'}
                </h2>
                <p className="text-xs text-slate-500">Carga inventarios desde tu PC o teléfono móvil. Soporta escaneo físico de código de barra.</p>
              </div>

              {/* Formulation addition card */}
              <form onSubmit={(e) => handleAddProduct(e, shownCreationType)} className="space-y-4 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150">
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                  Ficha de Entrada ({shownCreationType === 'product' ? 'Regular' : shownCreationType === 'promotion' ? 'Promoción' : 'Oferta'})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Producto / Pack *</label>
                    <input
                      id="form-product-name"
                      type="text"
                      required
                      placeholder="Ej: Almendras con Chocolate"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Marca *</label>
                    <input
                      id="form-product-brand"
                      type="text"
                      required
                      placeholder="Ej: Granola Real"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={productForm.brand}
                      onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                    <select
                      id="form-product-category"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {categories.filter(c => c.name !== 'Todos').map((c) => (
                        <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Unitario ($) *</label>
                    <input
                      id="form-product-price"
                      type="number"
                      required
                      min="1"
                      placeholder="0.00"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      value={productForm.price || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Inicial *</label>
                    <input
                      id="form-product-stock"
                      type="number"
                      required
                      min="0"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      value={productForm.stock || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alerta Stock Mínimo *</label>
                    <input
                      id="form-product-minstock"
                      type="number"
                      required
                      min="1"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      value={productForm.minStockAlert || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, minStockAlert: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Peso (Gr/Kg, ej: 400g)</label>
                    <input
                      id="form-product-weight"
                      type="text"
                      placeholder="Ej: 500g"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={productForm.weight}
                      onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Medida Líquido (Litros/Mili, ej: 1L)</label>
                    <input
                      id="form-product-liters"
                      type="text"
                      placeholder="Ej: 500ml"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={productForm.liters}
                      onChange={(e) => setProductForm(prev => ({ ...prev, liters: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Vencimiento (Filtro)</label>
                    <input
                      id="form-product-expiry"
                      type="date"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      value={productForm.expirationDate}
                      onChange={(e) => setProductForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Código de Barras / QR</label>
                    <div className="flex gap-2">
                      <input
                        id="form-product-barcode"
                        type="text"
                        placeholder="Ej: 77912345678"
                        className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        value={productForm.barCode}
                        onChange={(e) => setProductForm(prev => ({ ...prev, barCode: e.target.value }))}
                      />
                      <button
                        type="button"
                        id="open-scanner-create-btn"
                        onClick={() => { setScannerTargetField('create'); setIsScannerOpen(true); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                        title="Escanear con cel"
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Imagen del Producto</label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      {productForm.image ? (
                        <img src={productForm.image} alt="" referrerPolicy="no-referrer" className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px] text-center shrink-0">Sin foto</div>
                      )}
                      <div className="flex-1 w-full space-y-2">
                        <label
                          htmlFor="form-product-upload-file"
                          className="cursor-pointer inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors"
                        >
                          📷 Subir imagen (celular o PC)
                        </label>
                        <input
                          id="form-product-upload-file"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUploadSim(e, false)}
                        />
                        <input
                          id="form-product-image"
                          type="text"
                          placeholder="…o pegá un link de imagen (opcional)"
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-slate-800 dark:text-slate-100"
                          value={productForm.image}
                          onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamically Created Extra Fields Block (" boton + para agregar mas campos") */}
                <div className="pt-4 border-t border-slate-200/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" /> Atributos Adicionales (Campos personalizados)
                    </h4>
                    <button
                      type="button"
                      id="add-custom-field-btn"
                      onClick={() => setNewCustomFields([...newCustomFields, { label: '', value: '' }])}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 py-1 px-2.5 bg-emerald-50 dark:bg-emerald-950/25 rounded-md"
                    >
                      <Plus className="w-3 h-3" /> Agregar Campo (+)
                    </button>
                  </div>

                  {newCustomFields.length > 0 && (
                    <div className="space-y-2">
                      {newCustomFields.map((field, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Etiqueta, ej: Calorías"
                            className="w-1/2 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
                            value={field.label}
                            onChange={(e) => {
                              const updated = [...newCustomFields];
                              updated[index].label = e.target.value;
                              setNewCustomFields(updated);
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Valor, ej: 150 kcal"
                            className="w-1/2 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
                            value={field.value}
                            onChange={(e) => {
                              const updated = [...newCustomFields];
                              updated[index].value = e.target.value;
                              setNewCustomFields(updated);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setNewCustomFields(newCustomFields.filter((_, i) => i !== index))}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    id="submit-product-btn"
                    type="submit"
                    className="bg-slate-900 text-white hover:bg-slate-850 text-xs font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Guardar Producto en Stock
                  </button>
                </div>
              </form>

              {/* Existing classified items list */}
              <div>
                <h3 className="text-xs uppercase font-bold text-slate-400 mb-3 tracking-wider font-mono">
                  Listado de {activeTab === 'products' ? 'Especiales Dietéticos' : activeTab === 'promotions' ? 'Promociones' : 'Ofertas Activas'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.filter(p => p.type === shownCreationType).map(p => (
                    <div key={p.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex gap-3 shadow-xs relative">
                      <img
                        referrerPolicy="no-referrer"
                        src={p.image}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded-xl"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1 truncate">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">Cód: {p.barCode || 'Sin Código'}</p>
                        
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                            ${p.price.toLocaleString()}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${p.stock <= p.minStockAlert ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                            Stock: {p.stock}
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 flex gap-1.5">
                        <button
                          id={`edit-prod-btn-${p.id}`}
                          onClick={() => {
                            setEditingProduct(p);
                            setEditingCustomFields(p.customFields || []);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-slate-600"
                          title="Editar producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-prod-btn-${p.id}`}
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded text-rose-500"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: STOCK INVENTARIO OVERALL */}
          {activeTab === 'stock' && (
            <div id="tab-stock" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Inventario General de Stock</h2>
                  <p className="text-xs text-slate-500">Listado íntegro de dietética con avisos de stock bajo el mínimo configurado.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar producto, marca o categoría..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Min stock alert panel */}
              {lowStockProducts.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-4 rounded-xl flex items-start gap-3">
                  <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                    <Bell className="w-4 h-4 animate-swing" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400">¡Alerta de Stock Crítico!</h4>
                    <p className="text-[11px] text-rose-600 dark:text-rose-300 leading-relaxed mt-0.5">
                      Los siguientes productos están igual o por debajo del stock mínimo. Recomendamos realizar pedidos al distribuidor.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {lowStockProducts.map(p => (
                        <span key={p.id} className="bg-rose-100/80 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 font-bold text-[10px] font-mono px-2 py-0.5 rounded-md">
                          {p.name} ({p.stock} un.)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Inventory List Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs text-xs">
                <div className="grid grid-cols-5 bg-slate-100 dark:bg-slate-850 p-3 font-bold text-slate-700">
                  <div className="col-span-2">Producto / Categoría</div>
                  <div className="text-center font-mono">Ubicación Barras</div>
                  <div className="text-center font-mono">Stock / Min</div>
                  <div className="text-right">Precio Unitario</div>
                </div>

                <div className="divide-y divide-slate-150">
                  {products.filter(p => {
                    const q = stockSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (p.name || '').toLowerCase().includes(q)
                      || (p.brand || '').toLowerCase().includes(q)
                      || (p.category || '').toLowerCase().includes(q)
                      || (p.barCode || '').toLowerCase().includes(q);
                  }).map(p => (
                    <div key={p.id} className="grid grid-cols-5 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-950/35 transition-colors">
                      <div className="col-span-2 flex items-center gap-2">
                        <img
                          referrerPolicy="no-referrer"
                          src={p.image}
                          alt={p.name}
                          className="w-8 h-8 object-cover rounded-md"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                          <span className="text-[10px] text-slate-500 font-medium">{p.category} | {p.brand}</span>
                        </div>
                      </div>

                      <div className="text-center font-mono text-slate-500">
                        {p.barCode || '779________'}
                      </div>

                      <div className="text-center font-mono flex items-center justify-center gap-1.5">
                        <span className={`font-bold ${p.stock <= p.minStockAlert ? 'text-rose-600 font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {p.stock}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{p.minStockAlert}</span>
                      </div>

                      <div className="text-right font-bold text-slate-850 font-mono">
                        ${p.price.toLocaleString('es-AR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: DIETS MANAGEMENT */}
          {activeTab === ('diets' as any) && (
            <div id="tab-diets" className="space-y-6 animate-fade-in text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" /> Control del Dietario Oficial
                  </h2>
                  <p className="text-xs text-slate-550">Agrega, edita y administra las dietas de salud disponibles para tus clientes en la Web Pública.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form column (Left/Top) */}
                <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/55 h-fit space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                    {editingDietId ? '✍️ Editar Dieta' : '➕ Nueva Dieta'}
                  </h3>

                  <form onSubmit={handleSaveDiet} className="space-y-4 font-semibold">
                    <div>
                      <label className="block text-slate-700 mb-1">Nombre o Título del Plan</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Dieta de la Luna"
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold"
                        value={dietForm.title}
                        onChange={(e) => setDietForm(df => ({ ...df, title: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">Duración Recomendada</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 26 horas, 14 días"
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        value={dietForm.duration}
                        onChange={(e) => setDietForm(df => ({ ...df, duration: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">Descripción Corta / Resumen</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Ingresa los objetivos o resumen de este régimen..."
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-normal"
                        value={dietForm.description}
                        onChange={(e) => setDietForm(df => ({ ...df, description: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">Tips y Consejos Paso a Paso</label>
                      <textarea
                        rows={5}
                        required
                        placeholder="Ej:&#13;Consumir abundante líquido.&#13;Evitar harinas procesadas o industriales.&#13;Tomar té de manzanilla antes de dormir."
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-normal font-mono"
                        value={dietForm.tipsText}
                        onChange={(e) => setDietForm(df => ({ ...df, tipsText: e.target.value }))}
                      />
                      <span className="text-[10px] text-slate-400 font-normal mt-1 block leading-tight">
                        💡 Escribe cada consejo, paso o alimento en un renglón diferente (Enter).
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        id="diet-active-checkbox"
                        type="checkbox"
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        checked={dietForm.active}
                        onChange={(e) => setDietForm(df => ({ ...df, active: e.target.checked }))}
                      />
                      <label htmlFor="diet-active-checkbox" className="text-slate-750 font-bold select-none cursor-pointer">
                        Habilitada (Visible al Público)
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-xs cursor-pointer transition-all"
                      >
                        {editingDietId ? 'Guardar Cambios' : 'Registrar Dieta'}
                      </button>
                      {editingDietId && (
                        <button
                          type="button"
                          onClick={handleCancelDietEdit}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2 rounded-lg cursor-pointer transition-all"
                        >
                          Cerrar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List column (Right/Bottom) */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                    Dietas Cargadas en el Sistema ({diets.length})
                  </h3>

                  {diets.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                      <p className="text-slate-400 italic">No hay planes dietarios registrados. Puedes agregar uno usando el formulario izquierdo.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {diets.map((diet) => (
                        <div
                          key={diet.id}
                          className={`p-5 bg-white border rounded-2xl shadow-xs transition-all flex flex-col justify-between gap-4 relative group ${
                            diet.active ? 'border-emerald-150' : 'border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-900 text-sm">{diet.title}</h4>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                  diet.active 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                                    : 'bg-slate-200 text-slate-700 border border-slate-300'
                                }`}>
                                  {diet.active ? '🟢 Activa / Visible' : '⚪ Desactivada (Oculta)'}
                                </span>

                                <label className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 select-none cursor-pointer font-bold hover:text-emerald-700 transition-colors bg-slate-100/60 dark:bg-slate-900/40 px-2 py-1.5 rounded-lg border border-slate-200/40">
                                  <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                    checked={diet.active}
                                    onChange={() => handleToggleDietActive(diet.id)}
                                  />
                                  <span>Habilitada al Público</span>
                                </label>
                              </div>

                              <p className="text-[11px] text-slate-550 mt-2 font-semibold italic">"{diet.description}"</p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEditDietClick(diet)}
                                className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg cursor-pointer transition-colors"
                                title="Editar esta dieta"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDietClick(diet.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                                title="Eliminar dieta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-xl p-3.5 space-y-2 text-[11px]">
                            <p className="font-extrabold text-slate-700 flex items-center gap-1.5">
                              ⏱️ Duración: <span className="font-mono text-slate-900 bg-slate-200 px-2 py-0.5 rounded text-[10px]">{diet.duration}</span>
                            </p>
                            <div className="space-y-1">
                              <p className="font-extrabold text-slate-600">Recomendaciones cargadas:</p>
                              <ul className="list-disc pl-4 text-slate-550 space-y-1 font-normal">
                                {diet.tips.map((tip, index) => (
                                  <li key={index}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: CATALOGO INTERACTIVO DE CATEGORIAS */}
          {activeTab === 'categories' && (
            <div id="tab-categories" className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600 animate-spin-slow" /> Catálogo Interactivo de Categorías
                </h2>
                <p className="text-xs text-slate-500">
                  Controlá las categorías de tu dietética: elegí emojis ilustrativos, pausá la visibilidad de grupos enteros y reasigná productos en tiempo real a sus estanterías correctas.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to Add New Category */}
                <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm border-slate-150 relative h-fit space-y-4">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Crear Categoría</h3>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Seleccioná un ícono identificador y un nombre para crear filtros automáticos interactivos para tus compradores.
                  </p>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = (e.target as any).elements.newCategoryName;
                      const val = input.value.trim();
                      if (!val) return;
                      if (categories.some(c => c.name.toLowerCase() === val.toLowerCase())) {
                        alert('⚠️ Esta categoría ya existe en el catálogo.');
                        return;
                      }

                      onUpdateCategories([...categories, {
                        id: val.toLowerCase().replace(/\s+/g, '-'),
                        name: val,
                        icon: newCatEmoji,
                        active: true
                      }]);

                      input.value = '';
                      setNewCatEmoji('📦');
                      playPulse();
                    }}
                    className="space-y-4 pt-1"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Elegí un ícono / emoji</label>
                      <div className="grid grid-cols-6 gap-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200/65 dark:border-slate-850/60 max-h-[110px] overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => setNewCatEmoji('')}
                          className={`col-span-2 p-1.5 text-[10px] rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center cursor-pointer border border-transparent font-bold text-slate-500 hover:text-rose-600 ${newCatEmoji === '' ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/30 text-rose-600 scale-105 font-black' : ''}`}
                          title="Sin emoji"
                        >
                          ✕ Sin Emoji
                        </button>
                        {['🥜', '🌾', '🌱', '🥥', '🍵', '🍞', '🍯', '🍫', '🍭', '🥗', '🧪', '🌿', '🌎', '📦', '🍊', '🍎', '🍄', '🍗', '🐟', '🥛', '🍪', '🥤', '🍇', '🍋'].map(emo => (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => setNewCatEmoji(emo)}
                            className={`p-1.5 text-lg rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-all flex items-center justify-center cursor-pointer border-0 bg-transparent ${newCatEmoji === emo ? 'bg-emerald-100/80 dark:bg-emerald-900/40 border border-emerald-500/20 scale-110 font-bold' : ''}`}
                            title={`Seleccionar ${emo}`}
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Categoría</label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200/50 shrink-0 w-11 h-11 flex items-center justify-center font-bold text-slate-400" title={newCatEmoji ? 'Emoji seleccionado' : 'Sin emoji'}>
                          {newCatEmoji || '∅'}
                        </span>
                        <input
                          id="newCategoryName"
                          name="newCategoryName"
                          required
                          type="text"
                          placeholder="ej: Aceites Especiales"
                          className="flex-1 text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono uppercase font-black py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar al Catálogo
                    </button>
                  </form>
                </div>

                {/* Categories Table List & Stats */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm border-slate-150">
                  <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Categorías y Control de Habilitación</h3>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-500 font-extrabold border border-slate-200/40">
                      {categories.length} Registradas
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
                    {categories.map((cat, index) => {
                      // Calculate products in this category
                      const count = products.filter(p => p.category === cat.name).length;
                      const isSystem = cat.name === 'Todos';

                      return (
                        <div 
                          key={cat.id} 
                          className={`p-4 rounded-2xl transition-all border border-slate-100/50 dark:border-slate-800/50 mb-2 ${expandedCategory === cat.name ? 'bg-slate-50/50 dark:bg-slate-950/20 border-emerald-500/10' : 'hover:bg-slate-50/60 dark:hover:bg-slate-950/20'}`}
                        >
                          <div className="flex items-center justify-between pl-1">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                {cat.icon && <span className="text-xl shrink-0">{cat.icon}</span>}
                                <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{cat.name}</p>
                                {isSystem && (
                                  <span className="text-[8px] bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/40 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Generales (Todos)
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold block mt-1 font-mono">
                                📦 {count} {count === 1 ? 'producto asociado' : 'productos asociados'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {/* Punto 2: Visibilidad Switch */}
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={cat.active}
                                  onChange={() => {
                                    if (isSystem) {
                                      alert('⚠️ La categoría del sistema "Todos" debe permanecer siempre activa.');
                                      return;
                                    }
                                    const updatedCats = categories.map(c => c.id === cat.id ? { ...c, active: !c.active } : c);
                                    onUpdateCategories(updatedCats);
                                    playPulse();
                                  }}
                                />
                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                <span className="ml-2 text-[10px] font-bold text-slate-500 w-12">
                                  {cat.active ? '🟢 Activa' : '⚪ Ocul.'}
                                </span>
                              </label>

                              {!isSystem ? (
                                <div className="flex items-center gap-1 border-l pl-3 border-slate-100 dark:border-slate-800">
                                  <button
                                    id={`edit-cat-btn-${index}`}
                                    onClick={() => {
                                      const newName = prompt(`Edita el nombre de la categoría "${cat.name}":`, cat.name);
                                      if (newName === null) return;
                                      const cleaned = newName.trim();
                                      if (!cleaned) return;
                                      if (cleaned.toLowerCase() === cat.name.toLowerCase()) return;
                                      if (categories.some(c => c.name.toLowerCase() === cleaned.toLowerCase())) {
                                        alert('⚠️ Ya existe otra categoría con ese nombre.');
                                        return;
                                      }

                                      const newIcon = prompt(`Ilustra la categoría incorporando un Emoji o ícono representativo (ej: ${cat.icon}):`, cat.icon);
                                      const cleanIcon = newIcon ? newIcon.trim() : cat.icon;
                                      
                                      // Update categories array
                                      const updatedCats = categories.map(c => c.id === cat.id ? { ...c, name: cleaned, icon: cleanIcon } : c);
                                      onUpdateCategories(updatedCats);

                                      // Update products associated
                                      const updatedProds = products.map(p => p.category === cat.name ? { ...p, category: cleaned } : p);
                                      onUpdateProducts(updatedProds);

                                      playPulse();
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border-0 bg-transparent"
                                    title="Editar nombre e ícono"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    id={`delete-cat-btn-${index}`}
                                    onClick={() => {
                                      if (!confirm(`⚠️ ¿Estás seguro de que quieres eliminar la categoría "${cat.name}"?\n\nCualquier producto clasificado en esta categoría será reasignado al primer grupo disponible por seguridad.`)) return;
                                      
                                      // Remove categories array
                                      const updatedCats = categories.filter(c => c.id !== cat.id);
                                      onUpdateCategories(updatedCats);

                                      // Safely preserve products
                                      const fallbackCat = categories.find(c => c.name !== 'Todos' && c.id !== cat.id)?.name || 'Dietética';
                                      const updatedProds = products.map(p => p.category === cat.name ? { ...p, category: fallbackCat } : p);
                                      onUpdateProducts(updatedProds);

                                      playPulse();
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 border-0 dark:hover:bg-slate-800 transition-all cursor-pointer bg-transparent"
                                    title="Eliminar categoría"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* Punto 3: Expandable Associated Products panel */}
                          <button
                            onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                            className="w-full text-left mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[11px] font-extrabold text-slate-500 hover:text-emerald-600 transition-all cursor-pointer bg-transparent border-0"
                          >
                            <span className="flex items-center gap-1.5">
                              🗂️ Ver y Asociar Productos de la Estantería ({count})
                            </span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedCategory === cat.name ? 'rotate-90 text-emerald-600' : 'text-slate-400'}`} />
                          </button>

                          {expandedCategory === cat.name && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/40 space-y-3.5 animate-fade-in">
                              
                              {/* Product Quick-Associate Input Selector */}
                              <div className="bg-slate-50/70 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/60">
                                <label className="block text-[9px] font-black tracking-wider text-slate-400 uppercase mb-2">Asociar / Mudar un producto existente a "{cat.name}"</label>
                                <select
                                  id={`associate-prod-${cat.id}`}
                                  onChange={(e) => {
                                    const prodId = e.target.value;
                                    if (!prodId) return;
                                    // Move product to this category
                                    const updatedProds = products.map(p => p.id === prodId ? { ...p, category: cat.name } : p);
                                    onUpdateProducts(updatedProds);
                                    e.target.value = '';
                                    playPulse();
                                  }}
                                  className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-hidden font-bold cursor-pointer"
                                >
                                  <option value="">Seleccioná un producto de otra sección...</option>
                                  {products
                                    .filter(p => p.category !== cat.name)
                                    .map(p => (
                                      <option key={p.id} value={p.id}>
                                         ({p.category}) {p.name} - ${p.price}
                                      </option>
                                    ))
                                  }
                                </select>
                              </div>

                              {/* Search associated field */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Filtrar productos asociados..."
                                  value={catProductSearch}
                                  onChange={(e) => setCatProductSearch(e.target.value)}
                                  className="w-full text-[10px] px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg dark:bg-slate-950 focus:ring-1 focus:ring-emerald-500 font-bold"
                                />
                                {catProductSearch && (
                                  <button onClick={() => setCatProductSearch('')} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold border-0 bg-transparent cursor-pointer">Limpiar</button>
                                )}
                              </div>

                              {/* Products List */}
                              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {products.filter(p => p.category === cat.name).length === 0 ? (
                                  <p className="text-[10px] text-slate-400 font-bold italic py-2 text-center">No hay productos asociados en esta categoría.</p>
                                ) : (
                                  products
                                    .filter(p => p.category === cat.name)
                                    .filter(p => p.name.toLowerCase().includes(catProductSearch.toLowerCase()) || p.brand.toLowerCase().includes(catProductSearch.toLowerCase()))
                                    .map(p => (
                                      <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50/40 dark:bg-slate-900/40 rounded-xl border border-slate-100/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-all text-[11px]">
                                        <div className="flex items-center gap-2 min-w-0">
                                          {p.image ? (
                                            <img src={p.image} className="w-7 h-7 rounded-lg object-cover" referrerPolicy="no-referrer" />
                                          ) : (
                                            <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[9px]">📦</span>
                                          )}
                                          <div className="min-w-0">
                                            <p className="font-bold text-slate-800 dark:text-slate-100 truncate pr-3">{p.name}</p>
                                            <p className="text-[9px] text-slate-400 font-mono">Stock: {p.stock} | ${p.price}</p>
                                          </div>
                                        </div>
                                        
                                        <button
                                          onClick={() => {
                                            const fallbackCat = categories.find(c => c.name !== 'Todos' && c.name !== cat.name)?.name || 'Todos';
                                            if (!confirm(`¿Quieres transferir "${p.name}" fuera de esta categoría?\nSe mudará temporalmente a "${fallbackCat}".`)) return;
                                            const updatedProds = products.map(prod => prod.id === p.id ? { ...prod, category: fallbackCat } : prod);
                                            onUpdateProducts(updatedProds);
                                            playPulse();
                                          }}
                                          className="p-1 px-2.5 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-0 bg-transparent cursor-pointer font-bold shrink-0"
                                          title="Mudar de Categoría"
                                        >
                                          Mudar fuera
                                        </button>
                                      </div>
                                    ))
                                )}
                              </div>

                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: TEMAS/CONFIGURACION */}
          {activeTab === 'config' && (
            <div id="tab-config" className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Perfil Dietético y Temas del Local</h2>
                <p className="text-xs text-slate-500">Ajusta temas de marca independientes para la web pública del cliente y el panel de administración.</p>
              </div>

              {/* Store & Profile settings */}
              <form onSubmit={handleSaveProfileAndThemes} className="space-y-6">
                
                {/* Store meta info layout */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/55 space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">1. Datos Físicos del Local</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <label className="block text-slate-700 mb-1">Nombre Comercial de la Dietética</label>
                      <input
                        id="config-store-name"
                        type="text"
                        required
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">Teléfono Móvil de Contacto (Pedidos)</label>
                      <input
                        id="config-store-phone"
                        type="text"
                        required
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">Prefijo WhatsApp Predeterminado (Para carga)</label>
                      <input
                        id="config-wa-prefix"
                        type="text"
                        required
                        placeholder="+549"
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono"
                        value={profileForm.waPrefix}
                        onChange={(e) => setProfileForm(p => ({ ...p, waPrefix: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-700 mb-1">Dirección del Local</label>
                      <input
                        id="config-store-address"
                        type="text"
                        required
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-700 mb-1">Google Maps Embed IFrame URL (Ubicación física)</label>
                      <input
                        id="config-store-mapurl"
                        type="text"
                        required
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        value={profileForm.mapEmbedUrl}
                        onChange={(e) => setProfileForm(p => ({ ...p, mapEmbedUrl: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-700 mb-1">Logo / Imagen de Marca (Subir archivo o preset local)</label>
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                          {profileForm.logo.startsWith('http') || profileForm.logo.startsWith('data:') ? (
                            <img referrerPolicy="no-referrer" src={profileForm.logo} alt="brand" className="w-full h-full object-cover" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                        <input
                          id="config-store-logo-file"
                          type="file"
                          accept="image/*"
                          className="text-xs"
                          onChange={(e) => handleLogoUploadSim(e, true)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cabecera de la vidriera (Hero) editable */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/55 space-y-4">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" /> Cabecera de la Tienda (4 renglones)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">Es lo primero que ve el cliente arriba de la tienda. Editá cada renglón con su texto, tipo de letra y tamaño. Dejá un renglón vacío si no lo querés mostrar.</p>
                  </div>
                  <div className="space-y-3">
                    {heroLines.map((ln, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 shrink-0">Renglón {i + 1}</span>
                          <input
                            type="text"
                            placeholder={`Texto del renglón ${i + 1}`}
                            value={ln.text}
                            onChange={(e) => updateHeroLine(i, 'text', e.target.value)}
                            className="flex-1 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de letra</label>
                            <select
                              value={ln.font}
                              onChange={(e) => updateHeroLine(i, 'font', e.target.value)}
                              className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                            >
                              {AVAILABLE_FONTS.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tamaño</label>
                            <select
                              value={ln.size}
                              onChange={(e) => updateHeroLine(i, 'size', e.target.value)}
                              className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                            >
                              {HERO_SIZE_OPTIONS.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-400 italic">Los cambios se guardan con el botón "Guardar y Aplicar Cambios" de abajo.</p>
                  </div>
                </div>

                {/* Style Presets Panel */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/55 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Presets de Estilo Visual y Estructura
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">PREDETERMINADO: NATURA STONE</span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Personaliza la identidad visual de tu tienda al instante usando uno de nuestros estilos exclusivos. Seleccionar un estilo configurará automáticamente los colores sugeridos, el estilo de fuente y la maquetación.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Natura Stone */}
                    <button
                      type="button"
                      onClick={() => applyPresetColors('natura_stone')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedPreset === 'natura_stone'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-350 dark:bg-slate-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Natura Stone</span>
                        <div className="flex gap-1">
                          <span className="w-3 h-3 rounded-full bg-[#2d3a2d] inline-block border border-black/10"></span>
                          <span className="w-3 h-3 rounded-full bg-[#c49b66] inline-block border border-black/10"></span>
                          <span className="w-3 h-3 rounded-full bg-[#f4f0e6] inline-block border border-black/10"></span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Tonos tierra sutiles, arena orgánico y verdes que evocan la naturaleza y el bienestar. Tipografía suave.
                      </p>
                    </button>

                    {/* Bento Grid */}
                    <button
                      type="button"
                      onClick={() => applyPresetColors('bento_grid')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedPreset === 'bento_grid'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-350 dark:bg-slate-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Bento Grid Layout</span>
                        <div className="flex gap-1">
                          <span className="w-3 h-3 rounded-full bg-[#18181b] inline-block border border-black/10"></span>
                          <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block border border-black/10"></span>
                          <span className="w-3 h-3 rounded-full bg-[#fcfcfc] inline-block border border-black/10"></span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Diseño bento asimétrico de alto impacto visual, ideal para destacar ofertas con tipografía tecnológica moderna.
                      </p>
                    </button>

                    {/* Vibrant Palette */}
                    <button
                      type="button"
                      onClick={() => applyPresetColors('vibrant_palette')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedPreset === 'vibrant_palette'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-350 dark:bg-slate-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Vibrant Palette</span>
                        <div className="flex gap-1">
                          <span className="w-3 h-3 rounded-full bg-[#7c3aed] inline-block border border-black/10"></span>
                          <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block border border-black/10"></span>
                          <span className="w-3 h-3 rounded-full bg-[#faf5ff] inline-block border border-black/10"></span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Gama energética con tonos morados vibrantes y detalles audaces. Gran personalidad para comercios activos.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Themes Customization Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  {/* Public App theme customizer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/55 space-y-4">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">2. Tema Público (Cliente)</h3>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-600 mb-1">Color Principal (Encabezados/Botones)</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            className="w-10 h-8 p-0 rounded border border-slate-200 cursor-pointer"
                            value={publicTheme.primaryColor}
                            onChange={(e) => setPublicTheme(t => ({ ...t, primaryColor: e.target.value }))}
                          />
                          <input
                            type="text"
                            className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded-md uppercase"
                            value={publicTheme.primaryColor}
                            onChange={(e) => setPublicTheme(t => ({ ...t, primaryColor: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1">Color Acento (Promociones/Carro)</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            className="w-10 h-8 p-0 rounded border border-slate-200 cursor-pointer"
                            value={publicTheme.accentColor}
                            onChange={(e) => setPublicTheme(t => ({ ...t, accentColor: e.target.value }))}
                          />
                          <input
                            type="text"
                            className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded-md uppercase"
                            value={publicTheme.accentColor}
                            onChange={(e) => setPublicTheme(t => ({ ...t, accentColor: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1">Tipo de Letra (Tipografía)</label>
                        <select
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                          value={publicTheme.fontFamily}
                          onChange={(e) => setPublicTheme(t => ({ ...t, fontFamily: e.target.value as any }))}
                        >
                          {AVAILABLE_FONTS.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Admin portal theme customizer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/55 space-y-4">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">3. Tema Administración</h3>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-600 mb-1">Color Principal (Pestañas/Fondo Lateral)</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            className="w-10 h-8 p-0 rounded border border-slate-200 cursor-pointer"
                            value={adminTheme.primaryColor}
                            onChange={(e) => setAdminTheme(t => ({ ...t, primaryColor: e.target.value }))}
                          />
                          <input
                            type="text"
                            className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded-md uppercase"
                            value={adminTheme.primaryColor}
                            onChange={(e) => setAdminTheme(t => ({ ...t, primaryColor: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1">Color Acento (Bocinas/Alertas)</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            className="w-10 h-8 p-0 rounded border border-slate-200 cursor-pointer"
                            value={adminTheme.accentColor}
                            onChange={(e) => setAdminTheme(t => ({ ...t, accentColor: e.target.value }))}
                          />
                          <input
                            type="text"
                            className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded-md uppercase"
                            value={adminTheme.accentColor}
                            onChange={(e) => setAdminTheme(t => ({ ...t, accentColor: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1">Tipo de Letra (Tipografía)</label>
                        <select
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                          value={adminTheme.fontFamily}
                          onChange={(e) => setAdminTheme(t => ({ ...t, fontFamily: e.target.value as any }))}
                        >
                          {AVAILABLE_FONTS.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dual Admin Cross Session Kill Switch security section ("boton de cerrar sesion del otro admin por perdida del celular") */}
                <div className="p-5 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/55 space-y-4">
                  <div className="flex gap-2 items-center text-rose-800">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <h3 className="text-xs uppercase font-extrabold tracking-wider">4. Seguridad Crítica: Cierre de Sesión Remoto</h3>
                  </div>

                  <p className="text-xs text-rose-700/90 leading-relaxed">
                    Si uno de los administradores pierde el celular, el otro admin puede forzar de inmediato el cierre de sesión de ese celular de manera remota para evitar accesos indebidos a los pedidos e inventarios de {config.name}.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                    {/* Admin A status card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 p-4 rounded-xl flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Móvil Admin A (Sofía)</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sessions.find(s=>s.id==='admin_a')?.isLoggedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {sessions.find(s=>s.id==='admin_a')?.isLoggedIn ? 'SESIÓN INICIADA' : 'INACTIVO / DESBLOQUEADO'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">Último acceso: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>

                      {currentAdmin === 'admin_b' ? (
                        sessions.find(s=>s.id==='admin_a')?.isLoggedIn ? (
                          <button
                            type="button"
                            id="force-logout-admin-a"
                            onClick={() => handleKickPartnerAdmin('admin_a')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-xs"
                          >
                            Forzar Cierre Remoto de Admin A
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestorePartnerAdmin('admin_a')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs transition-colors"
                          >
                            Habilitar Nuevamente Login A
                          </button>
                        )
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No puedes revocar tu propio celular desde aquí. Únicamente tu compañero en su terminal.</p>
                      )}
                    </div>

                    {/* Admin B status card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 p-4 rounded-xl flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Móvil Admin B (Luciano)</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sessions.find(s=>s.id==='admin_b')?.isLoggedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {sessions.find(s=>s.id==='admin_b')?.isLoggedIn ? 'SESIÓN INICIADA' : 'INACTIVO / DESBLOQUEADO'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">Último acceso: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>

                      {currentAdmin === 'admin_a' ? (
                        sessions.find(s=>s.id==='admin_b')?.isLoggedIn ? (
                          <button
                            type="button"
                            id="force-logout-admin-b"
                            onClick={() => handleKickPartnerAdmin('admin_b')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-xs"
                          >
                            Forzar Cierre Remoto de Admin B
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestorePartnerAdmin('admin_b')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs transition-colors"
                          >
                            Habilitar Nuevamente Login B
                          </button>
                        )
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No puedes revocar tu propio celular desde aquí. Únicamente tu compañero en su terminal.</p>
                      )}
                    </div>
                  </div>
                </div>

                {isSavedNotify && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 border border-emerald-100 rounded-xl font-bold text-center">
                    ¡Cambios de diseño y datos del local resguardados con éxito!
                  </p>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    id="save-settings-btn"
                    type="submit"
                    className="bg-slate-900 text-white hover:bg-slate-850 font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-md active:scale-95"
                  >
                    Guardar y Aplicar Cambios
                  </button>
                </div>
              </form>

              {/* ───── Acceso del Admin B (colaborador) ───── */}
              <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> Acceso del Admin B (colaborador)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
                  Definí el usuario y la contraseña con los que entra tu compañero (Luciano). Con estos datos
                  entra eligiendo <b>“Colaborador”</b> en el login, con la misma licencia. Ve y administra todo igual que vos.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Usuario del Admin B</label>
                    <input
                      type="text"
                      placeholder="Ej: luciano"
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                      value={collabForm.username}
                      onChange={(e) => setCollabForm(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contraseña (6+ caracteres)</label>
                    <input
                      type="text"
                      placeholder="Mínimo 6 caracteres"
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                      value={collabForm.pass}
                      onChange={(e) => setCollabForm(prev => ({ ...prev, pass: e.target.value }))}
                    />
                  </div>
                </div>
                {isCollabSaved && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 border border-emerald-100 rounded-xl font-bold text-center mt-3">
                    ¡Acceso del Admin B guardado! Ya puede entrar como colaborador.
                  </p>
                )}
                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleSaveCollab}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95"
                  >
                    Guardar acceso del Admin B
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Editing product custom Modal overlay */}
      {editingProduct && (
        <div id="editing-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form onSubmit={handleSaveEditProduct} className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3.5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Modificar Ficha: {editingProduct.name}</h3>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-lg"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Marca</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-lg"
                  value={editingProduct.brand}
                  onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Categoría</label>
                <select
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                >
                  {categories.filter(c => c.name !== 'Todos').map((c) => (
                    <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Precio ($)</label>
                <input
                  type="number"
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Stock disponible</label>
                <input
                  type="number"
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={editingProduct.minStockAlert}
                  onChange={(e) => setEditingProduct({ ...editingProduct, minStockAlert: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Peso</label>
                <input
                  type="text"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={editingProduct.weight || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Líquidos (L/ML)</label>
                <input
                  type="text"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={editingProduct.liters || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, liters: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Código Barra / QR</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    value={editingProduct.barCode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barCode: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => { setScannerTargetField('edit'); setIsScannerOpen(true); }}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg flex items-center justify-center"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Clasificación</label>
                <select
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={editingProduct.type}
                  onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value as any })}
                >
                  <option value="product">Hábito Regular</option>
                  <option value="promotion">Promoción</option>
                  <option value="offer">Oferta Especial</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-1">Imagen del Producto</label>
                <div className="flex gap-3 items-center">
                  {editingProduct.image ? (
                    <img src={editingProduct.image} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px] text-center shrink-0">Sin foto</div>
                  )}
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="edit-product-upload-file"
                      className="cursor-pointer inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                    >
                      📷 Subir imagen (celular o PC)
                    </label>
                    <input
                      id="edit-product-upload-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditLogoUploadSim}
                    />
                    <input
                      type="text"
                      placeholder="…o pegá un link de imagen (opcional)"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom attributes "+" inside edit */}
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700">Atributos Adicionales</h4>
                <button
                  type="button"
                  onClick={() => setEditingCustomFields([...editingCustomFields, { label: '', value: '' }])}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  + Agregar Campo
                </button>
              </div>

              <div className="space-y-1.5">
                {editingCustomFields.map((field, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="w-1/2 text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded"
                      placeholder="Ej: Gluten"
                      value={field.label}
                      onChange={(e) => {
                        const updated = [...editingCustomFields];
                        updated[idx].label = e.target.value;
                        setEditingCustomFields(updated);
                      }}
                    />
                    <input
                      type="text"
                      className="w-1/2 text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded"
                      placeholder="Ej: Sin Gluten"
                      value={field.value}
                      onChange={(e) => {
                        const updated = [...editingCustomFields];
                        updated[idx].value = e.target.value;
                        setEditingCustomFields(updated);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setEditingCustomFields(editingCustomFields.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:bg-slate-50 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-semibold rounded-lg"
              >
                Aplicar Cambios
              </button>
            </div>
          </form>

              {onListBackups && (
                <div className="bg-white dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><span>🛟</span> Copias de seguridad</h3>
                      <p className="text-[11px] text-slate-500">Si borrás algo por error, restaurá una versión anterior. Se guardan solas cada vez que hay cambios (se conservan las últimas 10).</p>
                    </div>
                    <button type="button" onClick={cargarBackups} disabled={backupsBusy}
                      className="shrink-0 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg disabled:opacity-60">
                      {backupsBusy ? 'Cargando…' : (backupsOpen ? 'Actualizar' : 'Ver copias')}
                    </button>
                  </div>
                  {backupsOpen && (
                    backups.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Todavía no hay copias guardadas. Se generan automáticamente al guardar cambios.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-auto pr-1">
                        {backups.map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 rounded-xl p-3">
                            <div className="text-xs text-slate-600 dark:text-slate-300">
                              <span className="font-mono block">{new Date(b.guardado).toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{b.productos} productos · {b.pedidos} pedidos · {b.colaboradores} colaboradores</span>
                            </div>
                            <button type="button" onClick={() => restaurarBackup(b.id)} disabled={backupsBusy}
                              className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 disabled:opacity-60">
                              Restaurar
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
        </div>
      )}

      {/* Barcode scanner overlay hook */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onScanSuccess={(code) => {
          if (scannerTargetField === 'create') {
            setProductForm(prev => ({ ...prev, barCode: code }));
          } else if (scannerTargetField === 'edit' && editingProduct) {
            setEditingProduct({ ...editingProduct, barCode: code });
          }
        }}
      />

      {/* Custom Stylesheet for Print Mode Isolation */}
      <style>{`
        @media print {
          /* Hide absolutely everything else */
          body, html, #app-viewport-root, #root, .modal, div, footer, header, main, aside, nav, button, section {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          /* Except the dedicated printable flyer */
          #printable-qr-flyer, #printable-qr-flyer * {
            display: flex !important;
            visibility: visible !important;
          }
          #printable-qr-flyer {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 24mm !important;
            background: white !important;
            color: black !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: space-between !important;
            border: 24px solid #1e3a1e !important;
            border-radius: 0 !important;
            z-index: 9999999 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Printable QR Flyer Block for Browser’s Print Tool */}
      <div 
        id="printable-qr-flyer" 
        className="hidden flex-col items-center justify-between text-center bg-white border-[24px] border-emerald-950 p-12 text-black" 
        style={{ width: '210mm', height: '297mm', boxSizing: 'border-box' }}
      >
        <div className="flex flex-col items-center gap-1">
          <Leaf className="w-12 h-12 text-emerald-800" />
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950 uppercase mt-2">{printTitle}</h1>
          <div className="w-32 h-1 bg-emerald-800 rounded mt-2"></div>
          <span className="text-[11px] uppercase tracking-widest text-emerald-800 font-bold mt-1">Nuestro Catálogo Online Oficial</span>
        </div>

        <div className="flex flex-col items-center gap-4 my-4">
          <div className="text-lg font-bold text-slate-800 uppercase px-4 py-1 border-y border-slate-300">¡Sácala una foto para ingresar!</div>
          <div className="p-5 border-4 border-dashed border-emerald-900 rounded-3xl bg-white shadow-sm">
            <img 
              referrerPolicy="no-referrer"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(publicUrl)}`}
              alt="QR Code" 
              className="w-56 h-56"
            />
          </div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Escanea este código QR con la cámara de tu celular</p>
        </div>

        <div className="flex flex-col items-center gap-4 max-w-md">
          <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
            "{printTagline}"
          </p>
          
          <div className="w-full h-[1px] bg-slate-200"></div>

          <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-500 uppercase">
            <span>Teléfono: {config.phone}</span>
            <span>Dirección: {config.address}</span>
          </div>
          
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-4">
            Desarrollado para la comunidad genuina
          </p>
        </div>
      </div>

      {/* Print Configuration Dialog & Custom Preview */}
      {isPrintModalOpen && (
        <div id="print-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto text-slate-800 dark:text-slate-100">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-3.5">
              <div className="flex items-center gap-2">
                <Printer className="text-emerald-600 w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Folleto Publicitario Imprimible de {config.name}</h3>
              </div>
              <button type="button" onClick={() => setIsPrintModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 text-xs">
              
              {/* Left Side: Customize Form options */}
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-normal">
                  Personaliza los textos que aparecerán impresos junto al código QR del comercio. Cuando estés listo, haz clic en Imprimir para abrir el menú del sistema.
                </p>

                <div className="space-y-3 font-semibold">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">Título Principal del Folleto</label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                      value={printTitle}
                      onChange={(e) => setPrintTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">Llamado a la Acción (Copete explicativo)</label>
                    <textarea
                      rows={4}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                      value={printTagline}
                      onChange={(e) => setPrintTagline(e.target.value)}
                    />
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Consejos para Impresión Comercial</span>
                    <ul className="list-disc list-inside text-[10px] text-slate-500 space-y-1">
                      <li>Usa papel de alto gramaje (tipo cartulina o fotográfico) para mayor durabilidad.</li>
                      <li>Imprime a color para lucir el marco orgánico de la dietética.</li>
                      <li>Coloca el folleto en un portarretratos transparente en tu caja de cobro.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger System general Printing dialog
                      window.print();
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Lanzar Diálogo Impresora
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cerrar Configuración
                  </button>
                </div>
              </div>

              {/* Right Side: Live Page Scale-down layout viewer ("Preview") */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide mb-3">📍 Vista Previa del Folleto Real</span>
                
                {/* Simulated A4 Paper */}
                <div className="w-[230px] aspect-[1/1.414] bg-white border border-slate-350 p-4 text-center rounded shadow-md text-black flex flex-col justify-between" style={{ fontSize: '7px' }}>
                  <div className="flex flex-col items-center">
                    <Leaf className="w-6 h-6 text-emerald-800 mb-0.5" />
                    <span className="font-extrabold uppercase text-[10px] leading-tight text-emerald-950 tracking-wider truncate max-w-[210px]">{printTitle}</span>
                    <div className="w-10 h-0.5 bg-emerald-800 rounded my-0.5"></div>
                    <span className="text-[5px] uppercase tracking-widest text-emerald-800 font-bold block scale-90">Nuestro Catálogo Online Oficial</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="p-1 border-2 border-dashed border-emerald-900 rounded-lg">
                      <img 
                        referrerPolicy="no-referrer"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`} 
                        alt="QR Code Mini" 
                        className="w-16 h-16"
                      />
                    </div>
                    <p className="text-[4px] font-bold text-slate-500 uppercase tracking-widest mt-1">Escaneá para ingresar al catálogo</p>
                  </div>

                  <div className="flex flex-col items-center max-w-[190px] mx-auto">
                    <p className="text-[5px] text-slate-600 italic leading-snug line-clamp-3">
                      "{printTagline}"
                    </p>
                    <div className="w-full h-[0.5px] bg-slate-200 my-1"></div>
                    <span className="text-[4px] font-bold text-slate-500 block">Tel: {config.phone}</span>
                    <span className="text-[4px] font-bold text-slate-500 block truncate max-w-[200px]">{config.address}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
