import type { Section } from "@prisma/client";
import { useId } from "react";
import Select from "react-select";
import { sections } from "../utils/section";

const sectionOptions = sections.map((s) => ({
  value: s.dbSection,
  label: s.display,
}));

export default function SelectSection({
  value,
  onChange,
}: {
  value: Section;
  onChange?: (section?: Section) => void;
}) {
  const instanceId = useId();
  return (
    <Select
      instanceId={instanceId}
      placeholder="Article Section"
      options={sectionOptions}
      value={sectionOptions.find((v) => v.value === value)}
      onChange={(it) => onChange?.(it?.value)}
    />
  );
}
