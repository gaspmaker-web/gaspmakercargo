'use client';

import { useState } from 'react';
import { Phone, Mail, Calendar, ChevronDown, Search, X } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'new', 'contacted', 'interested', 'closed', 'lost'];

const STATUS_COLORS: Record<string, string> = {
  all:        'bg-gray-100 text-gray-700',
  new:        'bg-blue-100 text-blue-700',
  contacted:  'bg-yellow-100 text-yellow-700',
  interested: 'bg-purple-100 text-purple-700',
  closed:     'bg-green-100 text-green-700',
  lost:       'bg-red-100 text-red-700',
};

export default function LeadsTable({ leads, locale }: { leads: any[]; locale: string }) {
  const [data, setData]               = useState(leads);
  const [updating, setUpdating]       = useState<string | null>(null);
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue]     = useState('');

  // Filtrado local
  const filtered = data.filter((lead) => {
    const matchStatus = filter === 'all' || lead.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      lead.full_name?.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.phone_number?.includes(q);
    return matchStatus && matchSearch;
  });

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

  async function saveNote(leadId: string) {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteValue }),
      });
      if (res.ok) {
        setData((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, notes: noteValue } : l))
        );
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setEditingNote(null);
      setNoteValue('');
    }
  }

  return (
    <div className="space-y-4">

      {/* Filtros + Búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        
        {/* Filtros por status */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const count = s === 'all' ? data.length : data.filter((l) => l.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                  filter === s
                    ? STATUS_COLORS[s] + ' border-transparent shadow-sm scale-105'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {/* Búsqueda */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-gray-400 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <p className="text-gray-400 font-bold">No leads found.</p>
        </div>
      ) : (
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
                {filtered.map((lead) => (
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
{lead.phone_number && (
    <a href={`https://wa.me/${lead.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent('Hi ' + lead.full_name + ', this is Gasp Maker Cargo! Your account is ready at gaspmakercargo.com')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
        💬 WhatsApp
    </a>
)}
</div>
</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Calendar size={12} />
                        {lead.created_time
                          ? new Date(lead.created_time).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
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
                          {STATUS_OPTIONS.filter(s => s !== 'all').map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-2 pointer-events-none text-current opacity-60" />
                      </div>
                    </td>

                    <td className="px-6 py-4 min-w-[200px]">
                      {editingNote === lead.id ? (
                        <div className="flex flex-col gap-1">
                          <textarea
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg p-2 w-full focus:outline-none focus:border-blue-400 resize-none"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => saveNote(lead.id)}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold hover:bg-green-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingNote(null); setNoteValue(''); }}
                              className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-bold hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingNote(lead.id); setNoteValue(lead.notes || ''); }}
                          className="text-xs text-gray-400 italic hover:text-gray-600 text-left w-full"
                        >
                          {lead.notes || 'Add note...'}
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
