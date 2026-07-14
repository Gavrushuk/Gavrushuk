export default function Room(): JSX.Element {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#7a5c3e" />
      </mesh>

      <mesh receiveShadow position={[0, 1.5, -3]}>
        <boxGeometry args={[10, 3, 0.15]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh receiveShadow position={[-5, 1.5, 0]}>
        <boxGeometry args={[0.15, 3, 6]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh receiveShadow position={[5, 1.5, 0]}>
        <boxGeometry args={[0.15, 3, 6]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh receiveShadow position={[0, 3.02, 0]}>
        <boxGeometry args={[10, 0.08, 6]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
