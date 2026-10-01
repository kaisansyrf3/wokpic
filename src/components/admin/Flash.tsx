"use client";

import { useCallback, useState } from "react";

import type { ActionResult } from "@/lib/auth";

export type Flash = { kind: "ok" | "error" | "warn"; text: string } | null;

export function useFlash() {
  const [flash, setFlash] = useState<Flash>(null);

  const report = useCallback(
    (result: ActionResult<unknown>, onOk?: (data: unknown) => void) => {
      if (result.ok) {
        setFlash({ kind: "ok", text: result.message ?? "Tersimpan." });
        if (onOk && result.data !== undefined) onOk(result.data);
      } else {
        setFlash({ kind: "error", text: result.message });
      }
      return result.ok;
    },
    [],
  );

  const run = useCallback(
    async (action: Promise<ActionResult<unknown>>, onOk?: (data: unknown) => void) => {
      setFlash(null);
      try {
        return report(await action, onOk);
      } catch (error) {
        setFlash({
          kind: "error",
          text: error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.",
        });
        return false;
      }
    },
    [report],
  );

  return { flash, setFlash, report, run };
}

export function FlashMessage({ flash }: { flash: Flash }) {
  if (!flash) return null;

  const tone =
    flash.kind === "ok"
      ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-100"
      : flash.kind === "warn"
        ? "border-amber-400/70 bg-amber-500/10 text-amber-100"
        : "border-red-400/70 bg-red-500/10 text-red-200";

  return (
    <p role="status" className={`border-l-2 px-3 py-2 text-sm ${tone}`}>
      {flash.text}
    </p>
  );
}
