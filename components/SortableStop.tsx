"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, MapPin } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { useRef } from 'react';

interface Stop {
  id: string;
  address: string;
  description: string;
}

interface Props {
  stop: Stop;
  index: number;
  onAddressChange: (id: string, address: string) => void;
  onDescriptionChange: (id: string, description: string) => void;
  onRemove: (id: string) => void;
  onRouteRecalc: () => void;
  color?: string;
}

export default function SortableStop({ stop, index, onAddressChange, onDescriptionChange, onRemove, onRouteRecalc, color = 'blue' }: Props) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const letter = String.fromCharCode(66 + index);

  return (
    <div ref={setNodeRef} style={style} className={`bg-white p-3 rounded-xl border border-${color}-200 space-y-2 shadow-sm`}>
      <div className="flex justify-between items-center">
        {/* Drag Handle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
          >
            <GripVertical size={18}/>
          </button>
          <span className={`text-xs font-bold text-${color}-700 uppercase`}>Stop {letter}</span>
        </div>
        <button type="button" onClick={() => onRemove(stop.id)} className="text-red-400 hover:text-red-600">
          <X size={16}/>
        </button>
      </div>

      {/* Dirección con Google Autocomplete */}
      <Autocomplete
        onLoad={ref => { autocompleteRef.current = ref; }}
        onPlaceChanged={() => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onAddressChange(stop.id, place.formatted_address);
            onRouteRecalc();
          }
        }}
        restrictions={{ country: "us" }}
      >
        <div className="relative">
          <MapPin className={`absolute left-3 top-3 text-${color}-500`} size={14}/>
          <input
            type="text"
            placeholder={`Stop ${letter}: Pickup address...`}
            defaultValue={stop.address}
            className={`w-full pl-9 p-2.5 border border-${color}-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-${color}-400`}
          />
        </div>
      </Autocomplete>

      {/* Comentario */}
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-gray-400 text-xs">📝</span>
        <input
          type="text"
          placeholder="What to pick up here..."
          value={stop.description}
          onChange={e => onDescriptionChange(stop.id, e.target.value)}
          className="w-full pl-8 p-2.5 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
        />
      </div>
    </div>
  );
}