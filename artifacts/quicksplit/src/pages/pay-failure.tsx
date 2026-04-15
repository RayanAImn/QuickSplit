import { useParams, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PayFailure() {
  const params = useParams<{ billId: string }>();
  const billId = params.billId;
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const [, setLocation] = useLocation();

  const message = searchParams.get("message") ?? "Payment could not be processed.";
  const status = searchParams.get("status") ?? "failed";

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md"
      >
        <div className="bg-destructive/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-14 w-14 text-destructive" />
        </div>

        <h1 className="text-3xl font-heading font-bold mb-2 text-destructive">Payment Failed</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was not completed. Please try again.
        </p>

        <Card className="mb-6">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-destructive capitalize">{status}</span>
            </div>
            {message && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason</span>
                <span className="text-right max-w-48">{message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => setLocation(`/pay/${billId}`)}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation(`/pay/${billId}`)}
          >
            Back to Bill
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
