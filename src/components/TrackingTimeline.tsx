import { CheckCircle, Circle, Clock } from 'lucide-react';
import type { Shipment, ShipmentStatus } from '../types';
import { STATUSES } from '../types';

interface Props {
  shipment: Shipment;
}

export default function TrackingTimeline({ shipment }: Props) {
  const currentIndex = STATUSES.indexOf(shipment.status);

  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 mx-8 hidden sm:block" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-brand-green mx-8 hidden sm:block transition-all duration-700"
          style={{ right: `${((STATUSES.length - 1 - currentIndex) / (STATUSES.length - 1)) * 100}%` }}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {STATUSES.map((step, index) => {
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <div key={step} className="flex flex-col items-center text-center gap-2">
                <div className="relative z-10">
                  {isDone ? (
                    <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center shadow-md">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center shadow-lg ring-4 ring-blue-100">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                      <Circle className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>

                <div>
                  <p className={`text-xs font-semibold leading-tight ${
                    isDone ? 'text-brand-green' :
                    isCurrent ? 'text-brand-blue' :
                    'text-gray-400'
                  }`}>
                    {step}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-gray-500 mt-0.5">Current</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status History */}
      {shipment.statusHistory.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Shipment History
          </h3>
          <div className="space-y-3">
            {[...shipment.statusHistory].reverse().map((entry, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  entry.status === 'Delivered' ? 'bg-brand-green' :
                  entry.status === 'In Transit' ? 'bg-yellow-500' :
                  'bg-brand-blue'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{entry.status}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString('en-KE', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
