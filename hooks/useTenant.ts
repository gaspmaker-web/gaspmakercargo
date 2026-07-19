"use client";

import { useState, useEffect } from 'react';

export interface TenantConfig {
  id: string;
  slug: string;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  plan: string;
}

// ==========================================
// 🏢 CARGOOS: useTenant Hook (Client Side)
// ==========================================
export function useTenant() {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch('/api/tenant');
        if (res.ok) {
          const data = await res.json();
          setTenant(data.tenant);
        }
      } catch (error) {
        console.error('Error fetching tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  return { tenant, loading };
}