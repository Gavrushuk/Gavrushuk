import { OrbitControls } from '@react-three/drei';
import Lighting from './Lighting';
import Room from './Room';
import GameObjects from './GameObjects';
import CameraRig from './CameraRig';

export default function Scene(): JSX.Element {
  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 8, 18]} />
      <Lighting />
      <Room />
      <GameObjects />
      <CameraRig />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={15} maxPolarAngle={Math.PI / 2.2} />
    </>
  );
}
