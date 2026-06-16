export type ShipmentStatus =
  | 'Received'
  | 'Processing'
  | 'In Transit'
  | 'Arrived at Hub'
  | 'Out for Delivery'
  | 'Delivered';

export const STATUSES: ShipmentStatus[] = [
  'Received',
  'Processing',
  'In Transit',
  'Arrived at Hub',
  'Out for Delivery',
  'Delivered'
];

export interface StatusHistory {
  status: ShipmentStatus;
  note: string;
  timestamp: string;
}

export interface Shipment {
  _id: string;
  trackingId: string;
  customerName: string;
  phone: string;
  email?: string;
  from: string;
  to: string;
  weight: number;
  description?: string;
  status: ShipmentStatus;
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  username: string;
  email: string;
  role: string;
}

export const DEPARTMENTS = [
  { name: 'Mapokezi',      label: 'Mapokezi (Intake/Receiver)', status: 'Received',         isMapokezi: true  },
  { name: 'Mpakiaji',      label: 'Mpakiaji (Loader)',          status: 'Processing',       isMapokezi: false },
  { name: 'Usafirishaji',  label: 'Usafirishaji (Transit)',     status: 'In Transit',       isMapokezi: false },
  { name: 'Utoaji',        label: 'Utoaji (Delivery)',          status: 'Out for Delivery', isMapokezi: false },
] as const;

export interface Vehicle {
  id: string;
  vehicle_code: string;
  plate_number: string;
  vehicle_type: string;
  capacity_kg: number;
  current_load_kg: number;
  current_load_count: number;
  status: 'available' | 'loading' | 'in_transit' | 'arrived' | 'maintenance';
  driver_name: string;
  driver_phone: string;
  route_from: string;
  route_to: string;
  dispatched_at: string | null;
  arrived_at: string | null;
  notes: string;
  created_at: string;
}

export interface VehicleLoad {
  id: string;
  vehicle_id: string;
  tracking_id: string;
  customer_name: string;
  weight: number;
  destination: string;
  loaded_by: string;
  loaded_at: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  station: string;
  employee_id: string;
  is_active: boolean;
  total_scans: number;
  last_scan: string | null;
  created_at: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  department: string;
  station: string;
  employee_id: string;
  status_to_assign: string;
}

export interface ScanResult {
  success: boolean;
  shipment: {
    trackingId: string;
    customerName: string;
    from: string;
    to: string;
    previousStatus: string;
    newStatus: string;
    updatedAt: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  device_type: string;
  app_version: string;
  total_shipments: number;
  is_active: boolean;
  created_at: string;
  last_login: string;
}

export interface CreateShipmentForm {
  customerName: string;
  phone: string;
  email: string;
  from: string;
  to: string;
  weight: string;
  description: string;
}
