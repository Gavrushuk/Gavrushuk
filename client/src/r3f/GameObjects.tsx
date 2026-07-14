import { Html, Outlines } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import type { ObjectItem3D } from '@shared/types';
import { sendChat } from '../socket/socketClient';
import { useGameStore } from '../store/gameStore';

const PHASES_WITH_TAGGING = new Set(['SEARCHING', 'INDIVIDUAL_VOTE', 'COLLECTIVE_VOTE']);

function ObjectMesh({ item }: { item: ObjectItem3D }): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const roomState = useGameStore((state) => state.roomState);
  const playerId = useGameStore((state) => state.playerId);
  const hoveredObjectId = useGameStore((state) => state.hoveredObjectId);
  const setHoveredObject = useGameStore((state) => state.setHoveredObject);
  const selectedObjectIds = useGameStore((state) => state.selectedObjectIds);
  const toggleSelectedObject = useGameStore((state) => state.toggleSelectedObject);
  const me = roomState?.players.find((player) => player.id === playerId) ?? null;
  const hovered = hoveredObjectId === item.id;
  const selected = selectedObjectIds.includes(item.id);
  const isHiddenForHider = Boolean(
    roomState && me?.isHider && roomState.phase === 'SEARCHING' && roomState.hiddenObjectIds.includes(item.id),
  );
  const isRevealed = Boolean(roomState?.phase === 'RESULTS' && roomState.hiddenObjectIds.includes(item.id));

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
    const bounce = 1 + Math.abs(Math.sin(state.clock.elapsedTime * 3)) * 0.15;
    const [sx, sy, sz] = item.scale ?? [0.5, 0.5, 0.5];
    const factor = isRevealed ? bounce : selected || isHiddenForHider ? pulse : hovered ? 1.05 : 1;
    meshRef.current.scale.set(sx * factor, sy * factor, sz * factor);
  });

  if (!roomState) {
    return <></>;
  }

  const handleClick = (): void => {
    if (!me) {
      return;
    }

    if (roomState.phase === 'HIDING' && me.isHider) {
      toggleSelectedObject(item.id);
      return;
    }

    if (PHASES_WITH_TAGGING.has(roomState.phase)) {
      if (roomState.phase !== 'SEARCHING' && !me.isHider) {
        toggleSelectedObject(item.id);
      }
      sendChat(roomState.code, `Tagged ${item.name}`, item.id);
    }
  };

  const materialColor = isRevealed
    ? '#facc15'
    : isHiddenForHider
      ? '#60a5fa'
      : hovered || selected
        ? '#fb923c'
        : item.color;
  const emissive = isRevealed ? '#ca8a04' : isHiddenForHider ? '#1d4ed8' : hovered || selected ? '#9a3412' : '#000000';

  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      position={item.position}
      rotation={item.rotation ?? [0, 0, 0]}
      onClick={handleClick}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHoveredObject(item.id);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHoveredObject(null);
      }}
    >
      {item.shape === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {item.shape === 'sphere' && <sphereGeometry args={[0.5, 32, 32]} />}
      {item.shape === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 24]} />}
      {item.shape === 'cone' && <coneGeometry args={[0.5, 1, 24]} />}
      <meshStandardMaterial color={materialColor} emissive={emissive} emissiveIntensity={hovered || selected || isHiddenForHider || isRevealed ? 0.6 : 0.1} />
      {(selected || isHiddenForHider || isRevealed) && <Outlines thickness={4} color={selected ? '#f97316' : isHiddenForHider ? '#60a5fa' : '#fde047'} />}
      {hovered && (
        <Html center position={[0, 0.85, 0]} distanceFactor={8}>
          <div className="rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            {item.name}
          </div>
        </Html>
      )}
    </mesh>
  );
}

export default function GameObjects(): JSX.Element {
  const roomState = useGameStore((state) => state.roomState);

  return (
    <group>
      {(roomState?.objects ?? []).map((item) => (
        <ObjectMesh key={item.id} item={item} />
      ))}
    </group>
  );
}
