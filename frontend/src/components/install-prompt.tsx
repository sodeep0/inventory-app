"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const hoursSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissal < 24) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // User dismissed - don't show again for 24 hours
      localStorage.setItem("installPromptDismissed", Date.now().toString());
      setShowPrompt(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem("installPromptDismissed", Date.now().toString());
    setShowPrompt(false);
    setDeferredPrompt(null);
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:max-w-sm">
      <div className="rounded-lg border border-border/60 bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <PhosphorIcon name="Plus" size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">Install Stock Keeper</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add this app to your home screen for quick access and offline support.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <PhosphorIcon name="X" size={14} />
          </button>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleDismiss}>
            Not now
          </Button>
          <Button size="sm" onClick={handleInstall}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
