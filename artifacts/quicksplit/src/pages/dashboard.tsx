import { useLocation, Link } from "wouter";
import { useGetPayerStats, getGetPayerStatsQueryKey } from "@workspace/api-client-react";
import { usePayer } from "@/hooks/use-payer";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Plus, Receipt, Wallet } from "lucide-react";

export default function Dashboard() {
  const { phone, name, clearPayer } = usePayer();
  const [, setLocation] = useLocation();

  if (!phone) {
    setLocation("/");
    return null;
  }

  const { data: stats, isLoading } = useGetPayerStats(
    { payerPhone: phone },
    { query: { enabled: !!phone, queryKey: getGetPayerStatsQueryKey({ payerPhone: phone }) } }
  );
  const recentBills = stats?.recentBills ?? [];

  const handleLogout = () => {
    clearPayer();
    setLocation("/");
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold font-heading">QuickSplit</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary/90">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-1">
          <p className="text-primary-foreground/80 text-sm">Welcome back,</p>
          <h2 className="text-3xl font-heading font-bold">{name || phone}</h2>
        </div>
      </header>

      <main className="p-4 space-y-6 -mt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-card">
              <CardContent className="p-4 flex flex-col justify-center">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Wallet className="h-4 w-4 text-secondary" /> Collected
                </p>
                <p className="text-2xl font-bold font-heading text-secondary">
                  SAR {stats?.totalCollected || "0.00"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card">
              <CardContent className="p-4 flex flex-col justify-center">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Receipt className="h-4 w-4 text-primary" /> Outstanding
                </p>
                <p className="text-2xl font-bold font-heading text-primary">
                  SAR {stats?.totalOutstanding || "0.00"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <h3 className="text-xl font-heading font-bold">Recent Bills</h3>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : recentBills.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-card p-3 rounded-full mb-3">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">No bills yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">Create your first bill to start collecting.</p>
              <Button onClick={() => setLocation("/create")} variant="secondary">
                Create Bill
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentBills.map((bill, index) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/bills/${bill.id}`}>
                  <Card className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">{bill.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(bill.createdAt).toLocaleDateString()} • {bill.numPeople} people
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <p className="font-bold font-heading">SAR {bill.totalAmount}</p>
                        <Badge 
                          variant={bill.status === 'settled' ? "default" : bill.status === 'active' ? "secondary" : "outline"}
                          className={bill.status === 'settled' ? 'bg-accent text-accent-foreground' : ''}
                        >
                          {bill.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setLocation("/create")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
