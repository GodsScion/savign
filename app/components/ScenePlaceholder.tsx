// Stands in for app/scene/SceneRoot until the scene package merges: the same CSS fallback backdrop, no WebGL.
export default function ScenePlaceholder() {
  return <div className="scene-fallback" aria-hidden="true" />;
}
