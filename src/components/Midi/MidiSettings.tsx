import { useMidiStore } from '../../stores/midiStore';
import { startMidi } from '../../midi/engine';
import { describeTarget, describeTrigger } from '../../midi/mapping';

/** MIDI section of the Settings modal: device picker, live monitor, mapping list. */
export function MidiSettings() {
  const {
    status,
    devices,
    selectedInputId,
    setSelectedInputId,
    monitor,
    clearMonitor,
    mappings,
    removeMapping,
    clearMappings,
    loadDefaultPads,
    lastFiredMappingId,
  } = useMidiStore();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">🎛 MIDI</h3>

      {status === 'unsupported' && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm">
          ⚠️ This browser doesn't support Web MIDI. Use Chrome or Edge on desktop.
        </div>
      )}
      {status === 'denied' && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between gap-2">
          <span>MIDI access was blocked.</span>
          <button
            type="button"
            onClick={() => startMidi()}
            className="px-3 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Device picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)] w-14">Input</span>
        <select
          value={selectedInputId}
          onChange={(e) => setSelectedInputId(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm border border-[var(--border-color)]"
        >
          <option value="all">All connected devices ({devices.length})</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.manufacturer ? ` — ${d.manufacturer}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Monitor */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--text-muted)]">Monitor — move a control to see it here</span>
          {monitor.length > 0 && (
            <button type="button" onClick={clearMonitor} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              clear
            </button>
          )}
        </div>
        <div className="h-28 overflow-y-auto rounded-lg bg-black/40 border border-[var(--border-color)] p-2 font-mono text-[11px] text-green-300/90 space-y-0.5">
          {monitor.length === 0 ? (
            <div className="text-[var(--text-muted)]">Waiting for MIDI…</div>
          ) : (
            monitor.map((m) => (
              <div key={m.id} className="truncate">
                {m.text} <span className="text-[var(--text-muted)]">· {m.deviceName}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mappings */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--text-muted)]">Mappings ({mappings.length})</span>
          <div className="flex gap-2">
            <button type="button" onClick={loadDefaultPads} className="text-xs text-[var(--accent-primary)] hover:underline">
              load default pads
            </button>
            {mappings.length > 0 && (
              <button type="button" onClick={clearMappings} className="text-xs text-red-400 hover:underline">
                clear all
              </button>
            )}
          </div>
        </div>
        <div className="max-h-36 overflow-y-auto rounded-lg bg-[var(--bg-tertiary)] divide-y divide-[var(--border-color)]">
          {mappings.length === 0 ? (
            <div className="p-2 text-xs text-[var(--text-muted)]">None yet — turn on MIDI Learn to add some.</div>
          ) : (
            mappings.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-2 px-2 py-1 text-xs transition-colors ${
                  lastFiredMappingId === m.id ? 'bg-[var(--accent-primary)]/30' : ''
                }`}
              >
                <span className="font-mono w-24 text-[var(--text-secondary)]">{describeTrigger(m.trigger)}</span>
                <span className="flex-1 text-[var(--text-primary)] truncate">→ {describeTarget(m.target)}</span>
                <button
                  type="button"
                  onClick={() => removeMapping(m.id)}
                  className="text-[var(--text-muted)] hover:text-red-400"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          Default pads use notes 36–51 on any channel — the usual 16-pad layout.
        </p>
      </div>
    </div>
  );
}
