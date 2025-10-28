'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';

export type SelectedMedication = {
  id?: number | null;
  code: string;
  label: string;
  dose?: string | null;
  note?: string | null;
  // скільки разів на день приймати
  frequencyPerDay?: number | null;
  // скільки днів приймати
  days?: number | null;
  // номер листа призначень, якщо цей препарат прийшов з таблиці prescriptions
  prescriptionNumber?: string | null;
};

export default function MedicationsField({ onChange, initialSelected }: { onChange?: (selected: SelectedMedication[]) => void; initialSelected?: SelectedMedication[] }) {
  const [selected, setSelected] = useState<SelectedMedication[]>(initialSelected ?? []);
  const [searchTerm, setSearchTerm] = useState('');
  type DrugRow = { id: number; full_drug_name: string; unit?: string | null; available_quantity?: number | null };
  type Node = { id: number; code?: string | null; name: string; level?: number | null; children?: Node[]; drugs?: DrugRow[] };

  const [data, setData] = useState<Node[]>([]);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // collect ids of nodes that should be expanded (those with children), recursively
  const collectExpandIds = useCallback((nodes: Node[] | undefined): number[] => {
    const ids: number[] = [];
    if (!nodes) return ids;
    const walk = (n: Node) => {
      // walk children first
      if (n.children && n.children.length > 0) {
        for (const c of n.children) walk(c);
      }
      // expand node if it has children OR has drugs attached
      if ((n.children && n.children.length > 0) || (n.drugs && n.drugs.length > 0)) {
        ids.push(n.id);
      }
    };
    for (const r of nodes) walk(r);
    return ids;
  }, []);

  const commonMeds = [
    { code: 'N02BE01', name: 'Парацетамол' },
    { code: 'M01AE01', name: 'Ібупрофен' },
  ];

  // Recursive node renderer
  const hasDrugsInSubtree = (node: Node): boolean => {
    if (node.drugs && node.drugs.length > 0) return true;
    if (!node.children || node.children.length === 0) return false;
    for (const c of node.children) if (hasDrugsInSubtree(c)) return true;
    return false;
  };

  function NodeItem({ node, level = 0 }: { node: Node; level?: number }) {
    return (
      <div>
        <div
          className={
            `font-semibold cursor-pointer ${hasDrugsInSubtree(node) ? 'text-blue-700' : 'text-gray-500'}`
          }
          onClick={() => toggleExpand(node.id)}
          style={{ marginLeft: level * 12 }}
        >
          {node.code ? `${node.code} — ${node.name}` : node.name}
        </div>

        {expanded.includes(node.id) && (
          <div>
            {/* drugs under this node */}
            {node.drugs && node.drugs.map((drug: DrugRow) => (
              <div key={drug.id} style={{ marginLeft: (level + 1) * 12 }}>
                <div className="flex items-center space-x-2 hover:bg-gray-100 rounded px-2 py-1">
                  <input
                    id={`med-${drug.id}`}
                    type="checkbox"
                    checked={selected.some((s) => s.id === drug.id)}
                    onChange={() => toggleSelect(String(drug.id), drug.full_drug_name, drug.id)}
                  />
                  <label htmlFor={`med-${drug.id}`} className="select-none">
                    {drug.full_drug_name}
                    <span className="text-gray-500 ml-2">{
                      `Залишок: ${drug.available_quantity ?? 0}${drug.unit ? ' ' + drug.unit : ''}`
                    }</span>
                  </label>
                </div>

                {selected.some((s) => s.id === drug.id) && null}
              </div>
            ))}

            {/* children */}
            {node.children && node.children.map((c) => (
              <div key={c.id}>
                <NodeItem node={c} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    // if parent provides initialSelected (e.g., prescriptions for chosen patient), apply it
    if (initialSelected && Array.isArray(initialSelected)) {
      setSelected(initialSelected);
      if (onChange) onChange(initialSelected);
    }

    let mounted = true;
    const controller = new AbortController();
    async function fetchATC(q = '') {
      const url = `/api/drugs-full${q ? `?q=${encodeURIComponent(q)}` : ''}`;
      const res = await fetch(url, { signal: controller.signal });
      const atc = await res.json();
      if (mounted) {
        setData(atc);
        if (q) {
          setExpanded(Array.from(new Set(collectExpandIds(atc))));
        }
      }
    }
    fetchATC();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [collectExpandIds, initialSelected, onChange]);

  // debounce search
  const searchTimeout = useRef<number | null>(null);
  useEffect(() => {
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      (async () => {
        const url = `/api/drugs-full${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`;
        const res = await fetch(url);
        const atc = await res.json();
        setData(atc);
        if (searchTerm) {
          setExpanded(Array.from(new Set(collectExpandIds(atc))));
        }
      })();
    }, 300) as unknown as number;
    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  }, [searchTerm, collectExpandIds]);

  const toggleSelect = (code: string, name: string, id?: number | null) => {
    setSelected((prev) => {
      const idx = prev.findIndex((p) => p.code === code && p.label === name);
      let updated: SelectedMedication[];
      if (idx >= 0) {
        updated = prev.filter((_, i) => i !== idx);
      } else {
        updated = [...prev, { id: id ?? null, code, label: name, dose: null, note: null, frequencyPerDay: null, days: null }];
      }
      if (onChange) onChange(updated);
      return updated;
    });
  };

  const updateNote = (code: string, name: string, note: string) => {
    setSelected((prev) => {
      const idx = prev.findIndex((p) => p.code === code && p.label === name);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], note: note || null };
      if (onChange) onChange(copy);
      return copy;
    });
  };

  const updateDose = (code: string, name: string, dose: string) => {
    setSelected((prev) => {
      const idx = prev.findIndex((p) => p.code === code && p.label === name);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], dose: dose || null };
      if (onChange) onChange(copy);
      return copy;
    });
  };

  const updateFrequency = (code: string, name: string, freqStr: string) => {
    // перетворення рядка у number або null
    const v = freqStr === '' ? null : Math.max(1, Number(freqStr));
    setSelected((prev) => {
      const idx = prev.findIndex((p) => p.code === code && p.label === name);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], frequencyPerDay: Number.isFinite(v as number) ? (v as number) : null };
      if (onChange) onChange(copy);
      return copy;
    });
  };

  const updateDays = (code: string, name: string, daysStr: string) => {
    const v = daysStr === '' ? null : Math.max(1, Number(daysStr));
    setSelected((prev) => {
      const idx = prev.findIndex((p) => p.code === code && p.label === name);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], days: Number.isFinite(v as number) ? (v as number) : null };
      if (onChange) onChange(copy);
      return copy;
    });
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const filtered = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className="block font-semibold text-gray-800 cursor-pointer flex items-center gap-2"
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((v) => !v);
            }
          }}
        >
          <span>Медикаменти</span>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            aria-hidden
          />
        </h3>
      </div>

      {isOpen && (
        <>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Медикамент за кодом або назвою..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {commonMeds.map((m) => (
              <Button key={m.code} type="button" onClick={() => toggleSelect(m.code, m.name)} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                {m.code} — {m.name}
              </Button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
            {/* Recursive renderer for arbitrary-depth tree */}
            {/**
             * Render a list of nodes recursively. We use inline margin for indentation
             * to avoid Tailwind dynamic class issues.
             */}
            {filtered && filtered.length > 0 && (
              <div>
                {filtered.map((n) => (
                  <NodeItem key={n.id} node={n} level={0} />
                ))}
              </div>
            )}
          </div>

          {isOpen && (
            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
              <div>
                <strong>Вибрані медикаменти:</strong>{' '}
                {selected.length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {(() => {
                      // group selected by prescriptionNumber (null/undefined => "__manual")
                      const groups: Record<string, SelectedMedication[]> = {};
                      for (const s of selected) {
                        const key = s.prescriptionNumber ?? '__manual';
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(s);
                      }
                      return Object.entries(groups).map(([key, meds]) => (
                        <div key={key} className="border rounded-lg p-3 bg-white">
                          {key !== '__manual' && (
                            <div className="text-sm text-gray-700 font-semibold mb-2">{`Лист призначень №${key}:`}</div>
                          )}
                          <div className="space-y-2">
                            {meds.map((s) => (
                              <div key={`${s.code}-${s.label}`} className="border rounded-md p-2 bg-gray-50">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-gray-800 font-medium">{s.code} — {s.label}</div>
                                  <button
                                    type="button"
                                    onClick={() => toggleSelect(s.code, s.label, s.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    aria-label="Видалити препарат"
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </button>
                                </div>
                                <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Доза"
                                    className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                    value={s.dose ?? ''}
                                    onChange={(e) => updateDose(s.code, s.label, e.target.value)}
                                  />
                                  <input
                                    type="number"
                                    min={1}
                                    inputMode="numeric"
                                    placeholder="×/день"
                                    className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                    value={s.frequencyPerDay ?? ''}
                                    onChange={(e) => updateFrequency(s.code, s.label, e.target.value)}
                                  />
                                  <input
                                    type="number"
                                    min={1}
                                    inputMode="numeric"
                                    placeholder="Днів"
                                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                    value={s.days ?? ''}
                                    onChange={(e) => updateDays(s.code, s.label, e.target.value)}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Примітка до препарату"
                                    className="w-full md:flex-1 md:min-w-[200px] rounded-md border border-gray-300 px-2 py-1 text-sm"
                                    value={s.note ?? ''}
                                    onChange={(e) => updateNote(s.code, s.label, e.target.value)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <span className="text-gray-500">немає</span>
                )}
              </div>
              <div className="self-end">
                <Button
                  type="button"
                  onClick={() => {
                    setSelected([]);
                    if (onChange) onChange([]);
                  }}
                  className="bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Очистити
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
