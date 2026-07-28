import { useEffect, useState } from "react";
import { pb } from "./lib/pocketbase";
import { LoginView } from "./components/LoginView";
import { ScannerView } from "./components/ScannerView";
import { ResultView } from "./components/ResultView";
import { HistoryView } from "./components/HistoryView";

type Tab = "scan" | "history";

export function App() {
  const [authed, setAuthed] = useState(pb.authStore.isValid);
  const [tab, setTab] = useState<Tab>("scan");
  const [scannedEan, setScannedEan] = useState<string | null>(null);

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setAuthed(pb.authStore.isValid);
    });
  }, []);

  if (!authed) {
    return <LoginView onAuthenticated={() => setAuthed(true)} />;
  }

  return (
    <div>
      <nav>
        <button onClick={() => { setTab("scan"); setScannedEan(null); }}>
          Scanner
        </button>
        <button onClick={() => setTab("history")}>Historique</button>
      </nav>

      {tab === "scan" &&
        (scannedEan ? (
          <ResultView ean={scannedEan} onBack={() => setScannedEan(null)} />
        ) : (
          <ScannerView onScanned={setScannedEan} />
        ))}

      {tab === "history" && <HistoryView />}
    </div>
  );
}
