import { hideObjects } from '../socket/socketClient';
import { useGameStore } from '../store/gameStore';

const formatTime = (value: number): string => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const phaseLabel = (phase: string): string => phase.replace(/_/g, ' ');

export default function HUD(): JSX.Element | null {
  const roomState = useGameStore((state) => state.roomState);
  const playerId = useGameStore((state) => state.playerId);
  const selectedObjectIds = useGameStore((state) => state.selectedObjectIds);

  if (!roomState) {
    return null;
  }

  const me = roomState.players.find((player) => player.id === playerId);
  if (!me) {
    return null;
  }

  const canConfirmHidden = roomState.phase === 'HIDING' && me.isHider && selectedObjectIds.length === 5;

  return (
    <div className="pointer-events-none absolute left-4 top-4 flex max-w-sm flex-col gap-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            {phaseLabel(roomState.phase)}
          </span>
          <span className={`text-3xl font-black ${roomState.timeRemaining < 30 ? 'text-rose-400' : 'text-white'}`}>
            {formatTime(roomState.timeRemaining)}
          </span>
        </div>
        <div className="mt-3 text-sm text-slate-300">Players in room: {roomState.players.length}</div>
        {roomState.phase === 'SEARCHING' && roomState.halfwayRevealed && roomState.halfwayCount !== null && (
          <div className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Mid-game clue: {roomState.halfwayCount} hidden objects have already been mentioned.
          </div>
        )}
      </div>

      {roomState.phase === 'HIDING' && (
        <div className="pointer-events-auto rounded-2xl border border-orange-400/20 bg-slate-900/80 px-4 py-4 shadow-lg shadow-black/30 backdrop-blur">
          <div className="text-lg font-bold text-orange-300">Click 5 objects to hide them</div>
          <div className="mt-1 text-sm text-slate-300">Selected: {selectedObjectIds.length}/5</div>
          {canConfirmHidden && (
            <button
              type="button"
              onClick={() => hideObjects(roomState.code, selectedObjectIds)}
              className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-orange-400"
            >
              Confirm Hidden Objects
            </button>
          )}
        </div>
      )}

      {roomState.phase === 'SEARCHING' && me.isHider && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
          HIDER — stay silent and keep them guessing.
        </div>
      )}
    </div>
  );
}
