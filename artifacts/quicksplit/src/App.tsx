import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import CreateBill from "@/pages/create";
import BillDetail from "@/pages/bill-detail";
import PayPublic from "@/pages/pay-public";
import PaySuccess from "@/pages/pay-success";
import PayFailure from "@/pages/pay-failure";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/create" component={CreateBill} />
      <Route path="/bills/:billId" component={BillDetail} />
      <Route path="/pay/:billId" component={PayPublic} />
      <Route path="/pay/:billId/success" component={PaySuccess} />
      <Route path="/pay/:billId/failure" component={PayFailure} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
