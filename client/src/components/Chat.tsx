import { useEffect, useMemo, useRef, useState } from 'react';
import { sendChat } from '../socket/socketClient';
import { useGameStore } from '../store/gameStore';

export default function Chat(): JSX.Element | null {
  const roomState = useGameStore((state) => state.roomState);
  const chatMessages = useGameStore((state) => state.chatMessages);
  const hiderAzimuth = useGameStore((state) => state.hiderAzimuth);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const mentionRows = useMemo(
    () =>
      (roomState?.objects ?? [])
        .filter((object) => (object.mentionCount ?? 0) > 0)
        .sort((left, right) => (right.mentionCount ?? 0) - (left.mentionCount ?? 0)),
    [roomState?.objects],
  );

  if (!roomState) {
    return null;
  }

  const handleSend = (): void => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    sendChat(roomState.code, trimmed);
    setText('');
  };

  return (
    <aside className="pointer-events-auto absolute right-0 top-0 flex h-full w-[280px] flex-col border-l border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Team Chat</h2>
          {roomState.phase === 'SEARCHING' && hiderAzimuth !== null && (
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-300">
              <span>Ghost Cam</span>
              <div className="relative h-8 w-8 rounded-full border border-cyan-400/40">
                <div
                  className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-full rounded-full bg-cyan-300"
                  style={{ transform: `translate(-50%, -100%) rotate(${(hiderAzimuth * 180) / Math.PI}deg)`, transformOrigin: 'bottom center' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {chatMessages.map((message) => (
          <div key={message.id} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-semibold text-cyan-300">{message.playerName}</span>
              <span className="text-[11px] text-slate-500">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="text-sm text-slate-200">{message.text}</div>
            {message.taggedObjectId && (
              <div className="mt-2 inline-flex rounded-full bg-fuchsia-500/15 px-2 py-1 text-xs font-medium text-fuchsia-200">
                #{roomState.objects.find((object) => object.id === message.taggedObjectId)?.name ?? message.taggedObjectId}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <details className="border-t border-white/10 px-4 py-3 text-sm text-slate-300">
        <summary className="cursor-pointer font-semibold text-slate-200">Object mention tally</summary>
        <div className="mt-3 space-y-2">
          {mentionRows.length === 0 && <div className="text-slate-500">No object tags yet.</div>}
          {mentionRows.map((object) => (
            <div key={object.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
              <span>{object.name}</span>
              <span className="font-semibold text-cyan-300">{object.mentionCount}</span>
            </div>
          ))}
        </div>
      </details>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSend();
              }
            }}
            placeholder="Share a clue..."
            className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={handleSend}
            className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
}
