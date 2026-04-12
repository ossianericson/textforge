import { useId, useMemo, useState } from 'react';
import { useAllTargetIds } from '@/store/useEditorStore';
import { normalizeRoutingTarget } from '@/lib/routing-targets';

interface Props {
  value: string;
  onChange: (target: string) => void;
  placeholder?: string;
}

export function TargetSelector({ value, onChange, placeholder = 'Select target' }: Props) {
  const { questionIds, resultIds } = useAllTargetIds();
  const [filter, setFilter] = useState('');
  const describedById = useId();
  const normalizedFilter = filter.trim().toLowerCase();
  const normalizedValue = normalizeRoutingTarget(value);

  const { filteredQuestions, filteredResults, hasValue } = useMemo(() => {
    const match = (candidate: string) =>
      !normalizedFilter || candidate.toLowerCase().includes(normalizedFilter);
    return {
      filteredQuestions: questionIds.filter(match),
      filteredResults: resultIds.filter(match),
      hasValue:
        questionIds.includes(normalizedValue) ||
        resultIds.includes(normalizedValue) ||
        !normalizedValue,
    };
  }, [filter, normalizedValue, questionIds, resultIds, normalizedFilter]);

  return (
    <div className="target-selector">
      <input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter targets"
        className="target-selector-filter"
      />
      <select
        aria-describedby={!hasValue && normalizedValue ? describedById : undefined}
        className={`target-selector-input ${!hasValue && normalizedValue ? 'target-selector-invalid' : ''}`}
        value={normalizedValue}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        <optgroup label="Questions">
          {filteredQuestions.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </optgroup>
        <optgroup label="Results">
          {filteredResults.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </optgroup>
      </select>
      {!hasValue && normalizedValue ? (
        <span
          id={describedById}
          className="target-selector-error"
          title={`\"${normalizedValue}\" not found`}
        >
          {`\"${normalizedValue}\" not found`}
        </span>
      ) : null}
    </div>
  );
}
