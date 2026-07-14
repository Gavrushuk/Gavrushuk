export default function Lighting(): JSX.Element {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        castShadow
        intensity={1}
        position={[5, 10, 5]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 3, 0]} intensity={1.2} color="#ffd7a8" />
    </>
  );
}
