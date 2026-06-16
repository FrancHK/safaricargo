import { QRCodeSVG } from 'qrcode.react';
import type { Shipment } from '../types';

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

export default function ShipmentLabel({ shipment }: Props) {
  const qrValue = `${window.location.origin}/track?id=${shipment.trackingId}`;
  const cargoLabel = CARGO_LABELS[(shipment as unknown as { cargoType?: string }).cargoType || ''] || 'Mzigo';
  const cargoContents = (shipment as unknown as { cargoContents?: string }).cargoContents || shipment.description || '—';
  const price = (shipment as unknown as { price?: number }).price;

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
              <div className="info-row">
                <span className="info-key">AINA YA MZIGO</span>
                <span className="info-val">{cargoLabel}</span>
              </div>
              <div className="info-row">
                <span className="info-key">UZITO</span>
                <span className="info-val">{shipment.weight} kg</span>
              </div>
              {price && price > 0 && (
                <div className="info-row">
                  <span className="info-key">BEI</span>
                  <span className="info-val">TZS {Number(price).toLocaleString()}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-key">KILICHOMO NDANI</span>
                <span className="info-val">{cargoContents}</span>
              </div>
              <div className="info-row">
                <span className="info-key">TAREHE</span>
                <span className="info-val">
                  {new Date(shipment.createdAt).toLocaleDateString('sw-TZ', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
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
          <span>📍 SafiriCargo Ltd | P.O.Box 123, Dar es Salaam, Tanzania</span>
          <span className="footer-sep">|</span>
          <span>📞 +255 700 000 000</span>
          <span className="footer-sep">|</span>
          <span>✉ info@safiricargo.com</span>
        </div>
      </div>
    </div>
  );
}
