"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";

let registered = false;

export function ensureGsapPlugins() {
  if (registered) return;
  gsap.registerPlugin(Flip);
  registered = true;
}

ensureGsapPlugins();

export { gsap, Flip };
export default gsap;
