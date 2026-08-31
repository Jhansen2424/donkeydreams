"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, MapMouseEvent, MapRef, Marker, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Footprints, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { useAnimals } from "@/lib/animals-context";
import { colorForHerd } from "@/components/app/map/herd-colors";

// The sanctuary's resolved address. Used as the initial map center when
// there are no pens drawn yet. Pulled from the geocoded street address —
// see the chat transcript that established 4343 S Amber Ln, Scenic AZ.
const SANCTUARY_CENTER: [number, number] = [-114.026912, 36.761781]; // [lng, lat]
const INITIAL_ZOOM = 17;

// Local model of an API pen — we keep `polygon` as a Polygon Feature so the
// react-map-gl Source can drop straight into a FeatureCollection.
interface PenRow {
  id: string;
  name: string;
  herd: string;
  polygon: Polygon;
  notes: string;
}

interface ApiPen {
  id: string;
  name: string;
  herd: string;
  polygon: unknown;
  notes: string;
}

type Mode =
  | { kind: "view" }
  | { kind: "draw-tap"; points: [number, number][] }
  | { kind: "draw-walk"; points: [number, number][]; watchId: number | null };

export default function MapPage() {
  const mapRef = useRef<MapRef | null>(null);
  const { herds } = useAnimals();

  const [pens, setPens] = useState<PenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "view" });
  const [editingPen, setEditingPen] = useState<PenRow | null>(null);

  // Token guard — if the user forgot to set NEXT_PUBLIC_MAPBOX_TOKEN we'd
  // crash inside react-map-gl; surface a friendly message instead.
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // ── Load + persist ──
  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/pens", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load pens");
      const body = (await res.json()) as { pens: ApiPen[] };
      setPens(
        body.pens.map((p) => ({
          id: p.id,
          name: p.name,
          herd: p.herd,
          polygon: p.polygon as Polygon,
          notes: p.notes,
        }))
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load pens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // ── Drawing modes ──

  const startDrawTap = () => {
    setEditingPen(null);
    setMode({ kind: "draw-tap", points: [] });
  };

  const startDrawWalk = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert(
        "Your device doesn't support GPS in the browser. Try the 'Tap corners' mode instead."
      );
      return;
    }
    setEditingPen(null);

    // Begin watching position. Push a new point only if it's at least ~2m
    // from the last one — phone GPS jitter spits out near-duplicates.
    const points: [number, number][] = [];
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        const last = points[points.length - 1];
        if (last) {
          const dMeters = turf.distance(turf.point(last), turf.point(pt), {
            units: "meters",
          });
          if (dMeters < 2) return;
        }
        points.push(pt);
        // Recenter the live trace by replacing the mode state. We do this
        // with a functional update so concurrent updates don't drop points.
        setMode((m) => (m.kind === "draw-walk" ? { ...m, points: [...points] } : m));
        // Gently pan the map to follow the walker.
        mapRef.current?.panTo({ lng: pt[0], lat: pt[1] }, { duration: 600 });
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert(
          `Location error: ${err.message}. Make sure you've granted location permission.`
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );

    setMode({ kind: "draw-walk", points: [], watchId });
  };

  const stopWalk = () => {
    if (mode.kind !== "draw-walk") return;
    if (mode.watchId !== null) navigator.geolocation.clearWatch(mode.watchId);
    if (mode.points.length < 3) {
      alert("Need at least 3 points to make a pen. Try walking the perimeter again.");
      setMode({ kind: "view" });
      return;
    }
    // Simplify the line to ~10-30 points (raw walks can capture hundreds)
    // and close it back into a polygon. Tolerance is in degrees — 0.00002 is
    // roughly 2 meters at this latitude.
    const line = turf.lineString(mode.points);
    const simplified = turf.simplify(line, { tolerance: 0.00002, highQuality: false });
    const closed = [...simplified.geometry.coordinates];
    if (
      closed.length > 0 &&
      (closed[0][0] !== closed[closed.length - 1][0] ||
        closed[0][1] !== closed[closed.length - 1][1])
    ) {
      closed.push(closed[0]);
    }
    setMode({ kind: "view" });
    promptAndSave({
      type: "Polygon",
      coordinates: [closed as [number, number][]],
    });
  };

  const cancelDraw = () => {
    if (mode.kind === "draw-walk" && mode.watchId !== null) {
      navigator.geolocation.clearWatch(mode.watchId);
    }
    setMode({ kind: "view" });
  };

  // Add a corner when the user taps the map in tap-draw mode.
  const handleMapClick = (e: MapMouseEvent) => {
    if (mode.kind !== "draw-tap") return;
    const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    setMode({ kind: "draw-tap", points: [...mode.points, pt] });
  };

  const finishTapDraw = () => {
    if (mode.kind !== "draw-tap") return;
    if (mode.points.length < 3) {
      alert("Tap at least 3 corners before saving.");
      return;
    }
    const ring = [...mode.points, mode.points[0]];
    setMode({ kind: "view" });
    promptAndSave({ type: "Polygon", coordinates: [ring] });
  };

  // ── Save flow ──

  const promptAndSave = async (polygon: Polygon) => {
    const name = window.prompt("Name this pen (e.g. 'Brave AM Lot'):");
    if (!name) return;
    const herd = window.prompt(
      `Which herd?\nOne of: ${herds.join(", ")}`,
      herds[0]
    );
    if (!herd) return;
    try {
      const res = await fetch("/api/pens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, herd, polygon, notes: "" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save");
      }
      await reload();
    } catch (e) {
      alert(`Could not save pen: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  };

  const deletePen = async (pen: PenRow) => {
    if (!confirm(`Delete pen "${pen.name}"?`)) return;
    try {
      const res = await fetch(`/api/pens?id=${encodeURIComponent(pen.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await reload();
    } catch (e) {
      alert(`Could not delete: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  };

  const flyToPen = (pen: PenRow) => {
    const bbox = turf.bbox({
      type: "Feature",
      geometry: pen.polygon,
      properties: {},
    } as Feature<Polygon>);
    mapRef.current?.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 60, duration: 800 }
    );
    setEditingPen(pen);
  };

  // ── Render layers ──

  // Saved pens — one filled polygon per pen, colored by herd.
  const savedFeatureCollection: FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: pens.map((p) => ({
        type: "Feature",
        geometry: p.polygon,
        properties: {
          id: p.id,
          name: p.name,
          herd: p.herd,
          color: colorForHerd(p.herd),
        },
      })),
    }),
    [pens]
  );

  // The in-progress draft (either tap or walk). Render as a translucent
  // polygon when we have ≥3 points, otherwise as a line so the user can see
  // their progress.
  const draftFeature: Feature | null = useMemo(() => {
    if (mode.kind === "view") return null;
    const pts = mode.points;
    if (pts.length < 2) return null;
    if (pts.length >= 3) {
      return {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] },
        properties: {},
      };
    }
    return {
      type: "Feature",
      geometry: { type: "LineString", coordinates: pts },
      properties: {},
    };
  }, [mode]);

  // Token missing — bail early with instructions, don't crash the page.
  if (!token) {
    return (
      <div className="p-6 max-w-xl mx-auto bg-white border border-card-border rounded-xl space-y-3">
        <h1 className="text-lg font-bold text-charcoal">Map not configured</h1>
        <p className="text-sm text-warm-gray leading-relaxed">
          The map page needs a Mapbox access token. Set the environment
          variable <code className="bg-cream px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> in
          Vercel (and your local <code className="bg-cream px-1 rounded">.env.local</code> for
          dev), then redeploy.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* Left: pen list / actions */}
      <aside className="lg:w-80 shrink-0 bg-white border border-card-border rounded-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-charcoal">Map</h1>
          <span className="text-[11px] text-warm-gray">{pens.length} pen{pens.length === 1 ? "" : "s"}</span>
        </div>

        {/* Draw controls */}
        {mode.kind === "view" && (
          <div className="space-y-2 mb-4">
            <button
              onClick={startDrawTap}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-sidebar text-white rounded-lg text-sm font-semibold hover:bg-sidebar-light transition-colors"
            >
              <Plus className="w-4 h-4" /> Tap corners
            </button>
            <button
              onClick={startDrawWalk}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-card-border text-charcoal rounded-lg text-sm font-semibold hover:bg-cream transition-colors"
            >
              <Footprints className="w-4 h-4" /> Walk the line
            </button>
          </div>
        )}

        {mode.kind === "draw-tap" && (
          <div className="space-y-2 mb-4 bg-sky/5 border border-sky/20 rounded-lg p-3">
            <p className="text-xs text-charcoal font-semibold">Tap each corner</p>
            <p className="text-[11px] text-warm-gray">
              {mode.points.length} point{mode.points.length === 1 ? "" : "s"} placed. Need 3+ to save.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={finishTapDraw}
                disabled={mode.points.length < 3}
                className="flex-1 px-3 py-1.5 bg-emerald-500 text-white rounded-md text-xs font-semibold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={cancelDraw}
                className="px-3 py-1.5 bg-white border border-card-border text-charcoal rounded-md text-xs font-semibold hover:bg-cream"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mode.kind === "draw-walk" && (
          <div className="space-y-2 mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-charcoal font-semibold">Walking…</p>
            <p className="text-[11px] text-warm-gray">
              Tracking GPS. {mode.points.length} point{mode.points.length === 1 ? "" : "s"} recorded.
              Walk the perimeter, then tap Stop.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={stopWalk}
                className="flex-1 px-3 py-1.5 bg-emerald-500 text-white rounded-md text-xs font-semibold hover:bg-emerald-600"
              >
                Stop &amp; save
              </button>
              <button
                onClick={cancelDraw}
                className="px-3 py-1.5 bg-white border border-card-border text-charcoal rounded-md text-xs font-semibold hover:bg-cream"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Pen list grouped by herd */}
        {loading && <p className="text-xs text-warm-gray/60">Loading…</p>}
        {loadError && <p className="text-xs text-red-600">{loadError}</p>}
        {!loading && pens.length === 0 && (
          <p className="text-xs text-warm-gray/60 italic">No pens drawn yet.</p>
        )}
        <ul className="space-y-1">
          {pens.map((p) => (
            <li key={p.id}>
              <div
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer ${
                  editingPen?.id === p.id ? "bg-sand/30" : "hover:bg-cream"
                }`}
                onClick={() => flyToPen(p)}
              >
                <span
                  className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                  style={{ backgroundColor: colorForHerd(p.herd) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-charcoal truncate">{p.name}</p>
                  <p className="text-[10px] text-warm-gray">{p.herd}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void deletePen(p);
                  }}
                  className="p-1 text-warm-gray hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete pen"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right: the map */}
      <div className="flex-1 bg-white border border-card-border rounded-xl overflow-hidden relative">
        <Map
          ref={mapRef}
          mapboxAccessToken={token}
          initialViewState={{
            longitude: SANCTUARY_CENTER[0],
            latitude: SANCTUARY_CENTER[1],
            zoom: INITIAL_ZOOM,
          }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          style={{ width: "100%", height: "100%" }}
          onClick={handleMapClick}
          cursor={mode.kind === "draw-tap" ? "crosshair" : undefined}
        >
          {/* Saved pens */}
          <Source id="saved-pens" type="geojson" data={savedFeatureCollection}>
            <Layer
              id="saved-pens-fill"
              type="fill"
              paint={{
                "fill-color": ["get", "color"],
                "fill-opacity": 0.35,
              }}
            />
            <Layer
              id="saved-pens-outline"
              type="line"
              paint={{
                "line-color": ["get", "color"],
                "line-width": 2,
              }}
            />
          </Source>

          {/* Draft polygon/line while drawing */}
          {draftFeature && (
            <Source id="draft" type="geojson" data={draftFeature}>
              {draftFeature.geometry.type === "Polygon" && (
                <Layer
                  id="draft-fill"
                  type="fill"
                  paint={{ "fill-color": "#0ea5e9", "fill-opacity": 0.25 }}
                />
              )}
              <Layer
                id="draft-line"
                type="line"
                paint={{
                  "line-color": "#0ea5e9",
                  "line-width": 3,
                  "line-dasharray": [2, 2],
                }}
              />
            </Source>
          )}

          {/* Tap-mode corner markers so the user sees what they've placed */}
          {mode.kind === "draw-tap" &&
            mode.points.map((pt, i) => (
              <Marker key={i} longitude={pt[0]} latitude={pt[1]} anchor="center">
                <span className="block w-3 h-3 rounded-full bg-sky border-2 border-white shadow" />
              </Marker>
            ))}

          {/* Walk-mode: a single pulsing dot at the latest GPS sample */}
          {mode.kind === "draw-walk" && mode.points.length > 0 && (
            <Marker
              longitude={mode.points[mode.points.length - 1][0]}
              latitude={mode.points[mode.points.length - 1][1]}
              anchor="center"
            >
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white" />
              </span>
            </Marker>
          )}
        </Map>

        {/* Selected pen detail (lightweight inline editor) */}
        {editingPen && mode.kind === "view" && (
          <div className="absolute top-3 right-3 bg-white border border-card-border rounded-lg shadow-lg p-3 w-72">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-charcoal flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {editingPen.name}
              </h3>
              <button
                onClick={() => setEditingPen(null)}
                className="p-1 text-warm-gray hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PenEditor
              pen={editingPen}
              onSaved={async () => {
                await reload();
                setEditingPen(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline editor for an existing pen's metadata (name/herd/notes) ──
function PenEditor({
  pen,
  onSaved,
}: {
  pen: PenRow;
  onSaved: () => void | Promise<void>;
}) {
  const { herds } = useAnimals();
  const [name, setName] = useState(pen.name);
  const [herd, setHerd] = useState(pen.herd);
  const [notes, setNotes] = useState(pen.notes);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/pens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pen.id, name, herd, notes }),
      });
      if (!res.ok) throw new Error("Save failed");
      await onSaved();
    } catch (e) {
      alert(`Could not save: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/70">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-0.5 px-2 py-1.5 text-xs border border-card-border rounded-md focus:outline-none focus:ring-1 focus:ring-sky"
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/70">
          Herd
        </label>
        <select
          value={herd}
          onChange={(e) => setHerd(e.target.value)}
          className="w-full mt-0.5 px-2 py-1.5 text-xs border border-card-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-sky"
        >
          {herds.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/70">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full mt-0.5 px-2 py-1.5 text-xs border border-card-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-sky"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-md text-xs font-semibold hover:bg-emerald-600 disabled:opacity-40"
      >
        <Pencil className="w-3 h-3" />
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
