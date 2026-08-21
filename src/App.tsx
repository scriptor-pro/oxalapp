import { useEffect, useState } from "react";
import { pb } from "./lib/pocketbase";
import { LoginView } from "./components/LoginView";
import { ScannerView } from "./components/ScannerView";
import { ResultView } from "./components/ResultView";
import { HistoryView } from "./components/HistoryView";
import { ResetPasswordView } from "./components/ResetPasswordView";
import { FoodSearchView } from "./components/FoodSearchView";

type Tab = "scan" | "history";

export function App() {
  const [authed, setAuthed] = useState(pb.authStore.isValid);
  const [tab, setTab] = useState<Tab>("scan");
  const [scanning, setScanning] = useState(false);
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
          setAuthed(false);
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
    <div className="app-shell">
      <button className="logout-button" onClick={() => pb.authStore.clear()}>
        Se déconnecter
      </button>

      <main className="app-main">
        {tab === "scan" &&
          (scannedEan ? (
            <ResultView
              ean={scannedEan}
              onBack={() => {
                setScannedEan(null);
                setScanning(false);
              }}
            />
          ) : scanning ? (
            <ScannerView onScanned={setScannedEan} />
          ) : (
            <div className="screen-content home-screen">
              <svg className="home-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 14h3M14 18h7M18 14v7" />
              </svg>
              <p className="home-title">Prêt à scanner</p>
              <p className="home-sub">
                Vise le code-barres pour estimer sa teneur en oxalate.
              </p>
              <button className="scan-button" onClick={() => setScanning(true)}>
                Scanner un produit
              </button>
              <p className="home-or">ou</p>
              <FoodSearchView />
            </div>
          ))}

        {tab === "history" && <HistoryView />}
      </main>

      <nav className="tab-bar">
        <button
          className={`tab ${tab === "scan" ? "active" : ""}`}
          onClick={() => {
            setTab("scan");
            setScannedEan(null);
            setScanning(false);
          }}
        >
          <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="12" rx="2" /><circle cx="12" cy="13" r="3" /></svg>
          Scanner
        </button>
        <button
          className={`tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          <svg viewBox="0 0 24 24"><path d="M4 4v16h16" /><path d="M8 14l3-3 3 3 4-5" /></svg>
          Historique
        </button>
      </nav>
    </div>
  );
}
