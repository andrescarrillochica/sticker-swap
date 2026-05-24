import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
          tick();
        }
      } catch {
        setError('Camera access denied or unavailable.');
      }
    }

    async function tick() {
      if (!active) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      try {
        // @ts-ignore — BarcodeDetector is not in all TS libs yet
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          if (active) {
            onScan(barcodes[0].rawValue);
          }
          return;
        }
      } catch {
        // BarcodeDetector not supported — fall through to error
        setError('QR scanning not supported in this browser. Please paste the code manually.');
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 safe-area-top">
        <span className="text-white font-semibold text-sm">Scan QR Code</span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white active:bg-white/20"
        >
          <X size={18} />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Viewfinder overlay */}
        {scanning && !error && (
          <div className="relative z-10 pointer-events-none">
            <div className="w-64 h-64 relative">
              {/* Corner brackets */}
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-sm" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-sm" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-sm" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-sm" />
              {/* Scan line animation */}
              <div className="absolute inset-x-2 top-2 h-0.5 bg-blue-400/80 animate-scan" />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-white/80 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-white text-gray-900 text-sm font-semibold"
            >
              Close
            </button>
          </div>
        )}

        {/* Loading */}
        {!scanning && !error && (
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Camera size={32} className="text-white/60 animate-pulse" />
            <p className="text-white/60 text-sm">Starting camera...</p>
          </div>
        )}
      </div>

      <p className="text-white/50 text-xs text-center py-4">
        Point your camera at the partner's QR code
      </p>
    </div>
  );
}
