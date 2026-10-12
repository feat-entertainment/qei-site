// リリース日(JST)を過ぎたら Coming Soon 表示を切り替え、カウントダウンを更新する
(() => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  document.querySelectorAll("[data-release-date]").forEach((el) => {
    if (el.dataset.releaseDate <= today) el.classList.add("is-released");
  });

  const counters = document.querySelectorAll("[data-countdown]");
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const now = Date.now();
    counters.forEach((el) => {
      const ms = Date.parse(`${el.dataset.countdown}T00:00:00+09:00`) - now;
      if (ms <= 0) {
        el.textContent = "";
        return;
      }
      const d = Math.floor(ms / 864e5);
      const h = Math.floor((ms % 864e5) / 36e5);
      const m = Math.floor((ms % 36e5) / 6e4);
      el.textContent = `${d}d ${pad(h)}h ${pad(m)}m`;
    });
  };
  if (counters.length) {
    tick();
    setInterval(tick, 30_000);
  }
})();
