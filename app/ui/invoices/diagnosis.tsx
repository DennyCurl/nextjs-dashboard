'use client';

import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';

export default function DiagnosisField({ onChange }: { onChange?: (selected: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  type L3 = { id: number; code_level_3: string; level_3: string };
  type L2 = { id: number; code_level_2: string; level_2: string; children?: L3[] };
  type L1 = { id: number; code_level_1: string; level_1: string; children?: L2[] };

  const [data, setData] = useState<L1[]>([]);
  const [expanded, setExpanded] = useState<number[]>([]);

  // 🔹 Поширені діагнози
  const commonDiagnoses = [
    { code: 'J06.9', name: 'ГРВІ, неуточнена' },
    { code: 'I10', name: 'Гіпертонічна хвороба I ст.' },
    { code: 'E11', name: 'Цукровий діабет II типу' },
  ];

  // 🔹 Завантаження МКХ (імітація)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    async function fetchICD(q = '') {
      const url = `/api/icd-full${q ? `?q=${encodeURIComponent(q)}` : ''}`;
      const res = await fetch(url, { signal: controller.signal });
      const icd = await res.json();
      if (mounted) {
        setData(icd);
        // if q provided, auto-expand matching branches (level1 + level2)
        if (q) {
          const l1Ids: number[] = icd.map((l: L1) => l.id);
          const l2Ids: number[] = icd.flatMap((l: L1) => (l.children || []).map((c) => c.id));
          setExpanded(Array.from(new Set([...l1Ids, ...l2Ids])));
        }
      }
    }
    fetchICD();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // debounce search
  const searchTimeout = useRef<number | null>(null);
  useEffect(() => {
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      (async () => {
        const url = `/api/icd-full${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`;
        const res = await fetch(url);
        const icd = await res.json();
        setData(icd);
        if (searchTerm) {
          const l1Ids: number[] = icd.map((l: L1) => l.id);
          const l2Ids: number[] = icd.flatMap((l: L1) => (l.children || []).map((c) => c.id));
          setExpanded(Array.from(new Set([...l1Ids, ...l2Ids])));
        }
      })();
    }, 300) as unknown as number;
    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  }, [searchTerm]);

  const toggleSelect = (code: string, name: string) => {
    const full = `${code} ${name}`;
    setSelected((prev) => {
      const exists = prev.includes(full);
      const updated = exists ? prev.filter((v) => v !== full) : [...prev, full];
      if (onChange) onChange(updated);
      return updated;
    });
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  // server returns filtered tree when `q` is provided; use data directly
  const filtered = data;

  return (
    <div className="space-y-4">
      <label className="block font-semibold text-gray-800">
        Діагнози (МКХ-10):
      </label>

      {/* 🔍 Поле пошуку */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Пошук за кодом або назвою..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* 📋 Поширені діагнози */}
      <div className="flex flex-wrap gap-2">
        {commonDiagnoses.map((d) => (
          <Button
            key={d.code}
            type="button"
            onClick={() => toggleSelect(d.code, d.name)}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            {d.code} — {d.name}
          </Button>
        ))}
      </div>

      {/* 🧾 Ієрархічний список */}
      <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
        {filtered.map((lvl1: L1) => (
          <div key={lvl1.id}>
            <div
              className="font-semibold cursor-pointer text-blue-700"
              onClick={() => toggleExpand(lvl1.id)}
            >
              {lvl1.code_level_1} — {lvl1.level_1}
            </div>

            {expanded.includes(lvl1.id) &&
              lvl1.children?.map((lvl2: L2) => (
                <div key={lvl2.id} className="ml-4">
                  <div
                    className="text-gray-700 cursor-pointer"
                    onClick={() => toggleExpand(lvl2.id)}
                  >
                    {lvl2.code_level_2} — {lvl2.level_2}
                  </div>

                  {expanded.includes(lvl2.id) &&
                    lvl2.children?.map((lvl3: L3) => (
                      <div
                        key={lvl3.id}
                        className="ml-6 flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
                        onClick={() => toggleSelect(lvl3.code_level_3, lvl3.level_3)}
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(`${lvl3.code_level_3} ${lvl3.level_3}`)}
                          readOnly
                        />
                        <span>
                          {lvl3.code_level_3} — {lvl3.level_3}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* 🧾 Вибрані діагнози */}
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <div>
          <strong>Вибрані:</strong> {selected.join('; ')}
        </div>
        <div>
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
    </div>
  );
}
