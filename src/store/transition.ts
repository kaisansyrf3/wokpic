import { create } from "zustand";

export type TransitionPhase =
  | "idle"
  | "rotating"
  | "expanding"
  | "viewing"
  | "closing"
  | "returning";

type TransitionState = {
  phase: TransitionPhase;
  selectedSlug: string | null;
  selectedIndex: number | null;
  delta: number;
  returning: boolean;
};

type TransitionActions = {
  setPhase: (phase: TransitionPhase) => void;
  select: (payload: { slug: string; index: number; delta: number }) => void;
  /** Fills selection info without moving the phase (direct-URL viewer entry). */
  hydrate: (payload: { slug: string; index: number; delta: number }) => void;
  beginReturn: () => void;
  reset: () => void;
};

const initialState: TransitionState = {
  phase: "idle",
  selectedSlug: null,
  selectedIndex: null,
  delta: 0,
  returning: false,
};

export const useTransitionStore = create<TransitionState & TransitionActions>()(
  (set) => ({
    ...initialState,

    setPhase: (phase) => set({ phase }),

    select: ({ slug, index, delta }) =>
      set({ phase: "rotating", selectedSlug: slug, selectedIndex: index, delta }),

    hydrate: ({ slug, index, delta }) =>
      set({ selectedSlug: slug, selectedIndex: index, delta }),

    beginReturn: () => set({ phase: "returning", returning: true }),

    reset: () => set({ ...initialState }),
  }),
);
