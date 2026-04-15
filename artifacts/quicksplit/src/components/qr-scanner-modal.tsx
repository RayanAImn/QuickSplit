import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrScanner } from "@/components/qr-scanner";
import { decodeZatcaQr, ZatcaInvoice } from "@/lib/zatca-decoder";
import { generateDemoZatcaQr } from "@/lib/zatca-demo";
import { Button } from "@/components/ui/button";
import { X, ScanLine, AlertCircle, CheckCircle2, FlaskConical } from "lucide-react";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onInvoiceScanned: (invoice: ZatcaInvoice) => void;
}

export function QrScannerModal({ open, onClose, onInvoiceScanned }: QrScannerModalProps) {
  const [state, setState] = useState<"scanning" | "success" | "error">("scanning");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleScan = useCallback(
    (raw: string) => {
      if (state !== "scanning") return;
      const invoice = decodeZatcaQr(raw);
      if (invoice) {
        setState("success");
        setTimeout(() => {
          onInvoiceScanned(invoice);
          onClose();
          setState("scanning");
        }, 700);
      } else {
        setState("error");
        setErrorMsg(
          "This QR code is not a ZATCA e-invoice. Please scan the QR on your restaurant receipt."
        );
        setTimeout(() => setState("scanning"), 3000);
      }
    },
    [state, onInvoiceScanned, onClose]
  );

  const handleDemo = () => {
    const demoQr = generateDemoZatcaQr();
    const invoice = decodeZatcaQr(demoQr);
    if (invoice) {
      setState("success");
      setTimeout(() => {
        onInvoiceScanned(invoice);
        onClose();
        setState("scanning");
      }, 600);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex flex-col"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            <span className="font-semibold">Scan Restaurant Receipt</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5">
          <motion.div
            key={state}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm"
          >
            {state === "success" ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="bg-accent/20 rounded-full p-4">
                  <CheckCircle2 className="h-12 w-12 text-accent" />
                </div>
                <p className="text-white text-lg font-semibold">Invoice Scanned!</p>
              </div>
            ) : state === "error" ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="bg-destructive/20 rounded-full p-4">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <p className="text-white text-center text-sm">{errorMsg}</p>
              </div>
            ) : (
              <QrScanner onScan={handleScan} />
            )}
          </motion.div>

          {state === "scanning" && (
            <div className="text-center space-y-3 w-full max-w-sm">
              <div className="space-y-1">
                <p className="text-white/80 text-sm">
                  Point your camera at the QR code on your restaurant receipt
                </p>
                <p className="text-white/50 text-xs">
                  Works with ZATCA-compliant e-invoices (المرحلة الأولى / الثانية)
                </p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDemo}
                  className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  Try with demo receipt
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
