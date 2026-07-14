import { submitCollectiveVote, submitVote } from '../socket/socketClient';
import { useGameStore } from '../store/gameStore';

export default function VotePanel(): JSX.Element | null {
  const roomState = useGameStore((state) => state.roomState);
  const playerId = useGameStore((state) => state.playerId);
  const selectedObjectIds = useGameStore((state) => state.selectedObjectIds);
  const setMyVote = useGameStore((state) => state.setMyVote);
  const myVote = useGameStore((state) => state.myVote);
  const toggleSelectedObject = useGameStore((state) => state.toggleSelectedObject);
  const clearSelection = useGameStore((state) => state.clearSelection);

  if (!roomState) {
    return null;
  }

  const me = roomState.players.find((player) => player.id === playerId);
  if (!me) {
    return null;
  }

  const selectedNames = selectedObjectIds.map(
    (id) => roomState.objects.find((object) => object.id === id)?.name ?? id,
  );

  const submitIndividual = (): void => {
    submitVote(roomState.code, selectedObjectIds);
    setMyVote(selectedObjectIds);
    clearSelection();
  };

  const submitCollective = (): void => {
    submitCollectiveVote(roomState.code, selectedObjectIds);
    clearSelection();
  };

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(680px,calc(100%-320px))] -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/85 p-5 shadow-2xl shadow-black/40 backdrop-blur">
      {roomState.phase === 'INDIVIDUAL_VOTE' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">Select 5 objects you think were hidden</h3>
              <p className="text-sm text-slate-300">Click the 3D room objects to build your vote.</p>
            </div>
            <div className="rounded-full bg-fuchsia-500/15 px-3 py-1 text-sm font-semibold text-fuchsia-200">
              {selectedObjectIds.length}/5 selected
            </div>
          </div>
          {me.isHider ? (
            <div className="mt-4 text-sm text-slate-400">You are the hider — seekers are locking in their guesses.</div>
          ) : myVote ? (
            <div className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Vote submitted. Waiting for the other seekers.</div>
          ) : (
            <>
              <div className="mt-4 flex min-h-[52px] flex-wrap gap-2 rounded-xl border border-white/10 bg-slate-950/50 p-3">
                {selectedNames.length === 0 ? (
                  <span className="text-sm text-slate-500">No objects selected yet.</span>
                ) : (
                  selectedNames.map((name) => (
                    <span key={name} className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-200">
                      {name}
                    </span>
                  ))
                )}
              </div>
              <button
                type="button"
                disabled={selectedObjectIds.length !== 5}
                onClick={submitIndividual}
                className="mt-4 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Submit Vote
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">Collective Final Vote</h3>
              <p className="text-sm text-slate-300">Choose the final 5 from the room&apos;s most nominated objects.</p>
            </div>
            <div className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-200">
              {selectedObjectIds.length}/5 final picks
            </div>
          </div>
          {me.isHider ? (
            <div className="mt-4 text-sm text-slate-400">Spectate while the seekers agree on the final set.</div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {roomState.collectiveNominations.map((objectId) => {
                  const object = roomState.objects.find((entry) => entry.id === objectId);
                  const selected = selectedObjectIds.includes(objectId);
                  return (
                    <button
                      key={objectId}
                      type="button"
                      onClick={() => toggleSelectedObject(objectId)}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                        selected
                          ? 'bg-cyan-500 text-slate-950'
                          : 'border border-white/10 bg-slate-950/60 text-slate-200 hover:border-cyan-400'
                      }`}
                    >
                      {object?.name ?? objectId}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={selectedObjectIds.length !== 5}
                onClick={submitCollective}
                className="mt-4 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Submit Final Vote
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
