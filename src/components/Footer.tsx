import { Link } from 'react-router-dom';
import { Package, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <img src="/logo.png" alt="SafiriCargo" className="h-12 w-auto bg-white rounded-lg px-2 py-1" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Fast, reliable cargo delivery across East Africa. Your cargo, our commitment.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-brand-blue transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-brand-blue transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-brand-green transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/track', label: 'Track Shipment' },
                { to: '/book', label: 'Book Cargo' },
                { to: '/admin/login', label: 'Admin Portal' }
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-brand-green transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Services</h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>Express Delivery</li>
              <li>Freight Cargo</li>
              <li>Warehousing</li>
              <li>Door-to-Door Delivery</li>
              <li>Bulk Shipments</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" />
                <span>Dar es Salaam, Tanzania</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-green flex-shrink-0" />
                <a href="tel:+255758285354" className="hover:text-brand-green transition-colors">+255 758 285 354</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-green flex-shrink-0" />
                <a href="mailto:francehk23@gmail.com" className="hover:text-brand-green transition-colors break-all">francehk23@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} SafiriCargo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
