// Work rows rise and brighten from 0.4 the first time their list enters the viewport.
export function bindRise() {
  const lists = [...document.querySelectorAll<HTMLElement>("[data-rise]")];
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  for (const list of lists) {
    list.classList.add("rise-armed");
    observer.observe(list);
  }
  return () => {
    observer.disconnect();
  };
}
