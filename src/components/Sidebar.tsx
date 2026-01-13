import { Users, Calendar, Phone, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: Home, label: "Tableau de bord", path: "/" },
    { icon: Phone, label: "Clients à contacter", path: "/clients-a-contacter" },
    { icon: Calendar, label: "Agendas", path: "/agenda" },
  ];

  return (
    <div className="w-64 h-screen bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] flex flex-col fixed left-0 top-0 border-r border-[hsl(var(--sidebar-border))]">
       <div className="p-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            PAC Manager
          </h2>
       </div>
       <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  active 
                    ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]" 
                    : "hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
       </nav>
    </div>
  );
}
