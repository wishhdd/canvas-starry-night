// App.tsx (самый простой вариант)
import { useRef } from "react";
import styles from "./App.module.scss";
import { CanvasComponent } from "./components/CanvasComponent/CanvasComponent";
import { Controls } from "./components/Controls/Controls";
import { Metrics } from "./components/Metrics/Metrics";
import { CanvasRendererEngine } from "./core/CanvasRendererEngine";

export default function App() {
  const engineRef = useRef<CanvasRendererEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new CanvasRendererEngine();
  }

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <Controls engine={engineRef.current} />
      </header>
      <main className={styles.mainContent}>
        <Metrics engine={engineRef.current} />
        <CanvasComponent engine={engineRef.current} />
      </main>
    </div>
  );
}
