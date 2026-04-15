import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetBill, useGetBillSummary, getGetBillQueryKey, getGetBillSummaryQueryKey } from "@workspace/api-client-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, CheckCircle2, Clock, Link2, Share2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function statusColor(status: string) {
  if (status === "settled") return "bg-accent text-accent-foreground";
  if (status === "pending") return "bg-secondary text-secondary-foreground";
  return "bg-muted text-muted-foreground";
}

export default function BillDetail() {
  const params = useParams<{ billId: string }>();
  const billId = params.billId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: bill, isLoading: billLoading } = useGetBill(billId, {
    query: { enabled: !!billId, queryKey: getGetBillQueryKey(billId) },
  });

  const { data: summary, isLoading: summaryLoading } = useGetBillSummary(billId, {
    query: { enabled: !!billId, queryKey: getGetBillSummaryQueryKey(billId) },
  });

  const payLink = `${window.location.origin}/pay/${billId}`;
  const joinLink = `${window.location.origin}/join/${billId}`;

  const copyLink = async (link: string, label: string) => {
    await navigator.clipboard.writeText(link);
    toast({ title: `${label} copied`, description: "Link copied to clipboard." });
  };

  const shareLink = async (link: string, title: string) => {
    if (navigator.share) {
      await navigator.share({ title, url: link });
    } else {
      copyLink(link, title);
    }
  };

  if (billLoading || summaryLoading) {
    return (
      <div className="min-h-[100dvh] p-4 space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Bill not found.</p>
          <Button onClick={() => setLocation("/dashboard")} className="mt-4">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-10">
      <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold font-heading truncate flex-1">{bill.description}</h1>
          <Badge className={statusColor(bill.status)}>{bill.status}</Badge>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-primary-foreground/70 text-sm">Total</p>
            <p className="text-4xl font-heading font-bold">SAR {bill.totalAmount}</p>
          </div>
          <div className="text-right">
            <p className="text-primary-foreground/70 text-sm">Per person</p>
            <p className="text-2xl font-heading font-bold">SAR {bill.amountPerPerson}</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-5 max-w-md mx-auto -mt-2">
        {summary && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm">Payment Progress</p>
                <p className="text-sm font-bold text-secondary">{summary.numPaid}/{summary.numPeople} paid</p>
              </div>
              <Progress value={summary.progressPercent} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>SAR {summary.amountCollected} collected</span>
                <span>SAR {summary.amountRemaining} remaining</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Share Links</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pay">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="pay" className="flex-1 gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Pay Page
                </TabsTrigger>
                <TabsTrigger value="join" className="flex-1 gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  Join Link
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pay" className="space-y-4 mt-0">
                <p className="text-xs text-muted-foreground">
                  Share with members who already have payment links assigned.
                </p>
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl border">
                    <QRCodeSVG value={payLink} size={150} fgColor="#1F6F5F" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => copyLink(payLink, "Pay link")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => shareLink(payLink, bill.description)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center break-all">{payLink}</p>
              </TabsContent>

              <TabsContent value="join" className="space-y-4 mt-0">
                <p className="text-xs text-muted-foreground">
                  Members scan this QR, enter their name & number, and receive their payment link via WhatsApp automatically.
                </p>
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl border">
                    <QRCodeSVG value={joinLink} size={150} fgColor="#2FA084" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => copyLink(joinLink, "Join link")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => shareLink(joinLink, `Join: ${bill.description}`)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center break-all">{joinLink}</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Members ({bill.numPeople})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bill.splitItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  {item.status === "paid" ? (
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">{item.receiverName ?? "Member"}</p>
                    {item.receiverPhone && (
                      <p className="text-xs text-muted-foreground">{item.receiverPhone}</p>
                    )}
                    {item.paidAt && (
                      <p className="text-xs text-accent">
                        Paid {new Date(item.paidAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold font-heading">SAR {item.amount}</p>
                  <Badge
                    variant={item.status === "paid" ? "default" : "outline"}
                    className={item.status === "paid" ? "bg-accent/20 text-accent border-accent" : ""}
                  >
                    {item.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
