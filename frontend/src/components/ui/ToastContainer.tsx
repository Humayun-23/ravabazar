'use client';

import { useToastStore } from '@/store/toastStore';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-0 bottom-20 md:bottom-6 z-50 flex flex-col items-center gap-2 px-4 md:items-end md:px-6"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border/60 bg-background/95 p-3 shadow-xl backdrop-blur-xl"
          >
            {toast.image_url ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={toast.image_url}
                  alt={toast.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-bold text-foreground">{toast.title}</p>
              {toast.message && (
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{toast.message}</p>
              )}
            </div>

            {toast.actionText && toast.onAction && (
              <Button
                size="sm"
                variant="default"
                className="h-8 rounded-full px-3 text-xs font-bold shrink-0"
                onClick={() => {
                  toast.onAction?.();
                  removeToast(toast.id);
                }}
              >
                {toast.actionText}
              </Button>
            )}

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
