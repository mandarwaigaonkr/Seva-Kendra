import { useEffect } from "react";
import { useShell } from "./shell/AppShell";

/**
 * Compatibility bridge. Navigation now lives in the persistent AppShell sidebar.
 * Pages that still render <Sidebar sidebarOpen setSidebarOpen /> and toggle it from their own
 * menu button get the shell's menu opened instead; this component renders nothing.
 */
const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { openNav } = useShell();
  useEffect(() => {
    if (sidebarOpen) {
      openNav();
      setSidebarOpen?.(false);
    }
  }, [sidebarOpen, openNav, setSidebarOpen]);
  return null;
};

export default Sidebar;
