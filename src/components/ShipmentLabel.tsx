import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Shipment } from '../types';
import { getSettings, type CompanySettings } from '../api/shipments';

interface Props {
  shipment: Shipment;
  copyIndex?: number;
}

const CARGO_LABELS: Record<string, string> = {
  box: 'Box / Sanduku',
  kifungashio: 'Kifungashio',
  robe: 'Robe / Mfuko',
  other: 'Nyingine'
};

const CARGO_ICONS: Record<string, string> = {
  box: '📦',
  kifungashio: '🎁',
  robe: '👜',
  other: '📋'
};

interface SubItemRow {
  quantity: number;
  unit_price: number;
  subtotal: number;
}
interface CargoItemRow {
  type: string;
  label?: string;
  quantity?: number;
  subtotal?: number;
  sub_items?: SubItemRow[];
}

const DEFAULT_SETTINGS: CompanySettings = {
  id: 1,
  company_name: 'SafiriCargo Ltd',
  address: 'P.O.Box 123, Dar es Salaam, Tanzania',
  phone: '+255 700 000 000',
  email: 'info@safiricargo.com',
  updated_at: '',
};

export default function ShipmentLabel({ shipment }: Props) {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    getSettings().then(setSettings).catch(() => { /* fall back to defaults */ });
  }, []);
  const qrValue = `${window.location.origin}/track?id=${shipment.trackingId}`;
  const cargoLabel = CARGO_LABELS[(shipment as unknown as { cargoType?: string }).cargoType || ''] || 'Mzigo';
  const rawContents = (shipment as unknown as { cargoContents?: string }).cargoContents || '';
  const description = shipment.description || '';
  const cargoItems = ((shipment as unknown as { cargoItems?: CargoItemRow[] }).cargoItems || []).filter(it => it && (it.sub_items?.length || it.quantity));
  // Notes = description if it isn't just a duplicate of the items summary
  const notes = description && description !== rawContents ? description : '';
  const price = (shipment as unknown as { price?: number }).price;
  const hasItems = cargoItems.length > 0;

  return (
    <div className="label-wrapper">
      <div className="sc-label">
        {/* Header */}
        <div className="label-header">
          <div className="label-brand">
            <span className="brand-icon">📦</span>
            <div>
              <span className="brand-name">Safiri<strong>Cargo</strong></span>
              <span className="brand-tagline">Fast · Reliable · Secure</span>
            </div>
          </div>
          <div className="tracking-id-box">
            <span className="tid-label">TRACKING ID</span>
            <span className="tid-value">{shipment.trackingId}</span>
          </div>
        </div>

        {/* Body */}
        <div className="label-body">
          {/* Left — shipment details */}
          <div className="label-left">

            <div className="info-section">
              <div className="info-row">
                <span className="info-key">MTEJA</span>
                <span className="info-val bold">{shipment.customerName}</span>
              </div>
              <div className="info-row">
                <span className="info-key">SIMU</span>
                <span className="info-val">{shipment.phone}</span>
              </div>
            </div>

            <div className="route-box">
              <div className="route-city">
                <span className="route-label">KUTOKA</span>
                <span className="route-val">{shipment.from}</span>
              </div>
              <div className="route-arrow">→</div>
              <div className="route-city">
                <span className="route-label">KWENDA</span>
                <span className="route-val">{shipment.to}</span>
              </div>
            </div>

            <div className="info-section">
              {!hasItems && (
                <div className="info-row">
                  <span className="info-key">AINA YA MZIGO</span>
                  <span className="info-val">{cargoLabel}</span>
                </div>
              )}
              {price && price > 0 && (
                <div className="info-row">
                  <span className="info-key">BEI YA JUMLA</span>
                  <span className="info-val bold">TZS {Number(price).toLocaleString()}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-key">TAREHE</span>
                <span className="info-val">
                  {new Date(shipment.createdAt).toLocaleDateString('sw-TZ', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Kilichomo ndani — structured */}
            <div className="cargo-block">
              <div className="cargo-block-title">KILICHOMO NDANI</div>
              {hasItems ? (
                <div className="cargo-items">
                  {cargoItems.map((item, i) => {
                    const label = item.label || CARGO_LABELS[item.type] || item.type;
                    const icon = CARGO_ICONS[item.type] || '📋';
                    const subs = item.sub_items || [];
                    const itemTotal = item.subtotal ?? subs.reduce((s, x) => s + (x.subtotal || x.quantity * x.unit_price || 0), 0);
                    const itemCount = item.quantity ?? subs.reduce((n, x) => n + (x.quantity || 0), 0);
                    return (
                      <div className="cargo-item" key={i}>
                        <div className="cargo-item-head">
                          <span className="cargo-item-icon">{icon}</span>
                          <span className="cargo-item-label">{label}</span>
                          <span className="cargo-item-meta">{itemCount} vipande · TZS {itemTotal.toLocaleString()}</span>
                        </div>
                        {subs.length > 0 && (
                          <div className="cargo-item-rows">
                            {subs.map((s, j) => (
                              <div className="cargo-row" key={j}>
                                <span className="cargo-qty">{s.quantity}</span>
                                <span className="cargo-x">×</span>
                                <span className="cargo-unit">TZS {Number(s.unit_price).toLocaleString()}</span>
                                <span className="cargo-eq">=</span>
                                <span className="cargo-sub">TZS {Number(s.subtotal ?? s.quantity * s.unit_price).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="cargo-fallback">{rawContents || description || '—'}</div>
              )}
              {notes && (
                <div className="cargo-notes">
                  <span className="cargo-notes-key">Maelezo:</span> {notes}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="label-divider" />

          {/* Right — QR */}
          <div className="label-right">
            <QRCodeSVG
              value={qrValue}
              size={120}
              fgColor="#1E3A8A"
              level="M"
              style={{ display: 'block' }}
            />
            <div className="qr-info">
              <span className="qr-tid">{shipment.trackingId}</span>
              <span className="qr-route">{shipment.from} → {shipment.to}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="label-footer">
          <span>📍 {settings.company_name} | {settings.address}</span>
          <span className="footer-sep">|</span>
          <span>📞 {settings.phone}</span>
          <span className="footer-sep">|</span>
          <span>✉ {settings.email}</span>
        </div>
      </div>
    </div>
  );
}
