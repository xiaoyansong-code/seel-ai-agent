import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Agents from "./pages/Agents";
import HireAgent from "./pages/HireAgent";
import AgentDetail from "./pages/AgentDetail";
import Knowledge from "./pages/Knowledge";
import Conversations from "./pages/Conversations";
import Skills from "./pages/Skills";
import Actions from "./pages/Actions";
import Settings from "./pages/Settings";

/* Placeholder for Seel global pages */
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

/* Placeholder for sub-tabs not yet built */
function SubTabPlaceholder({ title }: { title: string }) {
  return (
    <div className="p-6">
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Coming soon</p>
      </div>
    </div>
  );
}



function AnalyticsPage() { return <SubTabPlaceholder title="Analytics" />; }

function Router() {
  return (
    <Switch>
      {/* Agents tab (default) */}
      <Route path="/" component={Agents} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/new" component={HireAgent} />
      <Route path="/agents/:id" component={AgentDetail} />

      {/* Playbook tab */}
      <Route path="/playbook" component={Knowledge} />
      <Route path="/playbook/skills" component={Skills} />
      <Route path="/playbook/actions" component={Actions} />

      {/* Performance tab */}
      <Route path="/performance" component={Conversations} />
      <Route path="/performance/analytics" component={AnalyticsPage} />

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
