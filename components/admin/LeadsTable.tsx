'use client';

import { useState } from 'react';
import { Phone, Mail, Calendar, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = ['new', 'contacted', 'interested', 'closed', 'lost'];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  interested: 'bg-purple-100 text-purple-700',
  closed: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function LeadsTable({ leads, locale }: { leads: any[]; locale: string }) {
  const [data, setData] = useState(leads);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(leadId: string, newStatus: string) {
    setUpdating(leadId);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(null);
    }
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
        <p className="text-gray-400 font-bold">No leads found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-4 font-bold text-gray-500 text-xs uppercase">Name</th>
              <th className="text-left px-6 py-4 font-bold text-gray-500 text-xs uppercase">Contact</th>
              <th className="text-left px-6 py-4 font-bold text-gray-500 text-xs uppercase">Date</th>
              <th className="text-left px-6 py-4 font-bold text-gray-500 text-xs uppercase">Status</th>
              <th className="text-left px-6 py-4 font-bold text-gray-500 text-xs uppercase">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">

                <td className="px-6 py-4">
                  <p className="font-bold text-gray-800">{lead.full_name}</p>
                  <p className="text-xs text-gray-400">ID: {lead.lead_id}</p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-blue-600 hover:underline text-xs">
                      <Mail size={12} />
                      {lead.email}
                    </a>
                    <a href={`tel:${lead.phone_number}`} className="flex items-center gap-1 text-green-600 hover:underline text-xs">
                      <Phone size={12} />
                      {lead.phone_number}
                    </a>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Calendar size={12} />
                    {lead.created_time
                      ? new Date(lead.created_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="relative">
                    <select
                      value={lead.status || 'new'}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      disabled={updating === lead.id}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer appearance-none pr-6 ${STATUS_COLORS[lead.status || 'new']} ${updating === lead.id ? 'opacity-50' : ''}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-2 pointer-events-none text-current opacity-60" />
                  </div>
                </td>

                <td className="px-6 py-4">
                  <p className="text-xs text-gray-400 italic">
                    {lead.notes || '—'}
                  </p>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
