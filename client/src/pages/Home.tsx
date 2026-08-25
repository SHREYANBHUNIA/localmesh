/**
 * LocalMesh — Field Instrument
 * Design reminder: an asymmetric operations bench; midnight instrument surfaces,
 * Relay Green indicates verified state, and every action leaves visible evidence.
 */
import {
  Activity,
  ArrowDownToLine,
  ChevronRight,
  CircleCheck,
  CloudOff,
  Copy,
  Cpu,
  FilePenLine,
  Fingerprint,
  GitBranch,
  Link2,
  LockKeyhole,
  Network,
  Radio,
  RefreshCw,
  ShieldCheck,
  Split,
  Terminal,
  TriangleAlert,
  Unplug,
  UsersRound,
  Wifi,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type DeviceId = "alpha" | "bravo" | "charlie";
type EventTone = "good" | "warn" | "danger" | "neutral";

type DocumentState = {
  title: string;
  body: string;
  vector: Record<DeviceId, number>;
  updatedBy: DeviceId;
  hash: string;
};

type MeshDevice = {
  id: DeviceId;
  name: string;
  role: string;
  short: string;
  location: string;
  ip: string;
  accent: string;
  online: boolean;
  pending: number;
  doc: DocumentState;
};

type LedgerEvent = {
  id: number;
  time: string;
  title: string;
  detail: string;
  tone: EventTone;
};

const peerIds: DeviceId[] = ["alpha", "bravo", "charlie"];
const initialBody = `Draft: Map critical incident paths
• Confirm site leads
• Share last-known device locations`;

const initialVector: Record<DeviceId, number> = { alpha: 8, bravo: 8, charlie: 8 };

function createHash(seed: string) {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, "0");
}

