import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateBill, getListBillsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePayer } from "@/hooks/use-payer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Users, Receipt } from "lucide-react";

interface Member {
  name: string;
  phone: string;
}

export default function CreateBill() {
  const { phone: payerPhone, name: payerName } = usePayer();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [members, setMembers] = useState<Member[]>([{ name: "", phone: "" }]);
  const [error, setError] = useState<string | null>(null);

  const createBillMutation = useCreateBill({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListBillsQueryKey({ payerPhone }) });
        setLocation(`/bills/${data.id}`);
      },
      onError: () => {
        setError("Failed to create bill. Please try again.");
      },
    },
  });

  const parsedAmount = parseFloat(totalAmount) || 0;
  const numMembers = members.length;
  const amountPerPerson = numMembers > 0 ? parsedAmount / numMembers : 0;

  const addMember = () => {
    setMembers([...members, { name: "", phone: "" }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof Member, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Please enter a bill description.");
      return;
    }
    if (!totalAmount || parsedAmount <= 0) {
      setError("Please enter a valid total amount.");
      return;
    }
    const filledMembers = members.filter((m) => m.name.trim() && m.phone.trim());
    if (filledMembers.length === 0) {
      setError("Please add at least one member.");
      return;
    }

    createBillMutation.mutate({
      data: {
        payerName: payerName || payerPhone,
        payerPhone,
        description: description.trim(),
        totalAmount: parsedAmount,
        members: filledMembers,
      },
    });
  };

  if (!payerPhone) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-[100dvh] pb-10">
      <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold font-heading">New Bill</h1>
        </div>
      </header>

      <main className="p-4 space-y-5 max-w-md mx-auto -mt-2">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Bill Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Dinner at Nusret"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Total Amount (SAR)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
              </div>

              {parsedAmount > 0 && numMembers > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-xl p-4 text-center"
                >
                  <p className="text-sm text-muted-foreground mb-1">Each person pays</p>
                  <p className="text-3xl font-bold font-heading text-secondary">
                    SAR {amountPerPerson.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parsedAmount.toFixed(2)} ÷ {numMembers} {numMembers === 1 ? "person" : "people"}
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Members
              </CardTitle>
              <CardDescription>
                Each member will receive a WhatsApp payment link automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {members.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2 items-start"
                  >
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Full Name"
                        value={member.name}
                        onChange={(e) => updateMember(index, "name", e.target.value)}
                      />
                      <Input
                        placeholder="+966500000000"
                        value={member.phone}
                        onChange={(e) => updateMember(index, "phone", e.target.value)}
                      />
                    </div>
                    {members.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-1 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button
                type="button"
                variant="outline"
                onClick={addMember}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Member
              </Button>
            </CardContent>
          </Card>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-destructive text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={createBillMutation.isPending}
          >
            {createBillMutation.isPending
              ? "Sending payment links via WhatsApp..."
              : "Send Payment Requests"}
          </Button>
        </form>
      </main>
    </div>
  );
}
