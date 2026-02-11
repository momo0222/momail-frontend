import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Emails } from "./pages/Emails";
import { Home, Mail, Settings, FileMinusCorner, type LucideIcon } from "lucide-react";
import { EmailDetail } from "./pages/EmailDetail";
import { ThreadDetail } from "./pages/ThreadDetail";
import { Compose } from "./pages/Compose";
import { Drafts } from "./pages/Drafts";

/* ----------------------------------- App ----------------------------------- */

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r bg-background">
          <div className="p-6 flex gap-2 items-center">
            <img src="/momail.svg" alt="MoMail" className="w-10 h-10" />
            <h2 className="text-2xl font-bold">MoMail</h2>
          </div>
          
          <nav className="px-4 space-y-2">
            <NavItem to="/" icon={Home}>
              Dashboard
            </NavItem>
            <NavItem to="/emails" icon={Mail}>
              Emails
            </NavItem>
            <NavItem to="/settings" icon={Settings}>
              Settings
            </NavItem>
            <NavItem to="/drafts" icon={FileMinusCorner}>
              Drafts
            </NavItem>
          </nav>
        </aside>
        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/emails/:emailId" element={<EmailDetail/>} />
            <Route path="/emails/thread/:threadId" element={<ThreadDetail />}/>
            <Route path="/compose" element={<Compose />} />
            <Route path="/compose/:draftId" element={<Compose />} />
            <Route path="/drafts" element={<Drafts />}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

/* --------------------------------- NavItem -------------------------------- */

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

function NavItem({ to, icon: Icon, children }: NavItemProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  );
}
