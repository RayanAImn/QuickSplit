import { useParams, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function PaySuccess() {
  const params = useParams<{ billId: string }>();
  const billId = params.billId;
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const [, setLocation] = useLocation();

  const status = searchParams.get("status") ?? "paid";
  const invoiceId = searchParams.get("invoice_id");
  const paymentId = searchParams.get("payment_id");

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md"
      >
        <div className="bg-accent/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-14 w-14 text-accent" />
        </div>

        <h1 className="text-3xl font-heading font-bold mb-2 text-primary">Payment Successful</h1>
        <p className="text-muted-foreground mb-6">
          Your share has been paid. The bill organizer has been notified.
        </p>

        {(invoiceId || paymentId) && (
          <Card className="mb-6">
            <CardContent className="p-4 space-y-2 text-sm">
              {invoiceId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-mono text-xs truncate max-w-40">{invoiceId}</span>
                </div>
              )}
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-mono text-xs truncate max-w-40">{paymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-semibold text-accent capitalize">{status}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full"
          onClick={() => setLocation(`/pay/${billId}`)}
        >
          View Bill Progress
        </Button>
      </motion.div>
    </div>
  );
}
