// Loads the official YouTube IFrame Player API exactly once and hands back
// the global `YT` namespace via a promise. Every real playback command
// (play / pause / seek / getCurrentTime / setPlaybackRate) needs a real
// `YT.Player` instance — postMessage-only "blind" commands cannot read
// state back (e.g. current time) and are unreliable without the handshake
// the API performs on load.

let apiPromise = null;

export const loadYouTubeApi = () => {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);

    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === "function") previousCallback();
      resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return apiPromise;
};
