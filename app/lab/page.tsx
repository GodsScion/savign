import styles from "./lab.module.css";

const PRINCIPLES = [
  [
    "Measure first.",
    "A number without a source is a guess, and we say so when we use one.",
  ],
  ["Fix the cause.", "Patching a symptom only moves the bug to next week."],
  [
    "Keep it local.",
    "Our tools run on your machine, with no backend of our own.",
  ],
  [
    "Readable or it doesn't ship.",
    "If you run a system, you should be able to explain how it works.",
  ],
  [
    "Every run teaches the next.",
    "Each build ends with a review, and what we learn goes back into the tools.",
  ],
];

export default function Lab() {
  return (
    <main>
      <section className={styles.hero} data-scene="hero">
        <h1>Software that clears the way.</h1>
        <p className={styles.lead}>
          SAVIGN is a software company from India. We build tools that help AI
          agents do real work.
        </p>
        <p className={styles.links}>
          <a href="#work">See the work</a>
          <a href="#company">Company information</a>
        </p>
      </section>
      <section className={styles.section} data-scene="principles">
        <h2>How we work</h2>
        <ol className={`${styles.rows} rule-list`}>
          {PRINCIPLES.map(([title, line]) => (
            <li key={title} className="rule-list__row">
              <strong>{title}</strong>
              {line}
            </li>
          ))}
        </ol>
      </section>
      <section className={styles.section} data-scene="work" id="work">
        <h2>What we&apos;re building</h2>
        <p className={styles.lead}>
          Four projects at different stages. None of them is for sale.
        </p>
      </section>
      <section className={styles.section} data-scene="founder">
        <h2>Founder</h2>
        <p className={styles.lead}>Sai Vignesh Golla.</p>
      </section>
      <section className={styles.section} data-scene="contact" id="company">
        <h2>Get in touch</h2>
        <p className={styles.lead}>
          Questions about the tools, or ideas you want to share? Write to us.
        </p>
      </section>
    </main>
  );
}
