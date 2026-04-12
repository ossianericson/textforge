interface TagListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function TagList({ items, onChange, placeholder = 'Add item…' }: TagListProps) {
  const add = () => {
    const value = window.prompt(placeholder);
    if (value?.trim()) {
      onChange([...items, value.trim()]);
    }
  };

  const update = (index: number, value: string) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const remove = (index: number) => onChange(items.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex items-center gap-2">
          <input className="input-sm flex-1" value={item} onChange={(event) => update(index, event.target.value)} />
          <button onClick={() => remove(index)} className="text-xs text-red-300 transition hover:text-red-200">✕</button>
        </div>
      ))}
      <button onClick={add} className="text-left text-xs text-emerald-300 transition hover:text-emerald-200">+ Add</button>
    </div>
  );
}