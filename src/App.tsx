import { useEffect, useState } from "react";
import { pb } from "./lib/pocketbase";
import { LoginView } from "./components/LoginView";
import { ScannerView } from "./components/ScannerView";
import { ResultView } from "./components/ResultView";
import { HistoryView } from "./components/HistoryView";
import { ResetPasswordView } from "./components/ResetPasswordView";

type Tab = "scan" | "history";

export function App() {
  const [authed, setAuthed] = useState(pb.authStore.isValid);
  const [tab, setTab] = useState<Tab>("scan");
  const [scannedEan, setScannedEan] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("reset-token")
  );

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setAuthed(pb.authStore.isValid);
    });
  }, []);

  if (resetToken) {
    return (
      <ResetPasswordView
        token={resetToken}
        onResetComplete={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setResetToken(null);
        }}
        onRequestNewReset={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setResetToken(null);
          setAuthed(false);
        }}
      />
    );
  }

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
        <button onClick={() => pb.authStore.clear()}>Se déconnecter</button>
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
