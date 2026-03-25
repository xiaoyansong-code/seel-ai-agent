import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import HireAgent from "./pages/HireAgent";
import AgentDetail from "./pages/AgentDetail";
import Conversations from "./pages/Conversations";
import Knowledge from "./pages/Knowledge";
import Settings from "./pages/Settings";
import { toast } from "sonner";

/* Placeholder for Seel global pages (not part of AI Support) */
function SeelPlaceholder() {
  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">This is a Seel platform page.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Navigate to AI support to see the prototype.</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* AI Support module — Agents tab (default) */}
      <Route path="/" component={Dashboard} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/new" component={HireAgent} />
      <Route path="/agents/:id" component={AgentDetail} />

      {/* AI Support — Knowledges tab */}
      <Route path="/knowledge" component={Knowledge} />

      {/* AI Support — Test tab */}
      <Route path="/test" component={Conversations} />
      <Route path="/conversations" component={Conversations} />

      {/* AI Support — Settings tab */}
      <Route path="/settings" component={Settings} />

      {/* Seel global pages (placeholders) */}
      <Route path="/seel/:rest*" component={SeelPlaceholder} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
