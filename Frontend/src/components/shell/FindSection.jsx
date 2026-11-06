import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { DOMAIN_TONE, flatNav } from "./navigation";

const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * "Find a section": type part of a name ("tb", "pension", "camp") and press Enter.
 * Matches on the section name, its programme and its plain-language hint.
 */
const FindSection = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const items = useMemo(() => flatNav(user), [user]);
  const results = useMemo(() => {
    const q = normalise(query);
    if (!q) return items;
    const words = q.split(" ");
    return items.filter((item) => {
      const hay = normalise(`${item.name} ${item.section?.name || ""} ${item.hint || ""} ${item.path}`);
      return words.every((w) => hay.includes(w));
    });
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item) => {
    if (!item) return;
    onOpenChange(false);
    navigate(item.path);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="mb-auto mt-[12vh] gap-0 p-0 max-w-xl">
        <DialogTitle className="sr-only">Find a section</DialogTitle>
        <DialogDescription className="sr-only">Type part of a section name, then press Enter to open it.</DialogDescription>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="e.g. TB, pension, study centre"
            aria-label="Find a section"
            aria-controls="find-results"
            aria-activedescendant={results[active] ? `find-${active}` : undefined}
            className="h-14 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/80"
          />
        </div>
        <ul id="find-results" role="listbox" ref={listRef} className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">No section matches “{query}”. Try a shorter word.</li>
          )}
          {results.map((item, i) => {
            const Icon = item.icon || item.section?.icon;
            const tone = item.section ? DOMAIN_TONE[item.section.tone] : null;
            return (
              <li
                key={item.path}
                id={`find-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => go(item)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5", i === active && "bg-accent")}
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted", tone?.text || "text-muted-foreground")}>
                  {Icon && <Icon className="h-[18px] w-[18px]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{item.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{item.hint}</span>
                </span>
                {item.section && <span className={cn("hidden shrink-0 text-sm sm:inline", tone.text)}>{item.section.name}</span>}
                {i === active && <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>↑ ↓ to move</span>
          <span>Enter to open</span>
          <span>Esc to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindSection;
