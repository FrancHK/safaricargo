import axios from 'axios';
import type { Shipment, CreateShipmentForm, ShipmentStatus, Staff, StaffUser, ScanResult, Customer } from '../types';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('sc_token') ||
    localStorage.getItem('sc_mapokezi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function loginAdmin(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  // backend returns { token, user } — normalize to { token, admin }
  const user = data.admin || data.user || {};
  return {
    token: data.token as string,
    admin: {
      username: user.username || user.firstName || user.email || '',
      email: user.email || '',
      role: user.role || 'admin'
    }
  };
}

export async function trackShipment(trackingId: string) {
  const { data } = await api.get(`/shipments/${trackingId}`);
  return data as Shipment;
}

export async function getAllShipments(params?: { status?: string; search?: string; page?: number }) {
  const { data } = await api.get('/shipments', { params });
  return data as { shipments: Shipment[]; total: number; page: number; pages: number };
}

export async function createShipment(form: CreateShipmentForm) {
  const { data } = await api.post('/shipments', form);
  return data as Shipment;
}

export async function updateShipmentStatus(id: string, status: ShipmentStatus, note?: string) {
  const { data } = await api.put(`/shipments/${id}/status`, { status, note });
  return data as Shipment;
}

export async function deleteShipment(id: string) {
  await api.delete(`/shipments/${id}`);
}

export async function getAllCustomers(params?: { search?: string; is_active?: boolean }) {
  const { data } = await api.get('/customers', { params });
  return data as { customers: Customer[]; total: number };
}

export async function toggleCustomerStatus(id: string, is_active: boolean) {
  const { data } = await api.patch(`/customers/${id}/status`, { is_active });
  return data as Customer;
}

// Staff API
export async function loginStaff(email: string, password: string) {
  const { data } = await api.post('/staff/login', { email, password });
  return data as { token: string; staff: StaffUser };
}

export async function scanShipment(trackingId: string, staffToken: string) {
  const { data } = await axios.post('/api/staff/scan', { trackingId }, {
    baseURL: '',
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  return data as ScanResult;
}

export async function getAllStaff() {
  const { data } = await api.get('/staff');
  return data as { staff: Staff[]; total: number };
}

export async function createStaff(form: { name: string; email: string; password: string; phone: string; department: string; station: string }) {
  const { data } = await api.post('/staff', form);
  return data as Staff;
}

export async function updateStaff(id: string, updates: Partial<Staff>) {
  const { data } = await api.patch(`/staff/${id}`, updates);
  return data as Staff;
}

export async function deleteStaff(id: string) {
  await api.delete(`/staff/${id}`);
}

// Settings API
export interface CompanySettings {
  id: number;
  company_name: string;
  address: string;
  phone: string;
  email: string;
  updated_at: string;
}

export async function getSettings() {
  const { data } = await api.get('/settings');
  return data as CompanySettings;
}

export async function updateSettings(updates: Partial<Omit<CompanySettings, 'id' | 'updated_at'>>) {
  const { data } = await api.patch('/settings', updates);
  return data as CompanySettings;
}

// Branches API
export interface Branch {
  id: string;
  name: string;
  location: string;
  region: string;
  is_active: boolean;
  staff_total: number;
  staff_active: number;
  created_at: string;
  updated_at: string;
}

export async function getAllBranches() {
  const { data } = await api.get('/branches');
  return data as { branches: Branch[]; total: number };
}

export async function createBranch(payload: { name: string; location?: string; region?: string }) {
  const { data } = await api.post('/branches', payload);
  return data as Branch;
}

export async function updateBranch(id: string, updates: Partial<Pick<Branch, 'name' | 'location' | 'region' | 'is_active'>>) {
  const { data } = await api.patch(`/branches/${id}`, updates);
  return data as Branch;
}

export async function deleteBranch(id: string) {
  await api.delete(`/branches/${id}`);
}

// Payment methods API
export interface PaymentMethod {
  id: string;
  type: 'mobile' | 'bank';
  network_name: string;   // jina la mtandao / benki
  account_name: string;   // jina la malipo
  account_number: string; // namba ya malipo
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getPaymentMethods() {
  const { data } = await api.get('/payments');
  return data as { payments: PaymentMethod[]; total: number };
}

export async function createPaymentMethod(payload: {
  type: 'mobile' | 'bank';
  network_name: string;
  account_name?: string;
  account_number: string;
}) {
  const { data } = await api.post('/payments', payload);
  return data as PaymentMethod;
}

export async function updatePaymentMethod(
  id: string,
  updates: Partial<Pick<PaymentMethod, 'type' | 'network_name' | 'account_name' | 'account_number' | 'is_active'>>,
) {
  const { data } = await api.patch(`/payments/${id}`, updates);
  return data as PaymentMethod;
}

export async function deletePaymentMethod(id: string) {
  await api.delete(`/payments/${id}`);
}
