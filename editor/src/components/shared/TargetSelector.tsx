import { useId, useMemo, useState } from 'react';
import { useAllTargetIds } from '@/store/useEditorStore';

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

  const { filteredQuestions, filteredResults, hasValue } = useMemo(() => {
    const match = (candidate: string) =>
      !normalizedFilter || candidate.toLowerCase().includes(normalizedFilter);
    return {
      filteredQuestions: questionIds.filter(match),
      filteredResults: resultIds.filter(match),
      hasValue: questionIds.includes(value) || resultIds.includes(value) || !value,
    };
  }, [filter, questionIds, resultIds, value, normalizedFilter]);

  return (
    <div className="target-selector">
      <input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter targets"
        className="target-selector-filter"
      />
      <select
        aria-describedby={!hasValue && value ? describedById : undefined}
        className={`target-selector-input ${!hasValue && value ? 'target-selector-invalid' : ''}`}
        value={value}
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
      {!hasValue && value ? (
        <span id={describedById} className="target-selector-error" title={`\"${value}\" not found`}>
          {`\"${value}\" not found`}
        </span>
      ) : null}
    </div>
  );
}
