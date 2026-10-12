"use client";

// Opt-in documentary narration. OFF by default — the floating pill (or the
// cold open's button, via the "dd:play-story" event) starts the narrator;
// each chapter plays as the reader scrolls it into view. Audio must start
// synchronously inside the tap (mobile autoplay rules). Sections are
// tagged data-narration="<id>"; audio lives at /audio/story/<id>.mp3 with
// a .wav fallback. (Auto-scroll "cinema mode" was tried and removed —
// client 10/12: narration alone, reader keeps the wheel.)

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

export default function Narrator() {
  const [on, setOn] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentRef = useRef<string | null>(null);
  const onRef = useRef(false);
  onRef.current = on;

  // Start everything INSIDE the user's tap. Mobile browsers only allow
  // audio.play() synchronously within a gesture — deferring it to an
  // effect after a state update is why Play was silently failing on
  // phones (client, 10/12).
  const mostVisibleId = (): string => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-narration]"));
    let best: { id: string; overlap: number } | null = null;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      const overlap = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      if (overlap > 0 && (!best || overlap > best.overlap)) {
        best = { id: s.dataset.narration!, overlap };
      }
    }
    return best?.id ?? "hero";
  };

  const armAndPlay = () => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.volume = 0.9;
      audioRef.current = audio;
    }
    const id = mostVisibleId();
    currentRef.current = id;
    setNowPlaying(id);
    audio.src = `/audio/story/${id}.mp3`;
    audio.onerror = () => {
      if (audio!.src.endsWith(".mp3")) {
        audio!.src = audio!.src.replace(/\.mp3$/, ".wav");
        void audio!.play().catch(() => {});
      }
    };
    void audio.play().catch(() => {});
    setOn(true);
  };
  const armRef = useRef(armAndPlay);
  armRef.current = armAndPlay;

  // The cold open's big play button starts the film from anywhere. Note:
  // dispatchEvent is synchronous, so this still runs inside the tap.
  useEffect(() => {
    const play = () => armRef.current();
    window.addEventListener("dd:play-story", play);
    return () => window.removeEventListener("dd:play-story", play);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.9;
    audio.preload = "none";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!on) {
      audioRef.current?.pause();
      currentRef.current = null;
      setNowPlaying(null);
      return;
    }

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-narration]")
    );
    const play = (id: string) => {
      const audio = audioRef.current;
      if (!audio || currentRef.current === id) return;
      currentRef.current = id;
      setNowPlaying(id);
      audio.src = `/audio/story/${id}.mp3`;
      audio.onerror = () => {
        // mp3 missing (ffmpeg-less generation) → try wav once.
        if (audio.src.endsWith(".mp3")) {
          audio.src = `/audio/story/${id}.wav`;
          void audio.play().catch(() => {});
        }
      };
      void audio.play().catch(() => {});
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (!onRef.current) return;
        // Play the most visible newly-intersecting chapter.
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) play((hit.target as HTMLElement).dataset.narration!);
      },
      { threshold: [0.35] }
    );
    sections.forEach((s) => io.observe(s));

    // Start with whichever tagged section is currently most on screen.
    const visible = sections
      .map((s) => {
        const r = s.getBoundingClientRect();
        const overlap =
          Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        return { s, overlap };
      })
      .filter((x) => x.overlap > window.innerHeight * 0.3)
      .sort((a, b) => b.overlap - a.overlap)[0];
    if (visible) play(visible.s.dataset.narration!);

    return () => io.disconnect();
  }, [on]);

  return (
    <button
      onClick={() => {
        if (on) {
          setOn(false);
        } else {
          armAndPlay(); // audio starts inside the tap (mobile autoplay rules)
        }
      }}
      className={`fixed bottom-16 md:bottom-5 left-5 z-50 inline-flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-sm font-bold shadow-lg transition-colors ${
        on
          ? "bg-[#e2963f] text-[#241d14]"
          : "bg-[#241d14]/85 text-[#f6f0e4] backdrop-blur hover:bg-[#241d14]"
      }`}
      aria-pressed={on}
      title={on ? "Stop the narration" : "A narrator reads each chapter as you scroll"}
    >
      {on ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      {on ? "Narrating…" : "Listen to the story"}
      {on && nowPlaying && (
        <span className="flex items-end gap-[2px] h-3.5 ml-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[3px] bg-[#241d14]/70 rounded-full animate-pulse"
              style={{
                height: `${6 + i * 3}px`,
                animationDelay: `${i * 0.18}s`,
                animationDuration: "0.9s",
              }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
