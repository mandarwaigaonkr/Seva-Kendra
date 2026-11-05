import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Search, X } from "lucide-react";

import sevaLogo from "@/assets/seva_logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ThemeToggle from "@/components/ThemeToggle";
import { ADMIN_NAV, DOMAINS, DOMAIN_TONE, GENERAL_NAV, canSeeDomain, locate } from "./navigation";

const OPEN_KEY = "sk.nav.open";
const readOpen = () => {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) || "{}");
  } catch {
    return {};
  }
};

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");
export const FIND_SHORTCUT = isMac ? "⌘K" : "Ctrl K";

/* One nav row. Active = white chip with a jade bar on the left, so "you are here" is unmistakable. */
const NavItem = ({ to, icon: Icon, children, end, onNavigate, nested }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) =>
      cn(
        "group relative flex min-h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] transition-colors duration-100",
        nested && "pl-10",
        isActive
          ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-border"
          : "text-foreground/80 hover:bg-card/70 hover:text-foreground"
      )
    }
  >
    {({ isActive }) => (
      <>
        {isActive && <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary" />}
        {Icon && <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />}
        <span className="truncate">{children}</span>
      </>
    )}
  </NavLink>
);

const SectionLabel = ({ children }) => <p className="px-3 pb-1 pt-5 text-sm font-medium text-muted-foreground">{children}</p>;

const AppSidebar = ({ open, onClose, onOpenFind }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = locate(pathname).domain?.key;
  const [expanded, setExpanded] = useState(() => ({ ...readOpen(), ...(current ? { [current]: true } : {}) }));

  // Entering a programme always opens its group.
  useEffect(() => {
    if (current) setExpanded((prev) => (prev[current] ? prev : { ...prev, [current]: true }));
  }, [current]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(expanded));
    } catch {
      /* storage unavailable — groups just reset next visit */
    }
  }, [expanded]);

  const domains = DOMAINS.filter((d) => canSeeDomain(user, d));
  const admin = ADMIN_NAV.filter((item) => !item.adminOnly || user?.role === "admin");
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  const signOut = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <>
      {/* Scrim on small screens */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-[hsl(150_14%_11%/0.45)] transition-opacity duration-200 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-border bg-sidebar",
          "transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-4">
          <img src={sevaLogo} alt="" className="h-9 w-9 rounded-md bg-card object-contain p-1 ring-1 ring-border" />
          <div className="min-w-0 leading-tight">
            <p className="font-semibold text-foreground">Seva Kendra</p>
            <p className="text-sm text-muted-foreground">Calcutta</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-card lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Find */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onOpenFind}
            className="flex h-10 w-full items-center gap-2 rounded-md border border-input/70 bg-card px-3 text-left text-[0.9375rem] text-muted-foreground shadow-sm transition-colors duration-100 hover:border-foreground/30 hover:text-foreground"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1">Find a section</span>
            <kbd className="hidden rounded border border-border bg-muted px-1.5 font-sans text-xs text-muted-foreground lg:inline">{FIND_SHORTCUT}</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
          <div className="space-y-0.5 pt-2">
            {GENERAL_NAV.map((item) => (
              <NavItem key={item.path} to={item.path} icon={item.icon} end onNavigate={onClose}>
                {item.name}
              </NavItem>
            ))}
          </div>

          {domains.length > 0 && <SectionLabel>Programmes</SectionLabel>}
          <div className="space-y-0.5">
            {domains.map((d) => {
              const isOpen = !!expanded[d.key];
              const tone = DOMAIN_TONE[d.tone];
              const id = `nav-group-${d.key}`;
              return (
                <div key={d.key}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setExpanded((prev) => ({ ...prev, [d.key]: !prev[d.key] }))}
                    className={cn(
                      "flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-[0.9375rem] transition-colors duration-100 hover:bg-card/70",
                      current === d.key ? "font-medium text-foreground" : "text-foreground/80"
                    )}
                  >
                    <d.icon className={cn("h-[18px] w-[18px] shrink-0", tone.text)} />
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="text-sm text-muted-foreground">{d.modules.length}</span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150", !isOpen && "-rotate-90")} />
                  </button>
                  {isOpen && (
                    <div id={id} className="relative mb-1 mt-0.5 space-y-0.5">
                      <span aria-hidden className={cn("absolute bottom-2 left-[1.3rem] top-1 w-px opacity-30", tone.bg)} />
                      {d.modules.map((m) => (
                        <NavItem key={m.path} to={m.path} nested onNavigate={onClose}>
                          {m.name}
                        </NavItem>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {admin.length > 0 && (
            <>
              <SectionLabel>Admin</SectionLabel>
              <div className="space-y-0.5">
                {admin.map((item) => (
                  <NavItem key={item.path} to={item.path} icon={item.icon} end onNavigate={onClose}>
                    {item.name}
                  </NavItem>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Signed-in user */}
        <div className="flex shrink-0 items-center gap-2 border-t border-border py-3 pl-4 pr-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-medium text-primary">{initials}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.role === "admin" ? "Administrator" : "Staff"}</p>
          </div>
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 hover:bg-card hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
