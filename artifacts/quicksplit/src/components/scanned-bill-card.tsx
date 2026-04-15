import { motion } from "framer-motion";
import { ZatcaInvoice, formatTimestamp } from "@/lib/zatca-decoder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Receipt, Calendar, Hash } from "lucide-react";

interface ScannedBillCardProps {
  invoice: ZatcaInvoice;
}

export function ScannedBillCard({ invoice }: ScannedBillCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-secondary/40 bg-secondary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-secondary" />
              Scanned Invoice
            </CardTitle>
            <Badge variant="outline" className="border-secondary text-secondary text-xs shrink-0">
              ZATCA Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Seller</p>
              <p className="font-semibold text-sm">{invoice.sellerName}</p>
            </div>
          </div>

          {invoice.vatNumber && (
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">VAT Number</p>
                <p className="font-mono text-sm">{invoice.vatNumber}</p>
              </div>
            </div>
          )}

          {invoice.timestamp && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="text-sm">{formatTimestamp(invoice.timestamp)}</p>
              </div>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Subtotal</p>
              <p className="font-semibold text-sm">SAR {invoice.subtotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">VAT (15%)</p>
              <p className="font-semibold text-sm text-amber-600">SAR {invoice.vatAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Total</p>
              <p className="font-bold text-sm text-primary">SAR {invoice.totalWithVat.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
