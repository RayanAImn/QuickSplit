import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { usePayer } from "@/hooks/use-payer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [, setLocation] = useLocation();
  const { savePayer, phone: existingPhone } = usePayer();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    savePayer(phone, name);
    setLocation("/dashboard");
  };

  if (existingPhone) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">QuickSplit</h1>
          <p className="text-muted-foreground">Seamless group payments for the Saudi market.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Enter your details to manage your bills.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContinue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name (Optional)</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Ahmed Al-Saud" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="+966500000000" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required
                />
              </div>
              <Button type="submit" className="w-full mt-4">
                Continue to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
