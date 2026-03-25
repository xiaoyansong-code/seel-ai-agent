import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import Knowledge from "./pages/Knowledge";
import Conversations from "./pages/Conversations";
import Skills from "./pages/Skills";
import Actions from "./pages/Actions";
import Settings from "./pages/Settings";
import PerformanceOverview from "./pages/PerformanceOverview";

/* Placeholder for Seel global pages */
function SeelPlaceholder() {
  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-center max-w-[320px]">
        <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted-foreground">Coming Soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1">This Seel platform page is not part of the AI Support prototype.</p>
        <p className="text-xs text-muted-foreground/40 mt-3">Navigate to <span className="text-primary font-medium">AI support</span> in the sidebar to explore the prototype.</p>
      </div>
    </div>
  );
}


function Router() {
  return (
    <Switch>
      {/* Agents tab (default) */}
      <Route path="/" component={Agents} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/:id" component={AgentDetail} />

      {/* Playbook tab */}
      <Route path="/playbook" component={Knowledge} />
      <Route path="/playbook/skills" component={Skills} />
      <Route path="/playbook/actions" component={Actions} />

      {/* Performance tab */}
      <Route path="/performance" component={PerformanceOverview} />
      <Route path="/performance/conversations" component={Conversations} />

      {/* Legacy routes redirect */}
      <Route path="/knowledge" component={Knowledge} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/settings" component={Settings} />

      {/* Seel global pages */}
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
