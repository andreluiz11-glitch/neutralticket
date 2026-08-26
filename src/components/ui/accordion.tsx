"use client";

/**
 * Accordion mínimo para seu projeto.
 * Exports: Accordion, AccordionItem, AccordionTrigger, AccordionContent
 * Mantém as MESMAS assinaturas usadas no FAQAccordion.
 */

import { useState } from "react";

type RootProps = {
  className?: string;
  children: React.ReactNode;
  type?: "single";        // compat com API do shadcn
  collapsible?: boolean;  // compat
};

export function Accordion({ className, children }: RootProps) {
  return (
    <div className={`divide-y rounded-lg border ${className ?? ""}`}>
      {children}
    </div>
  );
}

type ItemProps = { value: string; children: React.ReactNode };
export function AccordionItem({ children }: ItemProps) {
  return <div className="py-2">{children}</div>;
}

type TriggerProps = { children: React.ReactNode };
export function AccordionTrigger({ children }: TriggerProps) {
  // estado local simples – abre/fecha visualmente via CSS utilitário
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left py-3 font-medium flex items-center justify-between"
      aria-expanded={open}
    >
      <span>{children}</span>
      <span className="text-xl leading-none">{open ? "−" : "+"}</span>
    </button>
  );
}

type ContentProps = { children: React.ReactNode };
export function AccordionContent({ children }: ContentProps) {
  return (
    <div className="pb-3 pl-1 text-sm text-neutral-600">
      {children}
    </div>
  );
}
