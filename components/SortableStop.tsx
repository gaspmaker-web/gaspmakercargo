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
  totalStops: number;
  onAddressChange: (id: string, address: string) => void;
  onDescriptionChange: (id: string, description: string) => void;
  onRemove: (id: string) => void;
  onRouteRecalc: () => void;
  color?: 'blue' | 'green';
}

const COLOR_MAP = {
  blue: {
    border: 'border-blue-200',
    dot: 'bg-blue-600',
    label: 'text-blue-700',
    inputBorder: 'border-blue-200',
    inputFocus: 'focus:ring-blue-400',
    pin: 'text-blue-500',
  },
  green: {
    border: 'border-green-200',
    dot: 'bg-green-600',
    label: 'text-green-700',
    inputBorder: 'border-green-200',
    inputFocus: 'focus:ring-green-400',
    pin: 'text-green-500',
  },
};

export default function SortableStop({
  stop,
  index,
  totalStops,
  onAddressChange,
  onDescriptionChange,
  onRemove,
  onRouteRecalc,
  color = 'blue',
}: Props) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const c = COLOR_MAP[color];

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
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: isDragging ? ('relative' as const) : ('relative' as const),
  };

  const letter = String.fromCharCode(66 + index); // B, C, D...

  return (
    <div ref={setNodeRef} style={style}>
      {/* Connector line above (except first) */}
      {index > 0 && (
        <div className="flex justify-center">
          <div className="w-0.5 h-3 bg-gray-200" />
        </div>
      )}

      <div
        className={`relative bg-white rounded-xl border ${c.border} shadow-sm overflow-hidden
          ${isDragging ? 'shadow-lg ring-2 ring-offset-1 ring-blue-300' : ''}`}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
          {/* Drag handle — covers full left side for easy mobile grab */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 rounded text-gray-300 hover:text-gray-500 active:text-gray-700 transition-colors"
            style={{ touchAction: 'none' }}
          >
            <GripVertical size={18} />
          </button>

          {/* Stop badge */}
          <div className={`w-6 h-6 rounded-full ${c.dot} flex items-center justify-center shrink-0`}>
            <span className="text-white text-[10px] font-bold">{letter}</span>
          </div>

          <span className={`text-xs font-bold uppercase tracking-wide ${c.label} flex-1`}>
            Stop {letter}
          </span>

          {/* Position indicator for multi-stop */}
          {totalStops > 1 && (
            <span className="text-[10px] text-gray-400 font-mono">
              {index + 1}/{totalStops}
            </span>
          )}

          {/* Remove */}
          <button
            type="button"
            onClick={() => onRemove(stop.id)}
            aria-label="Remove stop"
            className="p-1 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Address input */}
        <div className="px-3 pt-3 pb-2">
          <Autocomplete
            onLoad={ref => { autocompleteRef.current = ref; }}
            onPlaceChanged={() => {
              const place = autocompleteRef.current?.getPlace();
              if (place?.formatted_address) {
                onAddressChange(stop.id, place.formatted_address);
                onRouteRecalc();
              }
            }}
            restrictions={{ country: 'us' }}
          >
            <div className="relative">
              <MapPin
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.pin} pointer-events-none`}
                size={15}
              />
              <input
                type="text"
                placeholder={`Stop ${letter}: address...`}
                defaultValue={stop.address}
                className={`w-full pl-9 pr-3 py-2.5 border ${c.inputBorder} rounded-lg text-sm
                  outline-none focus:ring-2 ${c.inputFocus} focus:border-transparent
                  placeholder-gray-400 bg-white`}
              />
            </div>
          </Autocomplete>
        </div>

        {/* Comment input */}
        <div className="px-3 pb-3">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm pointer-events-none">📝</span>
            <input
              type="text"
              placeholder="What to pick up here..."
              value={stop.description}
              onChange={e => onDescriptionChange(stop.id, e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-100 rounded-lg text-sm
                outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}