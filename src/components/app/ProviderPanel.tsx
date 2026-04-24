"use client";

import { useState } from "react";
import { Phone, Plus, Trash2, X } from "lucide-react";

// Editable provider list (farriers, equine dentists, vets). State is owned by
// the parent so the panel can be reused across pages — Hoof/Dental and
// Medical both render it.
//
// NOTE: provider data is currently in-memory only (no Prisma model). Changes
// don't persist across reloads. Promoting Provider to a real DB row is a
// separate piece of work.

export type ProviderType = "Farrier" | "Equine Dentist" | "Vet";

export interface Provider {
  name: string;
  type: string;
  phone: string;
}

interface Props {
  providers: Provider[];
  onAdd: (p: { name: string; type: ProviderType; phone: string }) => void;
  onRemove: (name: string) => void;
  onClose: () => void;
  /** Provider types offered in the Add form. Defaults to all three. */
  typeOptions?: ProviderType[];
}

export default function ProviderPanel({
  providers,
  onAdd,
  onRemove,
  onClose,
  typeOptions = ["Farrier", "Equine Dentist", "Vet"],
}: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ProviderType>(typeOptions[0]);
  const [phone, setPhone] = useState("");

  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-charcoal flex items-center gap-2">
          <Phone className="w-4 h-4 text-sky" />
          Providers
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(!adding)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-sky text-white rounded-lg hover:bg-sky-dark transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-warm-gray hover:text-charcoal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {adding && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-cream/50 rounded-lg border border-card-border">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-1.5 text-sm border border-card-border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProviderType)}
            className="px-3 py-1.5 text-sm border border-card-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky"
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-1.5 text-sm border border-card-border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky"
          />
          <button
            onClick={() => {
              if (name.trim()) {
                onAdd({ name: name.trim(), type, phone: phone.trim() });
                setName("");
                setPhone("");
                setAdding(false);
              }
            }}
            className="px-3 py-1.5 text-sm font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Save
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        {providers.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-3 p-3 bg-cream/30 rounded-lg border border-card-border group"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-charcoal">{p.name}</p>
              <p className="text-xs text-warm-gray">
                {p.type} · {p.phone}
              </p>
            </div>
            <button
              onClick={() => onRemove(p.name)}
              className="p-1 text-warm-gray hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
