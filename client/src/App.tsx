import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Lobby, { LobbyRoom } from './components/Lobby';
import HUD from './components/HUD';
import Chat from './components/Chat';
import VotePanel from './components/VotePanel';
import Results from './components/Results';
import Scene from './r3f/Scene';
import { initSocketListeners } from './socket/socketClient';
import { useGameStore } from './store/gameStore';

const Game = (): JSX.Element => {
  const roomState = useGameStore((state) => state.roomState);
  const clearSelection = useGameStore((state) => state.clearSelection);
  const setMyVote = useGameStore((state) => state.setMyVote);

  useEffect(() => {
    clearSelection();
    setMyVote(null);
  }, [roomState?.phase, clearSelection, setMyVote]);

  return (
    <div className="relative h-screen w-screen bg-slate-950">
      <Canvas shadows camera={{ position: [0, 5, 8], fov: 60 }}>
        <Scene />
      </Canvas>
      <div className="pointer-events-none absolute inset-0">
        <HUD />
        <Chat />
        {(roomState?.phase === 'INDIVIDUAL_VOTE' || roomState?.phase === 'COLLECTIVE_VOTE') && <VotePanel />}
        {roomState?.phase === 'RESULTS' && <Results />}
      </div>
    </div>
  );
};

export default function App(): JSX.Element {
  const roomState = useGameStore((state) => state.roomState);

  useEffect(() => {
    initSocketListeners(useGameStore);
  }, []);

  if (!roomState) {
    return <Lobby />;
  }

  if (roomState.phase === 'LOBBY') {
    return <LobbyRoom />;
  }

  return <Game />;
}
