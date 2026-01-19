import React, { useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function SpinningCube() {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.x += delta * 0.7;
    mesh.rotation.y += delta * 1.0;
  });

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ff4d4f"),
        metalness: 0.3,
        roughness: 0.4,
      }),
    [],
  );

  return (
    <mesh ref={meshRef} material={material}>
      <boxGeometry args={[1.4, 1.4, 1.4]} />
    </mesh>
  );
}

interface BoxProps {
  width?: number | string;
  height?: number | string;
}

export default function Box({ width = 360, height = 360 }: BoxProps) {
  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 2, 2]} intensity={1.2} />
        <SpinningCube />
      </Canvas>
    </div>
  );
}

