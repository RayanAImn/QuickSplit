import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetBill, useJoinBill, getGetBillQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Users, MessageCircle, Lock } from "lucide-react";

export default function JoinBill() {
  const params = useParams<{ billId: string }>();
  const billId = params.billId;
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const { data: bill, isLoading } = useGetBill(billId, {
    query: { enabled: !!billId, queryKey: getGetBillQueryKey(billId) },
  });

  const joinMutation = useJoinBill({
    mutation: {
      onSuccess: (data) => {
        setSuccess(true);
        setPaymentUrl(data.paymentLinkUrl ?? null);
      },
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Something went wrong. Please try again.";
        setError(msg);
      },
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 text-center">
        <div>
          <p className="text-muted-foreground text-lg">Bill not found.</p>
          <p className="text-sm text-muted-foreground mt-1">This link may have expired.</p>
        </div>
      </div>
    );
  }

  if (bill.status === "settled") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-accent/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-2xl font-heading font-bold mb-2">Bill Settled</h1>
        <p className="text-muted-foreground">This bill has already been fully settled.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-sm"
        >
          <div className="bg-accent/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-14 w-14 text-accent" />
          </div>
          <h1 className="text-2xl font-heading font-bold mb-2">You're In!</h1>
          <p className="text-muted-foreground mb-2">
            You've joined <strong>{bill.description}</strong> organized by {bill.payerName}.
          </p>
          <p className="text-lg font-bold text-primary mb-6">
            Your share: SAR {bill.amountPerPerson}
          </p>

          {paymentUrl ? (
            <div className="space-y-3">
              <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                <p className="text-sm text-left">
                  A WhatsApp payment link has been sent to <strong>{phone}</strong>. Open WhatsApp to pay your share.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => window.open(paymentUrl, "_blank")}
              >
                Pay Now — SAR {bill.amountPerPerson}
              </Button>
            </div>
          ) : (
            <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground">
              Your payment link will be sent via WhatsApp shortly.
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-10">
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-md text-center">
        <h1 className="text-2xl font-heading font-bold mb-1">QuickSplit</h1>
        <p className="text-primary-foreground/70 text-sm">You've been invited to split a bill</p>
      </div>

      <main className="p-4 space-y-5 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-none shadow-md">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-muted-foreground text-sm">Organized by</p>
              <p className="text-xl font-bold font-heading">{bill.payerName}</p>
              <p className="text-base font-semibold">{bill.description}</p>
              <div className="bg-background rounded-xl p-4 inline-block w-full">
                <p className="text-muted-foreground text-sm mb-1">Your share</p>
                <p className="text-4xl font-heading font-bold text-primary">
                  SAR {bill.amountPerPerson}
                </p>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{bill.numPeople} people already in this split</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Register to Pay</CardTitle>
              <CardDescription>
                Enter your details and we'll send your WhatsApp payment link instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(null);
                  if (!name.trim()) {
                    setError("Please enter your name.");
                    return;
                  }
                  if (!phone.trim()) {
                    setError("Please enter your phone number.");
                    return;
                  }
                  joinMutation.mutate({ billId, data: { name: name.trim(), phone: phone.trim() } });
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Ahmed Al-Saud"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">WhatsApp Number</Label>
                  <Input
                    id="phone"
                    placeholder="+966500000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your payment link will be sent to this number via WhatsApp.
                  </p>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-destructive text-sm"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending
                    ? "Sending your payment link..."
                    : "Join & Get Payment Link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
