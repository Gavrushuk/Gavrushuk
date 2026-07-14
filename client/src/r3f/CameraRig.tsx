import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { sendCamera } from '../socket/socketClient';
import { useGameStore } from '../store/gameStore';

const overviewPosition = new Vector3(0, 5, 8);
const overviewTarget = new Vector3(0, 1, 0);

export default function CameraRig(): null {
  const { camera, clock } = useThree();
  const roomState = useGameStore((state) => state.roomState);
  const playerId = useGameStore((state) => state.playerId);
  const desiredPosition = useRef(overviewPosition.clone());
  const lookAtTarget = useRef(overviewTarget.clone());
  const currentTarget = useRef(overviewTarget.clone());
  const resultStartedAt = useRef(0);
  const lastCameraEmitAt = useRef(0);

  const me = useMemo(
    () => roomState?.players.find((player) => player.id === playerId) ?? null,
    [playerId, roomState],
  );

  useEffect(() => {
    if (roomState?.phase === 'RESULTS') {
      resultStartedAt.current = clock.elapsedTime;
    }
  }, [clock.elapsedTime, roomState?.phase]);

  useFrame((_, delta) => {
    if (!roomState) {
      return;
    }

    if (roomState.phase === 'RESULTS' && roomState.hiddenObjectIds.length > 0) {
      const elapsed = Math.max(0, clock.elapsedTime - resultStartedAt.current);
      const index = Math.floor(elapsed / 3) % roomState.hiddenObjectIds.length;
      const targetObject = roomState.objects.find((object) => object.id === roomState.hiddenObjectIds[index]);
      if (targetObject) {
        lookAtTarget.current.set(...targetObject.position);
        desiredPosition.current.set(targetObject.position[0] + 2.4, targetObject.position[1] + 2, targetObject.position[2] + 2.6);
      }
    } else {
      desiredPosition.current.copy(overviewPosition);
      lookAtTarget.current.copy(overviewTarget);
    }

    const smoothing = 1 - Math.exp(-delta * 2.5);
    camera.position.lerp(desiredPosition.current, smoothing);
    currentTarget.current.lerp(lookAtTarget.current, smoothing);
    camera.lookAt(currentTarget.current);

    if (roomState.phase === 'SEARCHING' && me?.isHider && clock.elapsedTime - lastCameraEmitAt.current > 2) {
      lastCameraEmitAt.current = clock.elapsedTime;
      const azimuth = Math.atan2(camera.position.x, camera.position.z);
      sendCamera(roomState.code, azimuth);
    }
  });

  return null;
}
