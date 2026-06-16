import type { ShipmentStatus } from '../types';

const STATUS_CONFIG: Record<ShipmentStatus, { bg: string; text: string; dot: string }> = {
  'Received':        { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400' },
  'Processing':      { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  'In Transit':      { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  'Arrived at Hub':  { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Out for Delivery':{ bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Delivered':       { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' }
};

export default function StatusBadge({ status }: { status: ShipmentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Received'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}
