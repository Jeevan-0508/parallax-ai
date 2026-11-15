"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Html, OrbitControls, Stars, useProgress } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { EVENTS, type Sector, type SimulationState } from "@parallax/simulation";

type Quality = "cinematic" | "balanced" | "mobile";

const sectorColors: Record<string, string> = { energy: "#ff5668", healthcare: "#ffb454", logistics: "#ffb454", finance: "#b4a0ff", communications: "#48e4ff", trust: "#55e5b0" };
const regionMap = [
  { name: "NORTH ATLANTIC", lat: 42, lon: -38 }, { name: "NORTH AMERICA", lat: 35, lon: -102 },
  { name: "SOUTH AMERICA", lat: -18, lon: -58 }, { name: "EUROPE", lat: 51, lon: 12 },
  { name: "WEST AFRICA", lat: 9, lon: -7 }, { name: "SOUTH ASIA", lat: 22, lon: 78 },
  { name: "EAST ASIA", lat: 35, lon: 122 }, { name: "PACIFIC ARC", lat: -2, lon: 152 }
];

const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const earthFragmentShader = `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform vec3 uSunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 normal = normalize(vWorldNormal);
    float sunlight = dot(normal, normalize(uSunDirection));
    float dayMix = smoothstep(-0.32, 0.08, sunlight);
    vec3 dayColor = pow(texture2D(uDay, vUv).rgb, vec3(0.78)) * 1.55;
    vec3 nightColor = pow(texture2D(uNight, vUv).rgb, vec3(0.82)) * vec3(1.55, 0.82, 0.32);
    vec3 color = mix(nightColor * 0.62, dayColor, dayMix);
    float rim = pow(1.0 - max(dot(normal, normalize(cameraPosition - vWorldPosition)), 0.0), 3.0);
    color += vec3(0.05, 0.28, 0.52) * rim * 0.34;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function point(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.cos(theta));
}

function CloudLayer({ reducedMotion, density }: { reducedMotion: boolean; density: number }) {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const values: number[] = [];
    for (let lat = -64; lat <= 64; lat += 7) for (let lon = -180; lon < 180; lon += 7) {
      const wave = Math.sin(lat * 0.19 + lon * 0.071) + Math.sin(lon * 0.13 - lat * 0.11);
      if (wave > 0.55 && values.length / 3 < density) {
        const p = point(lat + Math.sin(lon) * 2.5, lon + Math.cos(lat) * 2.5, 1.552);
        values.push(p.x, p.y, p.z);
      }
    }
    return new Float32Array(values);
  }, [density]);
  useFrame((_, delta) => { if (group.current && !reducedMotion) group.current.rotation.y += delta * 0.006; });
  return <group ref={group}><points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} /></bufferGeometry><pointsMaterial color="#d8f5ff" size={0.026} transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation /></points></group>;
}

function CameraFocus({ focus, controlsRef }: { focus: React.MutableRefObject<THREE.Vector3>; controlsRef: React.MutableRefObject<any> }) {
  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || focus.current.lengthSq() < 0.001) return;
    const nextTarget = focus.current.clone().normalize().multiplyScalar(0.32);
    controls.target.lerp(nextTarget, 1 - Math.pow(0.001, delta));
    controls.update();
  });
  return null;
}

function Earth({ state, reducedMotion, quality, filter, onSelectRegion }: { state: SimulationState; reducedMotion: boolean; quality: Quality; filter: Sector | "all"; onSelectRegion: (name: string, position: THREE.Vector3) => void }) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dayTexture, nightTexture] = useLoader(THREE.TextureLoader, ["/textures/earth-day.jpg", "/textures/earth-night.jpg"]);
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  const shaderUniforms = useMemo(() => ({ uDay: { value: dayTexture }, uNight: { value: nightTexture }, uSunDirection: { value: new THREE.Vector3(0.02, 0.12, 1) } }), [dayTexture, nightTexture]);
  useFrame((_, delta) => { if (group.current && !reducedMotion) group.current.rotation.y += delta * 0.018; });
  const incidents = useMemo(() => state.eventLog.slice(-12).map((event, index) => ({ ...event, sector: (EVENTS.find(candidate => candidate.id === event.eventId)?.sector ?? "trust") as Sector, region: regionMap[(event.day + index * 3) % regionMap.length] })).filter(event => filter === "all" || event.sector === filter), [state.eventLog, filter]);
  const cityPoints = useMemo(() => Array.from({ length: quality === "cinematic" ? 260 : quality === "balanced" ? 150 : 80 }, (_, index) => { const lat = -58 + ((index * 37) % 116); const lon = -180 + ((index * 71) % 360); return point(lat, lon, 1.526); }), [quality]);
  return <group ref={group} rotation={[0, 3.0, 0]}>
    <mesh onClick={() => onSelectRegion("GLOBAL FIELD", new THREE.Vector3(0, 0, 0))}><sphereGeometry args={[1.5, 96, 64]} /><shaderMaterial uniforms={shaderUniforms} vertexShader={earthVertexShader} fragmentShader={earthFragmentShader} /></mesh>
    <CloudLayer reducedMotion={reducedMotion} density={quality === "cinematic" ? 420 : quality === "balanced" ? 260 : 130} />
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array(cityPoints.flatMap(p => [p.x, p.y, p.z])), 3]} count={cityPoints.length} /></bufferGeometry><pointsMaterial color="#ffd88a" size={quality === "mobile" ? 0.012 : 0.016} transparent opacity={0.64} sizeAttenuation blending={THREE.AdditiveBlending} /></points>
    <mesh scale={1.045}><sphereGeometry args={[1.5, 48, 32]} /><meshBasicMaterial color="#45cfff" transparent opacity={0.085} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>
    {incidents.map((event, index) => { const position = point(event.region.lat, event.region.lon, 1.59); const color = sectorColors[event.sector] ?? "#48e4ff"; return <group key={event.hash} position={position} onClick={e => { e.stopPropagation(); onSelectRegion(event.region.name, position); }} onPointerOver={e => { e.stopPropagation(); setHovered(event.hash); }} onPointerOut={() => setHovered(null)}><mesh><sphereGeometry args={[0.045 + event.severity * 0.012, 16, 16]} /><meshBasicMaterial color={color} /></mesh><mesh scale={1.8 + index * 0.08}><sphereGeometry args={[0.05, 16, 16]} /><meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} /></mesh>{hovered === event.hash && <Html distanceFactor={7}><div className="three-marker-label"><b>{event.title}</b><span>DAY {event.day} · {event.sector.toUpperCase()}</span></div></Html>}</group>; })}
  </group>;
}

function TextureLoadStatus() {
  const { active, progress, errors } = useProgress();
  if (!active && progress >= 100 && errors.length === 0) return null;
  return <div className="texture-loading" role="status" aria-live="polite"><strong>{errors.length ? "PLANETARY TEXTURE ERROR" : "INITIALIZING PLANETARY FIELD"}</strong><span>{errors.length ? "Retry to restore the Earth theater." : `${Math.round(progress)}% · loading day/night surface assets`}</span></div>;
}

class ViewportErrorBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() { if (this.state.error) return <div className="webgl-fallback error-fallback"><div className="fallback-orb" /><strong>2D FIELD FALLBACK</strong><span>3D rendering failed · simulation remains playable</span><button onClick={this.props.onRetry}>RETRY PLANETARY VIEW</button></div>; return this.props.children; }
}

export function PlanetaryViewport({ state, compact = false }: { state: SimulationState; compact?: boolean }) {
  const [webglAvailable, setWebglAvailable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [region, setRegion] = useState("GLOBAL FIELD");
  const [filter, setFilter] = useState<Sector | "all">("all");
  const [quality, setQuality] = useState<Quality>("balanced");
  const [retryKey, setRetryKey] = useState(0);
  const focus = useRef(new THREE.Vector3(0, 0, 0));
  const controlsRef = useRef<any>(null);
  const qualityConfig = { cinematic: { stars: 320, dpr: [1, 1.65] as [number, number] }, balanced: { stars: 180, dpr: [1, 1.35] as [number, number] }, mobile: { stars: 70, dpr: [1, 1.1] as [number, number] } }[quality];
  const sectorKeys: Sector[] = ["energy", "healthcare", "logistics", "finance", "communications", "trust"];
  const incidents = useMemo(() => state.eventLog.slice(-12).map((event, index) => ({ ...event, sector: (EVENTS.find(candidate => candidate.id === event.eventId)?.sector ?? "trust") as Sector, region: regionMap[(event.day + index * 3) % regionMap.length] })).filter(event => filter === "all" || event.sector === filter), [state.eventLog, filter]);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    setWebglAvailable(Boolean(context));
    const stored = window.localStorage.getItem("parallax-quality") as Quality | null;
    const narrow = window.matchMedia("(max-width: 760px)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setQuality(stored ?? (narrow ? "mobile" : compact ? "balanced" : "cinematic"));
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, [compact]);
  const updateQuality = (next: Quality) => { setQuality(next); window.localStorage.setItem("parallax-quality", next); };
  const focusRegion = (name: string, position: THREE.Vector3) => { setRegion(name); focus.current.copy(position); };
  return <div className={`planetary-viewport ${compact ? "compact" : ""}`} role="region" aria-label="Interactive textured 3D Earth showing deterministic simulation incident markers">
    {webglAvailable ? <ViewportErrorBoundary key={retryKey} onRetry={() => setRetryKey(value => value + 1)}><Canvas camera={{ position: [0, 0.12, compact ? 4.6 : 4.1], fov: 39 }} dpr={qualityConfig.dpr} gl={{ antialias: quality !== "mobile", powerPreference: "high-performance" }} fallback={<div className="webgl-fallback"><div className="fallback-orb" /><strong>2D FIELD FALLBACK</strong><span>WebGL unavailable · simulation remains playable</span></div>} onCreated={({ gl }) => { gl.setClearColor("#07111d", 0); }}><ambientLight intensity={0.24} color="#8fd8ff" /><directionalLight position={[3, 2, 4]} intensity={1.25} color="#fff1d4" /><Stars radius={8} depth={3} count={qualityConfig.stars} factor={1.7} saturation={0} fade speed={reducedMotion ? 0 : 0.08} /><Suspense fallback={<Html center><div className="texture-loading">LOADING PLANETARY TEXTURES</div></Html>}><Earth state={state} reducedMotion={reducedMotion} quality={quality} filter={filter} onSelectRegion={focusRegion} /></Suspense><OrbitControls ref={controlsRef} enablePan={false} minDistance={2.7} maxDistance={6} enableDamping dampingFactor={0.07} autoRotate={!reducedMotion} autoRotateSpeed={0.18} /><CameraFocus focus={focus} controlsRef={controlsRef} /></Canvas></ViewportErrorBoundary> : <div className="webgl-fallback" role="status" aria-live="polite"><div className="fallback-orb" /><strong>2D FIELD FALLBACK</strong><span>WebGL unavailable · simulation remains playable</span></div>}
    <TextureLoadStatus /><div className="planetary-overlay"><span className="eyebrow">LIVE PLANETARY FIELD</span><strong>{region}</strong><small>{state.eventLog.length ? `${state.eventLog.length} recorded incidents · projection-linked` : "NASA Blue Marble surface · baseline field"}</small></div><div className="viewport-controls"><label>QUALITY <select value={quality} onChange={event => updateQuality(event.target.value as Quality)} aria-label="Graphics quality"><option value="cinematic">CINEMATIC</option><option value="balanced">BALANCED</option><option value="mobile">MOBILE</option></select></label><div className="sector-filters" aria-label="Sector overlay filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")} aria-pressed={filter === "all"}>ALL</button>{sectorKeys.map(sector => <button key={sector} className={filter === sector ? "active" : ""} onClick={() => setFilter(sector)} aria-pressed={filter === sector}>{sector.slice(0, 3).toUpperCase()}</button>)}</div></div><button className="reduced-motion-toggle" onClick={() => setReducedMotion(value => !value)} aria-pressed={reducedMotion}>{reducedMotion ? "MOTION REDUCED" : "REDUCE MOTION"}</button>
    <details className="viewport-event-list"><summary>ACCESSIBLE INCIDENT NAVIGATION · {incidents.length}</summary><div>{incidents.length ? incidents.map(event => <button key={event.hash} onClick={() => focusRegion(event.region.name, point(event.region.lat, event.region.lon, 1.59))}><strong>{event.title}</strong><span>DAY {event.day} · {event.region.name} · {event.sector.toUpperCase()}</span></button>) : <p>No incidents recorded.</p>}</div></details>
  </div>;
}
