import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (result: string) => void;
  onError?: (err: string) => void;
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
  const containerId = "qr-scanner-container";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const didStart = useRef(false);

  useEffect(() => {
    if (didStart.current) return;
    didStart.current = true;

    const scanner = new Html5Qrcode(containerId, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          onScan(decoded);
        },
        (err) => {
          onError?.(err);
        }
      )
      .catch((e) => {
        onError?.(String(e));
      });

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, []);

  return (
    <div className="w-full">
      <div id={containerId} className="w-full rounded-xl overflow-hidden" />
    </div>
  );
}
