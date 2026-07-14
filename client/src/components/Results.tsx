import { leaveRoom, playAgain, rateHider } from '../socket/socketClient';
import { useGameStore } from '../store/gameStore';

export default function Results(): JSX.Element | null {
  const roomState = useGameStore((state) => state.roomState);
  const setRoomState = useGameStore((state) => state.setRoomState);
  const playerId = useGameStore((state) => state.playerId);
  const hiderRating = useGameStore((state) => state.hiderRating);
  const setHiderRating = useGameStore((state) => state.setHiderRating);

  if (!roomState) {
    return null;
  }

  const me = roomState.players.find((player) => player.id === playerId);
  const hiddenNames = roomState.hiddenObjectIds.map(
    (id) => roomState.objects.find((object) => object.id === id)?.name ?? id,
  );
  const hider = roomState.players.find((player) => player.isHider);

  const scores = roomState.players.map((player) => ({
    name: player.name,
    correctGuesses: (roomState.individualVotes[player.id] ?? []).filter((vote) => roomState.hiddenObjectIds.includes(vote)).length,
  }));

  return (
    <div className="pointer-events-auto absolute left-1/2 top-1/2 w-[min(720px,calc(100%-340px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-black/50 backdrop-blur">
      <div className="text-center">
        <div className="text-5xl">{roomState.seekerWin ? '🎉' : '🕵️‍♂️'}</div>
        <h2 className="mt-3 text-3xl font-black text-white">{roomState.seekerWin ? 'Seekers Win!' : 'The Hider Escaped!'}</h2>
        <p className="mt-2 text-slate-300">
          {hider ? `${hider.name} was the hider this round.` : 'Round complete.'}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-lg font-bold text-amber-300">The Hider hid:</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {hiddenNames.map((name) => (
              <span key={name} className="rounded-full bg-amber-500/15 px-3 py-1 text-sm text-amber-100">
                {name}
              </span>
            ))}
          </div>

          {hider && me && !me.isHider && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Rate the hider</h4>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => {
                      setHiderRating(rating);
                      rateHider(roomState.code, rating);
                    }}
                    className={`rounded-xl px-3 py-2 text-xl transition ${
                      (hiderRating ?? 0) >= rating ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-lg font-bold text-cyan-300">Scoreboard</h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Correct guesses</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((row) => (
                  <tr key={row.name} className="border-t border-white/5 text-slate-200">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.correctGuesses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {me?.isHost && (
            <button
              type="button"
              onClick={() => playAgain(roomState.code)}
              className="mt-5 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Play Again
            </button>
          )}
          <button
            type="button"
            onClick={() => { leaveRoom(); setRoomState(null); }}
            className="mt-3 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-400 transition hover:border-red-400 hover:text-red-400"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
