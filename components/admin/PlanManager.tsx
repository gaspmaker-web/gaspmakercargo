"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, Check, AlertTriangle } from 'lucide-react';

const PLANS = [
  { value: 'STANDARD',      label: 'Standard',      color: 'bg-blue-100 text-blue-800 border-blue-200',  desc: 'Regular pricing' },
  { value: 'VIP_WHOLESALE', label: 'VIP Wholesale',  color: 'bg-yellow-100 text-yellow-800 border-yellow-200', desc: 'Wholesale rates on 230+ lbs' },
];

interface Props {
  userId: string;
  currentPlan: string | null;
  currentNoConsolidationFee: boolean;
}

export default function PlanManager({ userId, currentPlan, currentNoConsolidationFee }: Props) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan || 'STANDARD');
  const [noConsolidationFee, setNoConsolidationFee] = useState(currentNoConsolidationFee || false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const hasChanges = plan !== (currentPlan || 'STANDARD') || noConsolidationFee !== currentNoConsolidationFee;

  const handleSave = async () => {
    setConfirming(false);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planType: plan, noConsolidationFee }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.error || 'Error updating plan');
      }
    } catch (e) {
      alert('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const currentPlanInfo = PLANS.find(p => p.value === plan);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={20} className="text-gmc-dorado-principal" />
        <h2 className="font-bold text-gmc-gris-oscuro text-sm uppercase tracking-wide">
          Plan & Billing
        </h2>
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PLANS.map(p => (
          <button
            key={p.value}
            onClick={() => setPlan(p.value)}
            className={`py-3 px-3 rounded-xl border-2 text-sm font-bold transition-all text-left ${
              plan === p.value
                ? `${p.color} border-current shadow-sm`
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <div>{p.label}</div>
            <div className="text-xs font-normal opacity-70">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* No Consolidation Fee toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 mb-4">
        <div>
          <p className="text-sm font-bold text-gray-700">Consolidation Fee Exempt</p>
          <p className="text-xs text-gray-500">Waives the consolidation fee for this client</p>
        </div>
        <button
          onClick={() => setNoConsolidationFee(!noConsolidationFee)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            noConsolidationFee ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            noConsolidationFee ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Save button */}
      {!confirming ? (
        <button
          onClick={() => hasChanges && setConfirming(true)}
          disabled={loading || success || !hasChanges}
          className="w-full py-2.5 bg-gmc-gris-oscuro text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {success ? (
            <><Check size={16} className="text-green-400" /> Saved</>
          ) : (
            'Save Plan'
          )}
        </button>
      ) : (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} />
            Change plan to <span className={`px-2 py-0.5 rounded text-xs ${currentPlanInfo?.color}`}>{plan}</span>
            {noConsolidationFee && ' + Consolidation Fee Exempt'}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}