import { useId, useMemo } from "react";
import Select from "react-select";
import { trpc } from "../utils/trpc";
import CreatableSelect from "react-select/creatable";

export function MultiSelectContributor({
  selectedWriters,
  onChange,
  placeholder,
}: {
  selectedWriters: string[];
  onChange?: (writerIds: string[]) => void;
  placeholder?: string;
}) {
  const { data: contributors } = trpc.contributor.all.useQuery();
  const instanceId = useId();

  const contributorOptions = useMemo(
    () =>
      contributors?.map((x) => ({
        value: x.id,
        label: `${x.firstName} ${x.lastName}`,
      })),
    [contributors]
  );

  return (
    <Select
      placeholder={placeholder}
      isLoading={contributors == null}
      instanceId={instanceId}
      isMulti
      closeMenuOnSelect={false}
      options={contributorOptions}
      value={selectedWriters.map((v) =>
        contributorOptions?.find((o) => o.value === v)
      )}
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      onChange={(it) => onChange?.(it.map((v) => v!.value))}
    />
  );
}

export function SelectContributor({
  selectedContributorId,
  selectedContributorText,
  onChange,
  placeholder,
  className,
}: {
  selectedContributorId?: string;
  selectedContributorText?: string;
  onChange?: (contributor: {
    contributorId?: string;
    contributorText?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}) {
  const { data: contributors } = trpc.contributor.all.useQuery();
  const instanceId = useId();

  const contributorOptions = useMemo(
    () =>
      contributors?.map((x) => ({
        value: x.id,
        label: `${x.firstName} ${x.lastName}`,
      })),
    [contributors]
  );

  const selectValue = useMemo(() => {
    if (selectedContributorId != null) {
      return contributorOptions?.find((c) => c.value === selectedContributorId);
    }

    if (selectedContributorText != null) {
      return { value: selectedContributorText, label: selectedContributorText };
    }
  }, [contributorOptions, selectedContributorId, selectedContributorText]);

  return (
    <CreatableSelect
      className={className}
      placeholder={placeholder}
      isLoading={contributors == null}
      instanceId={instanceId}
      options={contributorOptions}
      allowCreateWhileLoading={false}
      formatCreateLabel={(value) => (
        <p>Outside contributor: &quot;{value}&quot;</p>
      )}
      onCreateOption={(newOption) => {
        onChange?.({ contributorText: newOption, contributorId: undefined });
      }}
      value={selectValue ?? null}
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      onChange={(it) =>
        onChange?.({
          contributorId: it?.value,
          contributorText: it?.label,
        })
      }
    />
  );
}
