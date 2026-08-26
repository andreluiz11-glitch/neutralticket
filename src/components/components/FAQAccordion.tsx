"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

type Props = {
  items: { question: string; answer: string }[];
};

/**
 * Componente de Perguntas Frequentes (FAQ)
 * Usa o Accordion simples em src/components/ui/accordion.tsx
 */
export default function FAQAccordion({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-2">Perguntas frequentes</h3>

      <Accordion className="w-full">
        {items.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{f.question}</AccordionTrigger>
            <AccordionContent>{f.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
