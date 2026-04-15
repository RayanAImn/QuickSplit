import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { QrScanner } from "@/components/qr-scanner";
import { decodeZatcaQr, ZatcaInvoice } from "@/lib/zatca-decoder";
import { generateDemoZatcaQr } from "@/lib/zatca-demo";
import { Button } from "@/components/ui/button";
import { X, ScanLine, AlertCircle, CheckCircle2, FlaskConical, ImagePlus, Camera } from "lucide-react";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onInvoiceScanned: (invoice: ZatcaInvoice) => void;
}

type Mode = "choose" | "camera" | "uploading" | "success" | "error";

export function QrScannerModal({ open, onClose, onInvoiceScanned }: QrScannerModalProps) {
  const [mode, setMode] = useState<Mode>("choose");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSuccess = useCallback(
    (invoice: ZatcaInvoice) => {
      setMode("success");
      setTimeout(() => {
        onInvoiceScanned(invoice);
        onClose();
        setMode("choose");
      }, 700);
    },
    [onInvoiceScanned, onClose]
  );

  const handleBadQr = () => {
    setMode("error");
    setErrorMsg("This QR code is not a ZATCA e-invoice. Please use the QR on your restaurant receipt.");
    setTimeout(() => setMode("choose"), 3500);
  };

  const handleCameraScan = useCallback(
    (raw: string) => {
      const invoice = decodeZatcaQr(raw);
      if (invoice) handleSuccess(invoice);
      else handleBadQr();
    },
    [handleSuccess]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMode("uploading");

    try {
      const scanner = new Html5Qrcode("qr-file-scanner", { verbose: false });
      const raw = await scanner.scanFile(file, false);
      await scanner.clear();
      const invoice = decodeZatcaQr(raw);
      if (invoice) handleSuccess(invoice);
      else handleBadQr();
    } catch {
      handleBadQr();
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDemo = () => {
    const demoQr = generateDemoZatcaQr();
    const invoice = decodeZatcaQr(demoQr);
    if (invoice) handleSuccess(invoice);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            <span className="font-semibold">Scan Restaurant Receipt</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { onClose(); setMode("choose"); }}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div id="qr-file-scanner" className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm"
          >
            {mode === "success" && (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="bg-accent/20 rounded-full p-4">
                  <CheckCircle2 className="h-12 w-12 text-accent" />
                </div>
                <p className="text-white text-lg font-semibold">Invoice Scanned!</p>
              </div>
            )}

            {(mode === "error" || mode === "uploading") && (
              <div className="flex flex-col items-center gap-3 py-8">
                {mode === "uploading" ? (
                  <>
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-white text-sm">Reading QR code from image…</p>
                  </>
                ) : (
                  <>
                    <div className="bg-destructive/20 rounded-full p-4">
                      <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <p className="text-white text-center text-sm">{errorMsg}</p>
                  </>
                )}
              </div>
            )}

            {mode === "choose" && (
              <div className="space-y-3 w-full">
                <p className="text-white/80 text-sm text-center mb-2">
                  How would you like to scan?
                </p>
                <Button
                  className="w-full h-14 bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-3 text-base"
                  variant="outline"
                  onClick={() => setMode("camera")}
                >
                  <Camera className="h-5 w-5" />
                  Use Camera
                </Button>
                <Button
                  className="w-full h-14 bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-3 text-base"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-5 w-5" />
                  Upload from Gallery
                </Button>
                <div className="border-t border-white/10 pt-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDemo}
                    className="text-white/50 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    Try with demo receipt
                  </Button>
                </div>
              </div>
            )}

            {mode === "camera" && (
              <div className="space-y-4">
                <QrScanner onScan={handleCameraScan} />
                <div className="text-center space-y-1">
                  <p className="text-white/80 text-sm">
                    Point at the QR code on your restaurant receipt
                  </p>
                  <p className="text-white/50 text-xs">
                    Supports ZATCA e-invoices (المرحلة الأولى / الثانية)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode("choose")}
                    className="text-white/60 hover:text-white hover:bg-white/10 mt-1"
                  >
                    ← Back
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
