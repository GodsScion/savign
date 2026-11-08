import styles from "../lab.module.css";

const POSES = [
  "work",
  "project",
  "about",
  "founder",
  "notes",
  "note",
  "contact",
  "quiet",
];

export function generateStaticParams() {
  return POSES.map((pose) => ({ pose }));
}

export default async function LabPose({
  params,
}: {
  params: Promise<{ pose: string }>;
}) {
  const { pose } = await params;
  return (
    <main className={styles.page} data-scene={pose}>
      <h1>The {pose} page</h1>
      <p>
        Dummy copy for the lab. The scene behind this text flies to the {pose}{" "}
        pose when you arrive here by a client link, without reloading the world.
      </p>
      <p>
        More words so the column has some weight and a reader can judge contrast
        over the lit field.
      </p>
    </main>
  );
}
