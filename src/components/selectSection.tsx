import { useId } from "react";
import Select from "react-select";
import { sections } from "../utils/section";

const sectionOptions = sections.map((s) => ({
  value: s.id,
  label: s.display,
}));

export default function SelectSection({
  value,
  onChange,
}: {
  value: string;
  onChange?: (section?: string) => void;
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