function timeNow() {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function displayVector(vector: Record<DeviceId, number>) {
  return `α${vector.alpha} · β${vector.bravo} · γ${vector.charlie}`;
}

function mergeBodies(bodies: string[]) {
  const seen = new Set<string>();
  return bodies
    .flatMap((body) => body.split("\n"))
    .filter((line) => {
      const normalized = line.trim();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .join("\n");
}

function buildInitialDevices(): MeshDevice[] {
  return [
    {
      id: "alpha",
      name: "Device A",
      role: "Field lead",
      short: "A",
      location: "North Camp",
      ip: "mesh://a7f2",
      accent: "#c6f46f",
      online: true,
      pending: 0,
      doc: { title: "Incident coordination", body: initialBody, vector: initialVector, updatedBy: "alpha", hash: "e64c0af1" },
    },
    {
      id: "bravo",
      name: "Device B",
      role: "Operations",
      short: "B",
      location: "Relay Point",
      ip: "mesh://b1c9",
      accent: "#b8d5ff",
      online: true,
      pending: 0,
      doc: { title: "Incident coordination", body: initialBody, vector: initialVector, updatedBy: "alpha", hash: "e64c0af1" },
    },
    {
      id: "charlie",
      name: "Device C",
      role: "Response unit",
      short: "C",
      location: "East Trail",
      ip: "mesh://c4d8",
      accent: "#ffbd69",
      online: true,
      pending: 0,
      doc: { title: "Incident coordination", body: initialBody, vector: initialVector, updatedBy: "alpha", hash: "e64c0af1" },
    },
  ];
}

function MiniMark({ className = "" }: { className?: string }) {
  return (
    <div className={`mini-mark ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <i />
      <i />
      <i />
    </div>
  );
}

export default function Home() {
  const [devices, setDevices] = useState<MeshDevice[]>(buildInitialDevices);
  const [selected, setSelected] = useState<DeviceId>("bravo");
  const [partitioned, setPartitioned] = useState(false);
  const [integrityState, setIntegrityState] = useState<"verified" | "checking">("verified");
  const [events, setEvents] = useState<LedgerEvent[]>([
    { id: 1, time: "09:42:18", title: "Mesh ready", detail: "3 peers discovered through local relay.", tone: "good" },
    { id: 2, time: "09:42:14", title: "Integrity proof valid", detail: "Incident coordination · e64c0af1", tone: "good" },
    { id: 3, time: "09:42:02", title: "Encrypted channel opened", detail: "Noise IK / XChaCha20-Poly1305", tone: "neutral" },
  ]);

  const activeDevice = devices.find((device) => device.id === selected) ?? devices[1];
  const totalPending = devices.reduce((sum, device) => sum + device.pending, 0);
  const meshStatus = partitioned ? "Partitioned" : totalPending ? "Reconciling" : "Synchronized";
  const titleId = "lm-doc-title";

  const networkHealth = useMemo(() => {
    if (partitioned) return { label: "2 / 3 routes", value: "67%", tone: "warning" };
    return { label: "3 / 3 routes", value: "100%", tone: "verified" };
  }, [partitioned]);

  function addEvent(title: string, detail: string, tone: EventTone = "neutral") {
    setEvents((current) => [
      { id: Date.now() + Math.floor(Math.random() * 100), time: timeNow(), title, detail, tone },
      ...current.slice(0, 7),
    ]);
  }

  function updateDocument(body: string) {
    const editedAt = timeNow();
    setDevices((current) => {
      const source = current.find((device) => device.id === selected)!;
      const nextVector = { ...source.doc.vector, [selected]: source.doc.vector[selected] + 1 };
      const nextHash = createHash(`${body}:${displayVector(nextVector)}`);
      const nextDoc: DocumentState = {
        ...source.doc,
        body,
        vector: nextVector,
        updatedBy: selected,
        hash: nextHash,
      };

      if (!partitioned) {
        return current.map((device) => ({ ...device, doc: nextDoc, pending: 0 }));
      }

      if (selected !== "charlie") {
        return current.map((device) =>
          device.id === "charlie" ? device : { ...device, doc: nextDoc, pending: 0 },
        );
      }

      return current.map((device) =>
        device.id === selected
          ? { ...device, doc: nextDoc, pending: device.pending + 1 }
          : device,
      );
    });
    addEvent(
      `Local edit saved on ${activeDevice.short}`,
      partitioned ? `Queued locally at ${editedAt}; version vector advanced.` : `Replicated to reachable peers at ${editedAt}.`,
      partitioned ? "warn" : "good",
    );
  }

  function applyPartition() {
    if (partitioned) return;
    setPartitioned(true);
    setDevices((current) => current.map((device) => (device.id === "charlie" ? { ...device, online: false } : device)));
    addEvent("Network partition applied", "Device C has lost the relay route. Local writes remain available.", "danger");
  }

  function recoverSync() {
    if (!partitioned && totalPending === 0) {
      addEvent("Mesh already converged", "No outstanding operations require reconciliation.", "good");
      return;
    }
    setIntegrityState("checking");
    setTimeout(() => {
      setDevices((current) => {
        const maxVector = peerIds.reduce(
          (result, id) => ({ ...result, [id]: Math.max(...current.map((device) => device.doc.vector[id])) }),
          { alpha: 0, bravo: 0, charlie: 0 } as Record<DeviceId, number>,
        );
        const mergedBody = mergeBodies(current.map((device) => device.doc.body));
        const mergedVector = { ...maxVector, bravo: maxVector.bravo + 1 };
        const mergedDoc: DocumentState = {
          ...current[1].doc,
          body: mergedBody,
          vector: mergedVector,
          updatedBy: "bravo",
          hash: createHash(`${mergedBody}:${displayVector(mergedVector)}`),
        };
        return current.map((device) => ({ ...device, online: true, pending: 0, doc: mergedDoc }));
      });
      setPartitioned(false);
      setIntegrityState("verified");
      addEvent("CRDT reconciliation complete", "Concurrent lines merged deterministically; all replicas now share one vector.", "good");
    }, 720);
  }

  function createConcurrentEdits() {
    if (!partitioned) applyPartition();
    setTimeout(() => {
      setDevices((current) =>
        current.map((device) => {
          if (device.id !== "bravo" && device.id !== "charlie") return device;
          const line = device.id === "bravo" ? "• Stage medical supplies at relay point" : "• East trail blocked; route response through creek path";
          const vector = { ...device.doc.vector, [device.id]: device.doc.vector[device.id] + 1 };
          const body = device.doc.body.includes(line) ? device.doc.body : `${device.doc.body}\n${line}`;
          return {
            ...device,
            pending: device.pending + 1,
            doc: { ...device.doc, body, vector, updatedBy: device.id, hash: createHash(`${body}:${displayVector(vector)}`) },
          };
        }),
      );
      addEvent("Concurrent edits created", "Device B and Device C now carry divergent operations during the partition.", "warn");
    }, partitioned ? 0 : 40);
  }

  function verifyIntegrity() {
    setIntegrityState("checking");
    addEvent("Verifying replica proofs", "Comparing content hashes and version vectors across reachable devices.", "neutral");
    setTimeout(() => {
      setIntegrityState("verified");
      addEvent("Integrity proof valid", `${partitioned ? "Reachable" : "All"} replicas passed hash verification.`, "good");
    }, 650);
  }

  function resetDemo() {
    setDevices(buildInitialDevices());
    setSelected("bravo");
    setPartitioned(false);
    setIntegrityState("verified");
    setEvents([{ id: Date.now(), time: timeNow(), title: "Simulation reset", detail: "Mesh returned to its converged baseline.", tone: "neutral" }]);
  }

  return (
    <main className="instrument-shell">
      <aside className="command-rail" aria-label="LocalMesh controls">
        <div className="brand-lockup">
          <img src="/manus-storage/localmesh-mark_977608f5.png" alt="" className="brand-mark-image" />
          <div>
            <p className="brand-name">LOCALMESH</p>
            <p className="brand-subtitle">OFFLINE COLLABORATION</p>
          </div>
        </div>

        <div className="rail-section">
          <p className="eyebrow">Simulation</p>
          <nav className="nav-stack" aria-label="Workspace areas">
            <button className="rail-item active"><Network size={17} /> Mesh overview</button>
            <button className="rail-item"><FilePenLine size={17} /> Shared document <span>1</span></button>
            <button className="rail-item"><GitBranch size={17} /> Version vectors</button>
            <button className="rail-item"><ShieldCheck size={17} /> Trust proofs</button>
          </nav>
        </div>

        <div className="rail-section device-list">
          <div className="section-title-row">
            <p className="eyebrow">Peer devices</p>
            <span className="peer-count">{devices.filter((device) => device.online).length}/3</span>
          </div>
          {devices.map((device) => (
            <button
              key={device.id}
              onClick={() => setSelected(device.id)}
              className={`device-picker ${selected === device.id ? "selected" : ""}`}
              aria-pressed={selected === device.id}
            >
              <span className={`device-indicator ${device.online ? "online" : "offline"}`} style={{ "--device-color": device.accent } as React.CSSProperties} />
              <span className="device-picker-copy"><strong>{device.name}</strong><small>{device.location}</small></span>
              {device.pending > 0 && <span className="pending-bubble">{device.pending}</span>}
            </button>
          ))}
        </div>

        <div className="rail-footnote">
          <div className="secure-seal"><LockKeyhole size={14} /> XCHACHA20</div>
          <p>Local-only test mesh<br />Session <code>24f.91c</code></p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>WORKSPACE</span><ChevronRight size={14} /><strong>INCIDENT COORDINATION</strong></div>
          <div className="topbar-statuses">
            <span className={`top-status ${partitioned ? "alert" : ""}`}><span className="signal-dot" />{meshStatus}</span>
            <span className="top-status"><LockKeyhole size={13} /> E2E encrypted</span>
            <button className="compact-icon-button" onClick={resetDemo} title="Reset simulation"><RefreshCw size={15} /></button>
          </div>
        </header>

        <div className="workspace-content">
          <section className="page-intro">
            <div>
              <p className="eyebrow">Live peer-to-peer workspace</p>
              <h1>Write now. <em>Reconcile</em> when the network returns.</h1>
              <p className="intro-copy">A local-first replication simulation with encrypted sessions, version vectors, and automatic CRDT-style convergence.</p>
            </div>
            <div className="intro-utility">
              <div className="health-stamp"><span className="stamp-ring"><Activity size={17} /></span><div><small>ROUTE HEALTH</small><strong>{networkHealth.value}</strong><p>{networkHealth.label} active</p></div></div>
              <button className={`primary-action ${partitioned ? "recover" : ""}`} onClick={partitioned ? recoverSync : applyPartition}>
                {partitioned ? <><RefreshCw size={16} /> Reconnect & sync</> : <><Split size={16} /> Simulate partition</>}
              </button>
            </div>
          </section>

          <div className="operations-grid">
            <section className="topology-card card-surface">
              <div className="card-heading">
                <div><p className="eyebrow">Peer topology</p><h2>Local route map</h2></div>
                <div className="route-legend"><span><i className="legend-line verified" />Verified</span><span><i className="legend-line queued" />Queued</span></div>
              </div>
              <div className="topology-field">
                <img src="/manus-storage/localmesh-topology-field_0a95ad2e.png" alt="Abstract LocalMesh peer topology" className="topology-art" />
                <div className="coordinate-label label-one">07.442N / 11.9E</div>
                <div className="coordinate-label label-two">LOCAL RADIO MESH</div>
                <svg viewBox="0 0 800 320" aria-hidden="true" className="mesh-lines" preserveAspectRatio="none">
                  <path className="mesh-route route-a" d="M120,228 C248,184 317,118 399,114" />
                  <path className={`mesh-route route-b ${partitioned ? "broken" : ""}`} d="M402,118 C515,138 588,226 674,211" />
                  <path className={`mesh-ghost ${partitioned ? "visible" : ""}`} d="M402,118 C515,138 588,226 674,211" />
                </svg>
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelected(device.id)}
                    className={`topology-node node-${device.id} ${selected === device.id ? "selected" : ""} ${device.online ? "" : "disconnected"}`}
                    style={{ "--device-color": device.accent } as React.CSSProperties}
                    aria-label={`Select ${device.name}`}
                  >
                    <span className="node-orbit" /><span className="node-core">{device.short}</span>
                    <span className="node-label"><strong>{device.name}</strong><small>{device.online ? "reachable" : "offline"}</small></span>
                  </button>
                ))}
                {partitioned && <div className="partition-marker"><Unplug size={13} /> ROUTE SEVERED</div>}
              </div>
              <div className="topology-meta">
                <span><Radio size={14} /> mDNS discovery · 3 peers known</span>
                <span><LockKeyhole size={14} /> Noise IK · encrypted transport</span>
                <span><Fingerprint size={14} /> Vector clocks enabled</span>
              </div>
            </section>

            <section className="document-card card-surface">
              <div className="card-heading document-heading">
                <div><p className="eyebrow">Shared artifact</p><h2>Incident coordination</h2></div>
                <span className={`sync-pill ${partitioned && activeDevice.pending > 0 ? "queued" : ""}`}>
                  {partitioned && activeDevice.pending > 0 ? <CloudOff size={13} /> : <CircleCheck size={13} />}
                  {partitioned && activeDevice.pending > 0 ? "queued locally" : "in sync"}
                </span>
              </div>
              <div className="document-controls">
                <div className="editing-device"><span style={{ background: activeDevice.accent }}>{activeDevice.short}</span><div><small>EDITING AS</small><strong>{activeDevice.name}</strong></div></div>
                <button className="ghost-button" onClick={createConcurrentEdits}><UsersRound size={15} /> Create concurrent edits</button>
              </div>
              <label htmlFor={titleId} className="sr-only">Shared document content</label>
              <textarea
                id={titleId}
                value={activeDevice.doc.body}
                onChange={(event) => updateDocument(event.target.value)}
                className="document-editor"
                spellCheck={false}
              />
              <div className="document-footer">
                <div><span className="vector-label">VERSION VECTOR</span><code>{displayVector(activeDevice.doc.vector)}</code></div>
                <div><span className="vector-label">CONTENT HASH</span><code>{activeDevice.doc.hash}</code></div>
                <button className="copy-button" onClick={() => navigator.clipboard?.writeText(activeDevice.doc.body)} title="Copy document"><Copy size={15} /></button>
              </div>
            </section>
          </div>

          <section className="lower-grid">
            <section className="integrity-card card-surface">
              <div className="card-heading compact-heading"><div><p className="eyebrow">Integrity layer</p><h2>Replica trust proof</h2></div><button className="text-action" onClick={verifyIntegrity}>{integrityState === "checking" ? "checking…" : "verify now"}</button></div>
              <div className="proof-body">
                <div className={`proof-emblem ${integrityState === "checking" ? "is-checking" : ""}`}><ShieldCheck size={27} /></div>
                <div><strong>{integrityState === "checking" ? "Verifying content state" : "All reachable replicas agree"}</strong><p>Hash commitments and version vectors agree across the active mesh.</p></div>
                <div className="proof-detail"><span>ALGORITHM</span><code>BLAKE3 / 256</code><span>TRANSPORT</span><code>QUIC + Noise</code></div>
              </div>
            </section>

            <section className="ledger-card card-surface">
              <div className="card-heading compact-heading"><div><p className="eyebrow">Event ledger</p><h2>Mesh activity</h2></div><button className="text-action" onClick={() => setEvents([])}>clear</button></div>
              <div className="ledger-list" aria-live="polite">
                {events.length ? events.map((event) => (
                  <div className="ledger-row" key={event.id}>
                    <span className={`ledger-signal ${event.tone}`} />
                    <time>{event.time}</time>
                    <div><strong>{event.title}</strong><p>{event.detail}</p></div>
                  </div>
                )) : <div className="ledger-empty"><Terminal size={18} /> Event ledger cleared</div>}
              </div>
            </section>
          </section>
        </div>
      </section>

      <aside className="inspector-panel" aria-label="Selected device details">
        <div className="inspector-top"><p className="eyebrow">Selected peer</p><button className="compact-icon-button"><X size={15} /></button></div>
        <div className="selected-device-hero">
          <div className="large-device-token" style={{ "--device-color": activeDevice.accent } as React.CSSProperties}>{activeDevice.short}</div>
          <div><h2>{activeDevice.name}</h2><p>{activeDevice.role}</p></div>
        </div>
        <div className="reachability-row"><span className={activeDevice.online ? "online" : "offline"}><i />{activeDevice.online ? "Reachable now" : "Temporarily offline"}</span><code>{activeDevice.ip}</code></div>
        <div className="inspector-image-wrap"><img src="/manus-storage/localmesh-resilience-object_2675903a.png" alt="Abstract relay topology object" /></div>
        <div className="detail-stack">
          <div className="detail-row"><span><Wifi size={15} />Discovery</span><strong>{activeDevice.online ? "mDNS announced" : "last seen 02m"}</strong></div>
          <div className="detail-row"><span><ArrowDownToLine size={15} />Outbox</span><strong>{activeDevice.pending ? `${activeDevice.pending} queued op${activeDevice.pending > 1 ? "s" : ""}` : "clear"}</strong></div>
          <div className="detail-row"><span><LockKeyhole size={15} />Session</span><strong>verified</strong></div>
        </div>
        <div className="partition-callout">
          {partitioned ? <TriangleAlert size={17} /> : <Link2 size={17} />}
          <div><strong>{partitioned ? "Partition-aware mode" : "Peer route healthy"}</strong><p>{partitioned ? "Changes are durable here and will merge when the relay returns." : "This peer is receiving operations through the encrypted mesh."}</p></div>
        </div>
        <div className="model-note"><span>SIMULATOR MODEL</span><p>Line-union merge is used as a readable stand-in for a production CRDT. The controls make convergence behavior inspectable in-browser.</p></div>
      </aside>
    </main>
  );
}
