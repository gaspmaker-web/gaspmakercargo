// app/[locale]/cargoos/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface TenantPlan {
  plan: string;
  status: string;
  setupPaid: boolean;
  monthlyPrice: number;
  nextBilling: string | null;
  notes: string | null;
}

interface Tenant {
  id: string;
  company_name: string;
  slug: string;
  custom_domain: string | null;
  owner_name: string | null;
  owner_email: string;
  owner_phone: string | null;
  created_at: string;
  tenantPlan: TenantPlan | null;
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-blue-100 text-blue-800',
  growth: 'bg-purple-100 text-purple-800',
  pro: 'bg-amber-100 text-amber-800',
};

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function CargoOSAdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);

  async function login() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cargoos/tenants', {
        headers: { 'x-admin-secret': secret },
      });
      if (!res.ok) {
        setError('Credenciales incorrectas');
        return;
      }
      const data = await res.json();
      setTenants(data.tenants);
      setAuthed(true);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTenants() {
    const res = await fetch('/api/cargoos/tenants', {
      headers: { 'x-admin-secret': secret },
    });
    const data = await res.json();
    setTenants(data.tenants);
  }

  async function updateStatus(tenantId: string, status: string) {
    await fetch(`/api/cargoos/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ status }),
    });
    await fetchTenants();
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">🚢</div>
            <h1 className="text-white text-xl font-bold">CargoOS Admin</h1>
            <p className="text-gray-400 text-sm mt-1">Acceso restringido</p>
          </div>
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm mb-3 focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚢</span>
          <div>
            <h1 className="font-bold text-lg">CargoOS Admin</h1>
            <p className="text-gray-400 text-xs">{tenants.length} operadores</p>
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo operador
        </button>
      </div>

      {/* Tabla de tenants */}
      <div className="p-6">
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-white">{tenant.company_name}</h2>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {tenant.slug} {tenant.custom_domain && `· ${tenant.custom_domain}`}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {tenant.owner_name} · {tenant.owner_email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {tenant.tenantPlan && (
                    <>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PLAN_COLORS[tenant.tenantPlan.plan] || 'bg-gray-700 text-gray-300'}`}>
                        {tenant.tenantPlan.plan}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[tenant.tenantPlan.status] || 'bg-gray-700 text-gray-300'}`}>
                        {tenant.tenantPlan.status}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-800">
                <span className="text-gray-400 text-xs">
                  Setup: {tenant.tenantPlan?.setupPaid ? '✅ Pagado' : '⏳ Pendiente'}
                </span>
                <span className="text-gray-400 text-xs">
                  ${((tenant.tenantPlan?.monthlyPrice || 0) / 100).toFixed(0)}/mes
                </span>
                <span className="text-gray-600 text-xs ml-auto">
                  Desde {new Date(tenant.created_at).toLocaleDateString()}
                </span>
                <select
                  value={tenant.tenantPlan?.status || 'trial'}
                  onChange={(e) => updateStatus(tenant.id, e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nuevo tenant */}
      {showNew && (
        <NewTenantModal
          secret={secret}
          onClose={() => setShowNew(false)}
          onCreated={fetchTenants}
        />
      )}
    </div>
  );
}

function NewTenantModal({
  secret,
  onClose,
  onCreated,
}: {
  secret: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    company_name: '',
    slug: '',
    custom_domain: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    plan: 'starter',
    setup_paid: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cargoos/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al crear');
        return;
      }
      onCreated();
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-white font-bold text-lg mb-5">Nuevo operador</h2>
        <div className="space-y-3">
          {[
            { key: 'company_name', label: 'Empresa *' },
            { key: 'slug', label: 'Slug * (ej: miempresa)' },
            { key: 'custom_domain', label: 'Dominio (ej: miempresa.com)' },
            { key: 'owner_name', label: 'Nombre del operador' },
            { key: 'owner_email', label: 'Email *' },
            { key: 'owner_phone', label: 'Teléfono' },
          ].map(({ key, label }) => (
            <input
              key={key}
              placeholder={label}
              value={form[key as keyof typeof form] as string}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          ))}
          <select
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="starter">Starter — $149/mes</option>
            <option value="growth">Growth — $299/mes</option>
            <option value="pro">Pro — $499/mes</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={form.setup_paid}
              onChange={(e) => setForm({ ...form, setup_paid: e.target.checked })}
              className="rounded"
            />
            Setup fee pagado ($500)
          </label>
        </div>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2.5 text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear operador'}
          </button>
        </div>
      </div>
    </div>
  );
}