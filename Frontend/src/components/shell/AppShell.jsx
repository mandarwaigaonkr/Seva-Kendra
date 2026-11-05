import React, { Suspense, createContext, useCallback, useContext, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import AppSidebar from "./AppSidebar";
import FindSection from "./FindSection";

const ShellContext = createContext({ openNav: () => {}, openFind: () => {} });
export const useShell = () => useContext(ShellContext);

/** Shown only if a page takes longer than ~300ms to load, so fast navigations never flash. */
const PageFallback = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="flex h-full items-center justify-center" role="status">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none" />
      <span className="sr-only">Loading page</span>
    </div>
  );
};

/**
 * Persistent app frame: the sidebar mounts once and stays put while pages change,
 * so navigation no longer re-renders (and re-animates) the whole screen.
 */
const AppShell = ({ preload }) => {
  const [navOpen, setNavOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const { pathname } = useLocation();

  const openNav = useCallback(() => setNavOpen(true), []);
  const openFind = useCallback(() => setFindOpen(true), []);

  useEffect(() => setNavOpen(false), [pathname]);

  // Ctrl/⌘ K opens "Find a section"; Esc closes the mobile menu.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFindOpen((v) => !v);
      } else if (e.key === "Escape") {
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Warm every page's code once the browser is idle, so later clicks open instantly.
  useEffect(() => {
    if (!preload) return;
    const run = () => preload();
    const id = window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 4000 }) : setTimeout(run, 2000);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, [preload]);

  return (
    <ShellContext.Provider value={{ openNav, openFind }}>
      <div className="flex h-dvh overflow-hidden bg-background">
        <AppSidebar open={navOpen} onClose={() => setNavOpen(false)} onOpenFind={() => setFindOpen(true)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto" id="app-content">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <FindSection open={findOpen} onOpenChange={setFindOpen} />
    </ShellContext.Provider>
  );
};

export default AppShell;
