"use client";
import { createElement, useEffect, useRef, useState, type ReactNode, type ElementType } from "react";

export default function Reveal({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return createElement(
    Tag,
    // eslint-disable-next-line react-hooks/refs -- the ref prop is a callback that only touches ref.current after mount
    {
      ref: (el: HTMLElement | null) => {
        ref.current = el;
      },
      className: `${className} ${inView ? "in-view" : ""}`.trim(),
      ...rest,
    },
    children
  );
}
