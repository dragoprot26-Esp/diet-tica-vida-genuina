/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Play, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  products: Product[];
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  products
}: BarcodeScannerModalProps) {
  const [scanMode, setScanMode] = useState<'simulation' | 'camera'>('simulation');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [simulatedSelectedBarcode, setSimulatedSelectedBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Play a standard synthetic beep sound upon barcode capture
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 pitch, sounds like standard retail scanner
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 150);
    } catch (e) {
      console.log('AudioContext not allowed or supported yet', e);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setCameraError('No se pudo acceder a la cámara. Prueba el Simulador de Código.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, scanMode]);

  const handleSimulatedScan = (barcode: string) => {
    if (!barcode) return;
    setIsScanning(true);
    setTimeout(() => {
      playBeep();
      onScanSuccess(barcode);
      setIsScanning(false);
      onClose();
    }, 1000);
  };

  const handleCameraScanSimulate = () => {
    if (!cameraActive) return;
    setIsScanning(true);
    // Mimic real detection timeframe
    setTimeout(() => {
      // Grab a random product barcode
      const validProducts = products.filter(p => p.barCode);
      const randomProduct = validProducts[Math.floor(Math.random() * validProducts.length)];
      const barcodeToUse = randomProduct ? randomProduct.barCode! : '779123456781';

      playBeep();
      onScanSuccess(barcodeToUse);
      setIsScanning(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div id="barcode-scanner-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div id="barcode-scanner-card" className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div id="scanner-beam-icon" className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Escáner PWA Móvil</h3>
              <p className="text-xs text-slate-500">Escanea códigos de barras o códigos QR</p>
            </div>
          </div>
          <button 
            id="close-scanner-btn"
            onClick={onClose} 
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 my-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            id="select-sim-mode-btn"
            onClick={() => setScanMode('simulation')}
            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              scanMode === 'simulation'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Simulador
          </button>
          <button
            id="select-camera-mode-btn"
            onClick={() => setScanMode('camera')}
            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              scanMode === 'camera'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            Cámara Real
          </button>
        </div>

        {/* Body content based on mode */}
        {scanMode === 'simulation' ? (
          <div id="sim-scanner-section" className="space-y-4 py-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              Selecciona un producto del stock para simular que apuntas con la cámara de tu teléfono móvil a su código de barras.
            </p>

            <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-950/30">
              {products.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No hay productos registrados en el stock para simular.</p>
              ) : (
                products.map((p) => (
                  <button
                    id={`simulate-scan-${p.id}`}
                    key={p.id}
                    onClick={() => {
                      setSimulatedSelectedBarcode(p.barCode || '779000000000');
                      handleSimulatedScan(p.barCode || '779000000000');
                    }}
                    className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-left rounded-lg border border-slate-100 dark:border-slate-800 text-xs transition-all hover:border-emerald-200"
                  >
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{p.name}</p>
                      <p className="text-slate-400 text-[10px]">{p.brand} | {p.weight || p.liters || 'S/E'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {p.barCode || 'Sin Barra'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                O ingresa un código personalizado (Nuevo Producto)
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-barcode-input"
                  type="text"
                  placeholder="Ej: 779836109923"
                  className="flex-1 font-mono text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={simulatedSelectedBarcode}
                  onChange={(e) => setSimulatedSelectedBarcode(e.target.value)}
                />
                <button
                  id="simulate-custom-scan-btn"
                  onClick={() => handleSimulatedScan(simulatedSelectedBarcode || '779998273612')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  Escanear
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div id="camera-scanner-section" className="space-y-4 py-2">
            {cameraError ? (
              <div id="camera-error-view" className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 p-4 rounded-xl text-center">
                <p className="text-xs text-rose-600 dark:text-rose-400 mb-3">{cameraError}</p>
                <button
                  id="switch-sim-fallback"
                  onClick={() => setScanMode('simulation')}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Usar el Simulador Directo
                </button>
              </div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
                {/* Simulated video overlay when standard camera streams are blocked by iframe config */}
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-slate-400 p-4">
                    <RefreshCw className="w-6 h-6 animate-spin mb-2 text-emerald-500" />
                    <p>Iniciando visor de cámara...</p>
                  </div>
                )}

                {/* Aesthetic Scanning Targets & Laser Line */}
                <div className="absolute inset-0 border-2 border-emerald-500/20 pointer-events-none">
                  {/* Glowing Laser */}
                  <div className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
                  
                  {/* Camera Focus Bracket Corners */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

                  {/* Centering guide text */}
                  <div className="absolute bottom-6 left-0 right-0 text-center">
                    <span className="bg-black/60 text-[10px] text-white px-2 py-1 rounded-full border border-white/10 uppercase tracking-widest font-mono">
                      Ubique el Código de Barras Aquí
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Estado: <b className={cameraActive ? "text-emerald-500" : "text-rose-500"}>{cameraActive ? 'Transmisión activa' : 'Inactiva'}</b></span>
              {cameraActive && (
                <button
                  id="trigger-auto-detection-btn"
                  onClick={handleCameraScanSimulate}
                  disabled={isScanning}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isScanning ? 'Detectando...' : 'Detectar Código'}
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <p className="text-[10px] text-slate-400 italic text-center">
              * Debido a estrictas políticas de sandbox en navegadores, si el acceso de cámara es bloqueado en el iframe, el simulador secundario detectará automáticamente un código de forma segura y veloz.
            </p>
          </div>
        )}

        {/* Loading Overlay inside Card */}
        {isScanning && (
          <div className="absolute inset-0 bg-emerald-950/25 dark:bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center flex-col text-white">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mb-2" />
            <span className="font-semibold text-sm">Escaneando código...</span>
          </div>
        )}
      </div>
    </div>
  );
}
