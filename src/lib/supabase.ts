/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * supabase.ts — Puente de compatibilidad. La lógica real vive en cloud.ts
 * (molde del ecosistema CyC: Auth real + sesión persistida + RLS por membresía).
 * Se mantienen los nombres que ya usa App.tsx para no romper imports.
 */

import {
  SB_URL, SB_KEY,
  validarLicencia,
  asegurarCuentaSeguraDueno as _asegurarDueno,
  asegurarCuentaSeguraColab,
} from './cloud';

export { SB_URL, SB_KEY };

export interface LicenseInfo {
  codigo: string;
  activa: boolean;
  nombre_negocio?: string;
  cliente_nombre?: string;
  fecha_vencimiento?: string;
  app_id?: string;
  app_destino?: string;
}

// Valida la licencia (idempotente). Devuelve la fila o null.
export async function checkLicense(code: string): Promise<LicenseInfo | null> {
  const d = await validarLicencia((code || '').trim().toUpperCase());
  return d as LicenseInfo | null;
}

// Login del colaborador (Admin B): crea/usa la cuenta segura y lo vincula.
// Devuelve un objeto si entró bien, o null si falló (App.tsx chequea `if (!collab)`).
export async function verifyCollaborator(tenantId: string, username: string, pass: string) {
  const res = await asegurarCuentaSeguraColab(username, pass, tenantId);
  return res.ok ? { ok: true, id: username } : null;
}

// Cuenta segura del dueño (Admin A): persiste la sesión para poder sincronizar.
export async function asegurarCuentaSeguraDueno(usuario: string, pass: string, codigo: string) {
  return _asegurarDueno(usuario, pass, codigo);
}
