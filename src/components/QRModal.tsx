import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QRModalProps {
  title: string;
  payload: string;
  onClose: () => void;
}

export function QRModal({ title, payload, onClose }: QRModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 active:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="flex justify-center">
          <QRCodeSVG value={payload} size={240} level="M" />
        </div>
        <p className="text-xs text-gray-500 text-center">
          Show this to your trade partner to scan
        </p>
      </div>
    </div>
  );
}
