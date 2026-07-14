import { useMemo, useState } from 'react';
import { createRoom, joinRoom, leaveRoom, startGame, toggleReady } from '../socket/socketClient';
import { useGameStore } from '../store/gameStore';

const panelClass = 'rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/30 backdrop-blur';

export default function Lobby(): JSX.Element {
  const playerName = useGameStore((state) => state.playerName);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const [joinCode, setJoinCode] = useState('');

  const canSubmit = playerName.trim().length >= 2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_60%)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className={`${panelClass} flex flex-col justify-between gap-8`}>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Browser Multiplayer</p>
            <h1 className="text-5xl font-black text-white sm:text-6xl">Hidden Objects 3D</h1>
            <p className="max-w-xl text-lg text-slate-300">
              One player hides five objects in a 3D room while everyone else investigates, chats, and votes in real time.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-slate-200">
              <div className="mb-2 font-semibold text-cyan-300">1. Enter the room</div>
              Create a room or join with a 6-character code.
            </div>
            <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4 text-sm text-slate-200">
              <div className="mb-2 font-semibold text-fuchsia-300">2. Find the hider</div>
              Use the camera ghost, chat tags, and final vote to spot the hidden set.
            </div>
          </div>
        </div>

        <div className={`${panelClass} space-y-5`}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Player name</label>
            <input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="MysteryHunter"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => createRoom(playerName.trim())}
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Create Room
          </button>

          <div className="relative flex items-center justify-center py-1 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span className="px-3">or</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-white/10" />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Join room</label>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 uppercase text-white outline-none transition focus:border-fuchsia-400"
            />
            <button
              type="button"
              disabled={!canSubmit || joinCode.trim().length < 6}
              onClick={() => joinRoom(joinCode.trim(), playerName.trim())}
              className="w-full rounded-xl bg-fuchsia-500 px-4 py-3 font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LobbyRoom(): JSX.Element {
  const roomState = useGameStore((state) => state.roomState);
  const setRoomState = useGameStore((state) => state.setRoomState);
  const playerId = useGameStore((state) => state.playerId);
  const [copied, setCopied] = useState(false);

  const me = useMemo(() => roomState?.players.find((player) => player.id === playerId) ?? null, [playerId, roomState]);
  const readyCount = roomState?.players.filter((player) => player.isReady).length ?? 0;
  const canStart = Boolean(me?.isHost && readyCount >= 2 && (roomState?.players.length ?? 0) >= 2);

  if (!roomState || !me) {
    return <Lobby />;
  }

  const copyCode = async (): Promise<void> => {
    await navigator.clipboard.writeText(roomState.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const handleLeave = (): void => {
    leaveRoom();
    setRoomState(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#0f172a,_#020617_70%)] px-4 py-10">
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={`${panelClass} space-y-6`}>
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-cyan-300">Room code</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-xl bg-slate-950/70 px-4 py-3 text-3xl font-black tracking-[0.35em] text-white">
                {roomState.code}
              </div>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
            {roomState.players.length < 2 ? 'Waiting for players...' : `${readyCount} ready • minimum 2 ready players needed`}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => toggleReady(roomState.code)}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              {me.isReady ? 'Not Ready' : "I'm Ready"}
            </button>
            {me.isHost && (
              <button
                type="button"
                disabled={!canStart}
                onClick={() => startGame(roomState.code)}
                className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Start Game
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleLeave}
            className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-400 transition hover:border-red-400 hover:text-red-400"
          >
            Leave Room
          </button>
        </div>

        <div className={`${panelClass}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Players</h2>
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
              {roomState.players.length}/10
            </span>
          </div>
          <div className="space-y-3">
            {roomState.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 font-bold text-cyan-300">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{player.name}</div>
                    <div className="text-xs text-slate-400">Score: {player.score}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {player.isHost && <span className="rounded-full bg-amber-500/20 px-2 py-1 font-semibold text-amber-300">HOST</span>}
                  <span className={player.isReady ? 'text-emerald-400' : 'text-slate-500'}>{player.isReady ? '✓ Ready' : 'Not ready'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
