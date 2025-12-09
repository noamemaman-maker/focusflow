"use client";

export function useSoundAlert() {
  function playSound(src: string): void {
    if (typeof window === "undefined") return;

    try {
      const audio = new Audio(src);
      audio.volume = 0.6;
      audio.addEventListener("error", (e) => {
        console.error("Audio load error for", src, e);
      });
      void audio.play().catch((e) => {
        console.error("Failed to play sound", src, e);
      });
    } catch (e) {
      console.error("Failed to create audio", src, e);
    }
  }

  return playSound;
}

