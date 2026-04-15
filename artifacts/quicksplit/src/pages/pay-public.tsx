import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetBill, useGetBillSummary, getGetBillQueryKey, getGetBillSummaryQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Lock, ExternalLink } from "lucide-react";

export default function PayPublic() {
  const params = useParams<{ billId: string }>();
  const billId = params.billId;
  const [, setLocation] = useLocation();

  const { data: bill, isLoading: billLoading } = useGetBill(billId, {
    query: { enabled: !!billId, queryKey: getGetBillQueryKey(billId) },
  });

  const { data: summary } = useGetBillSummary(billId, {
    query: { enabled: !!billId, queryKey: getGetBillSummaryQueryKey(billId) },
  });

  if (billLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Bill not found.</p>
          <p className="text-sm text-muted-foreground mt-1">This link may have expired or the bill does not exist.</p>
        </div>
      </div>
    );
  }

  if (bill.status === "settled") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-accent/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-2xl font-heading font-bold mb-2">Bill Fully Settled</h1>
          <p className="text-muted-foreground mb-2">{bill.description}</p>
          <p className="text-lg font-bold text-accent mb-6">
            {bill.payerName} has collected SAR {bill.totalAmount}
          </p>
          <Card className="border-none bg-card">
            <CardContent className="p-4 flex flex-col items-center">
              <CheckCircle2 className="h-8 w-8 text-accent mb-2" />
              <p className="text-sm text-muted-foreground">
                All {bill.numPeople} members have paid their share.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const unpaidItems = bill.splitItems.filter((i) => i.status === "unpaid" && i.paymentLinkUrl);

  return (
    <div className="min-h-[100dvh] pb-10">
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold mb-1">QuickSplit</h1>
          <p className="text-primary-foreground/70 text-sm">Payment Request</p>
        </div>
      </div>

      <main className="p-4 space-y-5 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-none shadow-md">
            <CardContent className="p-6 text-center space-y-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Bill from</p>
                <p className="text-xl font-bold font-heading">{bill.payerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">For</p>
                <p className="text-lg font-semibold">{bill.description}</p>
              </div>
              <div className="bg-background rounded-xl p-4">
                <p className="text-muted-foreground text-sm mb-1">Your share</p>
                <p className="text-4xl font-heading font-bold text-primary">
                  SAR {bill.amountPerPerson}
                </p>
              </div>

              {summary && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-secondary">{summary.numPaid}/{summary.numPeople} paid</span>
                  </div>
                  <Progress value={summary.progressPercent} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {unpaidItems.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Select Your Name to Pay</CardTitle>
                <CardDescription>
                  Choose your name from the list below to proceed to secure payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {unpaidItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="border-b last:border-0"
                  >
                    <a
                      href={item.paymentLinkUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 hover:bg-background transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{item.receiverName ?? `Member ${index + 1}`}</p>
                        <p className="text-sm text-muted-foreground">SAR {item.amount}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Unpaid</Badge>
                        <ExternalLink className="h-4 w-4 text-primary" />
                      </div>
                    </a>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
            <p className="text-xs text-center text-muted-foreground mt-3">
              You will be redirected to Stream's secure checkout to pay with Mada or STC Pay.
            </p>
          </motion.div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {bill.splitItems.filter((i) => i.status === "unpaid").length === 0
                  ? "All members have paid."
                  : "Payment links are being generated. Please try again in a moment."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
