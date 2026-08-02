'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus, Trash2, Loader2, PackageCheck, AlertCircle } from 'lucide-react';

interface Props {
  pickupId: string;
  status: string;
  serviceType?: string;
  photoUrl?: string;
  userId: string;
  gmcTracking: string;
}

export default function PickupSplitPanel({ pickupId, status, serviceType, photoUrl, userId, gmcTracking }: Props) {
  const router = useRouter();
  const [isSplitting, setIsSplitting] = useState(false);
  const [boxes, setBoxes] = useState([
    { description: '', weight: '', length: '', width: '', height: '', value: '' }
  ]);

  const isDelivery = serviceType?.toUpperCase() === 'DELIVERY';

  if (isDelivery) return null;

  if (status === 'PROCESADO') {
    return (
      <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-3">
        <PackageCheck size={20} />
        <span className="text-sm font-bold">This request has already been processed into packages.</span>
      </div>
    );
  }

  const canReceive = status === 'COMPLETADO' || status === 'EN_CAMINO' || status === 'ENTREGADO';

  if (!canReceive) {
    return (
      <div className="bg-orange-50 text-orange-700 p-4 rounded-xl border border-orange-200 flex items-center gap-3">
        <AlertCircle size={20} />
        <span className="text-sm font-medium">Waiting for driver delivery... (Status: {status})</span>
      </div>
    );
  }

  const handleAddBox = () => {
    setBoxes([...boxes, { description: '', weight: '', length: '', width: '', height: '', value: '' }]);
  };

  const handleRemoveBox = (index: number) => {
    setBoxes(boxes.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: string) => {
    const updated = [...boxes];
    updated[index] = { ...updated[index], [field]: value };
    setBoxes(updated);
  };

  const handleSplit = async () => {
    if (boxes.some(b => !b.description || !b.weight)) {
      alert('Please fill in description and weight for all boxes.');
      return;
    }

    setIsSplitting(true);
    try {
      const res = await fetch('/api/packages/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPackageId: pickupId,
          isPickup: true,
          boxes
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ ${data.created} packages created!\n${data.packages.join('\n')}`);
        router.push(`/dashboard-admin/paquetes`);
        router.refresh();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Connection error');
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Package size={18} className="text-gmc-dorado-principal" />
        <h3 className="text-base font-bold text-gray-800">Warehouse Reception</h3>
      </div>
      <p className="text-xs text-gray-500">Enter each box individually. Each will become a separate package for the client.</p>

      {boxes.map((box, index) => (
        <div key={index} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-700 uppercase">Box {index + 1}</span>
            {index > 0 && (
              <button onClick={() => handleRemoveBox(index)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14}/>
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Description</label>
              <input type="text" placeholder="e.g. Clothes, Shoes..."
                value={box.description}
                onChange={e => handleChange(index, 'description', e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Weight (Lbs)</label>
              <input type="number" placeholder="0"
                value={box.weight}
                onChange={e => handleChange(index, 'weight', e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">L (in)</label>
              <input type="number" placeholder="0" value={box.length}
                onChange={e => handleChange(index, 'length', e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-center text-sm outline-none focus:ring-2 focus:ring-yellow-400"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">W (in)</label>
              <input type="number" placeholder="0" value={box.width}
                onChange={e => handleChange(index, 'width', e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-center text-sm outline-none focus:ring-2 focus:ring-yellow-400"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">H (in)</label>
              <input type="number" placeholder="0" value={box.height}
                onChange={e => handleChange(index, 'height', e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-center text-sm outline-none focus:ring-2 focus:ring-yellow-400"/>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Declared Value ($)</label>
            <input type="number" placeholder="0.00" value={box.value}
              onChange={e => handleChange(index, 'value', e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"/>
          </div>
        </div>
      ))}

      <button type="button" onClick={handleAddBox}
        className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl text-xs font-bold hover:border-gmc-dorado-principal hover:text-gmc-dorado-principal transition flex items-center justify-center gap-2">
        <Plus size={14}/> Add Another Box
      </button>

      <button type="button" onClick={handleSplit} disabled={isSplitting}
        className="w-full bg-gmc-gris-oscuro text-white py-3 rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2">
        {isSplitting ? <Loader2 className="animate-spin" size={16}/> : <Package size={16}/>}
        {isSplitting ? 'Creating Packages...' : `Create ${boxes.length} Package${boxes.length > 1 ? 's' : ''}`}
      </button>
    </div>
  );
}