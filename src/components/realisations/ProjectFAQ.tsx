import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ProjectFaqItem } from "@/lib/chantiers/types";

interface ProjectFAQProps {
  items: ProjectFaqItem[];
}

const ProjectFAQ = ({ items }: ProjectFAQProps) => {
  if (items.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, idx) => (
        <AccordionItem key={idx} value={`q-${idx}`}>
          <AccordionTrigger className="text-left font-medium">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground whitespace-pre-line">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default ProjectFAQ;
