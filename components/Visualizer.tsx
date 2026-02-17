
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { VizMode } from '../types';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  mode: VizMode;
  activeColor: string;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, mode, activeColor, isPlaying }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>(0);
  const colorRef = useRef(new THREE.Color(activeColor));

  // Mode-specific persistent state
  const objectsRef = useRef<THREE.Object3D[]>([]);
  const peaksRef = useRef<{y: number, vel: number}[]>([]); // For Mode 4 peaks

  useEffect(() => {
    colorRef.current.set(activeColor);
  }, [activeColor]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 240;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const clearScene = () => {
      while(scene.children.length > 0){ 
        const obj = scene.children[0];
        obj.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
            else child.material.dispose();
          }
        });
        scene.remove(obj); 
      }
      objectsRef.current = [];
    };

    const setupMode = () => {
      clearScene();
      const col = colorRef.current;

      if (mode === VizMode.ORGANIC_WAVE) {
        // Mode 1: Thick Concentric Neon Rings + Peak Nodes
        for (let r = 0; r < 2; r++) {
          const group = new THREE.Group();
          for (let l = 0; l < 16; l++) {
            const geom = new THREE.BufferGeometry();
            const verts = new Float32Array(256 * 3);
            geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
            const mat = new THREE.LineBasicMaterial({ 
                color: col, 
                transparent: true, 
                opacity: 0.85 - (l * 0.05),
                blending: THREE.AdditiveBlending 
            });
            const line = new THREE.LineLoop(geom, mat);
            line.userData = { offset: l * 0.5 };
            group.add(line);
          }
          
          const pGeom = new THREE.BufferGeometry();
          const pPos = new Float32Array(64 * 3); 
          pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
          const pMat = new THREE.PointsMaterial({ 
            size: 5, color: 0xffffff, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending 
          });
          const nodes = new THREE.Points(pGeom, pMat);
          nodes.name = `nodes_${r}`;
          group.add(nodes);

          scene.add(group);
          objectsRef.current.push(group);
        }
      } else if (mode === VizMode.SYMMETRIC_SPIKES) {
        // Mode 2: Kinetic Spikes with Vertical Connectors & Fluid Color
        const barCount = 256;
        
        // Geometry for vertical bars (LineSegments)
        const lineGeom = new THREE.BufferGeometry();
        const linePos = new Float32Array(barCount * 2 * 3); // 2 points per vertical bar
        const lineColors = new Float32Array(barCount * 2 * 3);
        lineGeom.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        lineGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
        
        const lineMat = new THREE.LineBasicMaterial({ 
          vertexColors: true, 
          transparent: true, 
          opacity: 0.8, 
          blending: THREE.AdditiveBlending 
        });
        const lines = new THREE.LineSegments(lineGeom, lineMat);
        lines.name = "kineticLines";
        scene.add(lines);
        objectsRef.current.push(lines);

        // Geometry for peak points
        const ptsGeom = new THREE.BufferGeometry();
        const ptsPos = new Float32Array(barCount * 2 * 3); // Mirrored peaks (top and bottom)
        const ptsColors = new Float32Array(barCount * 2 * 3);
        ptsGeom.setAttribute('position', new THREE.BufferAttribute(ptsPos, 3));
        ptsGeom.setAttribute('color', new THREE.BufferAttribute(ptsColors, 3));
        
        const ptsMat = new THREE.PointsMaterial({ 
          size: 4, 
          vertexColors: true, 
          transparent: true, 
          opacity: 0.9, 
          blending: THREE.AdditiveBlending 
        });
        const pts = new THREE.Points(ptsGeom, ptsMat);
        pts.name = "kineticPoints";
        scene.add(pts);
        objectsRef.current.push(pts);

        // Horizon line
        const horizonGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-300, 0, 0), new THREE.Vector3(300, 0, 0)]);
        const horizon = new THREE.Line(horizonGeom, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.1, transparent: true }));
        scene.add(horizon);
      } else if (mode === VizMode.BLOCK_EQUALIZER) {
        // Mode 3: 3D Oscilloscope & Ribbons
        const group = new THREE.Group();
        const grid = new THREE.GridHelper(800, 40, 0xffffff, 0xffffff);
        grid.material.transparent = true;
        grid.material.opacity = 0.06;
        grid.rotation.x = Math.PI / 2;
        grid.position.z = -50;
        group.add(grid);

        for (let j = 0; j < 4; j++) {
          const ribbonGroup = new THREE.Group();
          const pointsCount = 300;
          for (let l = 0; l < 5; l++) {
            const geom = new THREE.BufferGeometry();
            const verts = new Float32Array(pointsCount * 3);
            geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
            const mat = new THREE.LineBasicMaterial({ 
              color: col, transparent: true, 
              opacity: (0.9 - (j * 0.12)) * (1.0 - (l * 0.15)), 
              blending: THREE.AdditiveBlending 
            });
            const line = new THREE.Line(geom, mat);
            line.name = `ribbon_${j}_layer_${l}`;
            line.userData = { jOffset: j * 1.5, layerIdx: l, layerSpread: l * 0.6 }; 
            ribbonGroup.add(line);
          }
          const pGeom = new THREE.BufferGeometry();
          const pPos = new Float32Array(48 * 3); 
          pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
          const pMat = new THREE.PointsMaterial({ size: 6, color: 0xffffff, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending });
          const pts = new THREE.Points(pGeom, pMat);
          pts.name = `nodes_${j}`;
          ribbonGroup.add(pts);
          group.add(ribbonGroup);
        }
        scene.add(group);
        objectsRef.current.push(group);
      } else if (mode === VizMode.SINE_RHYTHM) {
        // Mode 4: Cyber EQ Bars
        const eqGroup = new THREE.Group();
        const barCount = 48;
        const barWidth = 6;
        const spacing = 2;
        peaksRef.current = Array.from({length: barCount}, () => ({ y: 0, vel: 0 }));
        for (let i = 0; i < barCount; i++) {
          const barGeom = new THREE.BoxGeometry(barWidth, 1, 2);
          const barMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
          const bar = new THREE.Mesh(barGeom, barMat);
          bar.position.x = (i - barCount / 2) * (barWidth + spacing);
          bar.position.y = 0;
          bar.name = `bar_${i}`;
          eqGroup.add(bar);
          const peakGeom = new THREE.PlaneGeometry(barWidth, barWidth / 2);
          const peakMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
          const peak = new THREE.Mesh(peakGeom, peakMat);
          peak.position.x = bar.position.x;
          peak.position.z = 1.1;
          peak.name = `peak_${i}`;
          eqGroup.add(peak);
        }
        scene.add(eqGroup);
        objectsRef.current.push(eqGroup);
      } else if (mode === VizMode.FADER_DANCE) {
        // Mode 5: Volumetric Wave
        const group = new THREE.Group();
        const layers = 15;
        for (let l = 0; l < layers; l++) {
          const geom = new THREE.BufferGeometry();
          const verts = new Float32Array(300 * 3 * 2); 
          geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
          const layerCol = new THREE.Color('#00E5FF').lerp(new THREE.Color('#9D00FF'), l / layers);
          const mat = new THREE.LineBasicMaterial({ 
            color: layerCol, transparent: true, opacity: 1.0 - (l * 0.05), blending: THREE.AdditiveBlending
          });
          const line = new THREE.Line(geom, mat);
          line.userData = { xOff: l * 1.5, yOff: l * 0.5, lIdx: l };
          group.add(line);
        }
        scene.add(group);
        objectsRef.current.push(group);
      }
    };

    setupMode();

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      const freqData = new Uint8Array(analyser ? analyser.frequencyBinCount : 512);
      const timeData = new Uint8Array(analyser ? analyser.frequencyBinCount : 512);
      if (analyser) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);
      }
      const time = Date.now() * 0.001;
      const bass = (freqData[0] + freqData[2] + freqData[4]) / 3 / 255;
      const treble = (freqData[120] + freqData[150]) / 2 / 255;

      if (mode !== VizMode.FADER_DANCE && mode !== VizMode.SYMMETRIC_SPIKES) {
        scene.traverse((obj: any) => {
          if (obj.material && obj.material.color && !obj.name.includes("peak") && !obj.name.includes("nodes")) {
            obj.material.color.lerp(colorRef.current, 0.08);
          }
        });
      }

      if (mode === VizMode.ORGANIC_WAVE) {
        objectsRef.current.forEach((group, gIdx) => {
          const baseRadius = gIdx === 0 ? 45 : 75;
          const expansion = gIdx === 0 ? treble * 25 : bass * 35;
          const nodes = group.getObjectByName(`nodes_${gIdx}`) as THREE.Points;
          const nodePos = nodes?.geometry.attributes.position.array as Float32Array;
          let nodeCount = 0;
          const radialValues = new Float32Array(256);

          group.children.forEach((child) => {
            if (child.type !== 'LineLoop') return;
            const line = child as THREE.LineLoop;
            const pos = line.geometry.attributes.position.array as Float32Array;
            const offset = (line.userData as any).offset;
            for(let i=0; i<256; i++){
              const angle = (i/256) * Math.PI * 2;
              const fVal = isPlaying ? freqData[i % 128] / 255 : 0;
              const r = baseRadius + expansion + fVal * 12 + Math.sin(time * 5 + i * 0.1) * offset;
              pos[i*3] = Math.cos(angle) * r;
              pos[i*3+1] = Math.sin(angle) * r;
              pos[i*3+2] = Math.sin(time + i*0.1) * offset * 0.5;
              if (offset === 0) radialValues[i] = r; 
            }
            line.geometry.attributes.position.needsUpdate = true;
          });

          if (nodes && nodePos) {
            for (let i = 0; i < 256; i++) {
              const prev = radialValues[(i - 1 + 256) % 256];
              const curr = radialValues[i];
              const next = radialValues[(i + 1) % 256];
              const isPeak = curr > prev && curr > next;
              const isTrough = curr < prev && curr < next;
              if ((isPeak || isTrough) && nodeCount < 64) {
                const angle = (i / 256) * Math.PI * 2;
                nodePos[nodeCount * 3] = Math.cos(angle) * curr;
                nodePos[nodeCount * 3 + 1] = Math.sin(angle) * curr;
                nodePos[nodeCount * 3 + 2] = 0;
                nodeCount++;
              }
            }
            for (let k = nodeCount; k < 64; k++) { nodePos[k * 3 + 2] = -5000; }
            nodes.geometry.attributes.position.needsUpdate = true;
            (nodes.material as THREE.PointsMaterial).opacity = 0.4 + Math.abs(Math.sin(time * 15)) * 0.6;
          }
          group.rotation.z += 0.002 * (gIdx === 0 ? 1 : -1);
        });
      } else if (mode === VizMode.SYMMETRIC_SPIKES) {
        // Mode 2: Kinetic Spikes with Fluid Gradient
        const lines = objectsRef.current[0] as THREE.LineSegments;
        const points = objectsRef.current[1] as THREE.Points;
        const linePos = lines.geometry.attributes.position.array as Float32Array;
        const lineColors = lines.geometry.attributes.color.array as Float32Array;
        const ptsPos = points.geometry.attributes.position.array as Float32Array;
        const ptsColors = points.geometry.attributes.color.array as Float32Array;
        
        const barCount = 256;
        const fluidColor = new THREE.Color();

        for(let i=0; i < barCount; i++){
          const pIdx = i / barCount;
          const centerDist = Math.abs(pIdx - 0.5) * 2;
          const fIdx = Math.floor(centerDist * 200);
          const fVal = isPlaying ? freqData[fIdx] / 255 : 0;
          
          const x = (pIdx - 0.5) * 550;
          const yTop = (fVal * 120) + (Math.sin(time * 5 + i * 0.2) * 5);
          const yBottom = -yTop;
          
          // Flowing Color Logic
          // Use HSL for iridescence: Hue shifts over time and spectrum
          const hue = (pIdx * 0.8 + time * 0.5) % 1.0;
          fluidColor.setHSL(hue, 0.9, 0.6);
          // Lerp with active color for theme consistency
          fluidColor.lerp(colorRef.current, 0.4);

          // Update Lines (Top point, then Bottom point)
          const lIdx = i * 2 * 3;
          linePos[lIdx] = x; linePos[lIdx+1] = yTop; linePos[lIdx+2] = 0;
          linePos[lIdx+3] = x; linePos[lIdx+4] = yBottom; linePos[lIdx+5] = 0;

          lineColors[lIdx] = fluidColor.r; lineColors[lIdx+1] = fluidColor.g; lineColors[lIdx+2] = fluidColor.b;
          lineColors[lIdx+3] = fluidColor.r; lineColors[lIdx+4] = fluidColor.g; lineColors[lIdx+5] = fluidColor.b;

          // Update Points (Peak top and Peak bottom)
          const pIdx3 = i * 2 * 3;
          ptsPos[pIdx3] = x; ptsPos[pIdx3+1] = yTop; ptsPos[pIdx3+2] = 0;
          ptsPos[pIdx3+3] = x; ptsPos[pIdx3+4] = yBottom; ptsPos[pIdx3+5] = 0;

          // Points are brighter/white at tips for "High Light" effect
          const tipColor = fluidColor.clone().lerp(new THREE.Color(0xffffff), 0.7);
          ptsColors[pIdx3] = tipColor.r; ptsColors[pIdx3+1] = tipColor.g; ptsColors[pIdx3+2] = tipColor.b;
          ptsColors[pIdx3+3] = tipColor.r; ptsColors[pIdx3+4] = tipColor.g; ptsColors[pIdx3+5] = tipColor.b;
        }

        lines.geometry.attributes.position.needsUpdate = true;
        lines.geometry.attributes.color.needsUpdate = true;
        points.geometry.attributes.position.needsUpdate = true;
        points.geometry.attributes.color.needsUpdate = true;
      } else if (mode === VizMode.BLOCK_EQUALIZER) {
        const group = objectsRef.current[0] as THREE.Group;
        const count = 300;
        for (let j = 0; j < 4; j++) {
          const ribbonGroup = group.children[j+1] as THREE.Group;
          const nodes = ribbonGroup.getObjectByName(`nodes_${j}`) as THREE.Points;
          const nodePos = nodes.geometry.attributes.position.array as Float32Array;
          let nodeIdx = 0;
          for (let l = 0; l < 5; l++) {
            const line = ribbonGroup.getObjectByName(`ribbon_${j}_layer_${l}`) as THREE.Line;
            if (!line) continue;
            const pos = line.geometry.attributes.position.array as Float32Array;
            const { jOffset, layerSpread } = line.userData;
            for (let i = 0; i < count; i++) {
              const pIdx = i / count;
              let val = 0;
              if (j === 0) {
                val = isPlaying ? (timeData[Math.floor(pIdx * 128)] - 128) / 128 : 0;
                val *= 100;
              } else {
                const fVal = isPlaying ? freqData[Math.floor(pIdx * 100)] / 255 : 0;
                val = Math.sin(pIdx * 10 + time * 3 + jOffset) * (20 + fVal * 80);
              }
              const x = (pIdx - 0.5) * 600;
              const z = Math.cos(pIdx * 5 + time + jOffset) * 40;
              pos[i*3] = x; pos[i*3+1] = val + layerSpread; pos[i*3+2] = z + layerSpread * 0.5;
              if (l === 0 && i % 6 === 0 && nodeIdx < 48) {
                if (Math.abs(val) > 25) {
                  nodePos[nodeIdx*3] = x; nodePos[nodeIdx*3+1] = val; nodePos[nodeIdx*3+2] = z;
                  nodeIdx++;
                }
              }
            }
            line.geometry.attributes.position.needsUpdate = true;
          }
          for (let k = nodeIdx; k < 48; k++) { nodePos[k*3+2] = -5000; }
          nodes.geometry.attributes.position.needsUpdate = true;
          (nodes.material as THREE.PointsMaterial).opacity = 0.6 + Math.sin(time*12) * 0.4;
        }
      } else if (mode === VizMode.SINE_RHYTHM) {
        const group = objectsRef.current[0] as THREE.Group;
        const count = 48;
        const gravity = 0.6;
        for (let i = 0; i < count; i++) {
          const fVal = isPlaying ? freqData[Math.floor((i / count) * 150)] / 255 : 0;
          const barHeight = Math.max(2, fVal * 160);
          const bar = group.getObjectByName(`bar_${i}`) as THREE.Mesh;
          const peak = group.getObjectByName(`peak_${i}`) as THREE.Mesh;
          if (bar) {
            bar.scale.y = barHeight;
            bar.position.y = barHeight / 2 - 80;
            const barCol = new THREE.Color('#9D00FF').lerp(new THREE.Color('#FF0000'), fVal);
            (bar.material as THREE.MeshBasicMaterial).color.copy(barCol);
          }
          if (peak && peaksRef.current[i]) {
            const currentPeak = peaksRef.current[i];
            const barTopY = (barHeight - 80);
            if (barTopY > currentPeak.y) {
              currentPeak.y = barTopY;
              currentPeak.vel = 0;
            } else {
              currentPeak.vel -= gravity;
              currentPeak.y += currentPeak.vel;
            }
            if (currentPeak.y < -80) currentPeak.y = -80;
            peak.position.y = currentPeak.y + 2;
            peak.rotation.z += 0.02;
          }
        }
      } else if (mode === VizMode.FADER_DANCE) {
        const group = objectsRef.current[0] as THREE.Group;
        group.children.forEach((child) => {
          const line = child as THREE.Line;
          const pos = line.geometry.attributes.position.array as Float32Array;
          const { xOff, yOff } = line.userData;
          for(let i=0; i<300; i++){
            const pIdx = i / 300;
            const distFromCenter = Math.abs(pIdx - 0.5) * 2;
            const fIdx = Math.floor(distFromCenter * 150);
            const val = isPlaying ? freqData[fIdx] / 255 : 0;
            const taper = Math.sin(pIdx * Math.PI);
            const x = (pIdx - 0.5) * 500 + (Math.sin(time + yOff) * 10);
            const y = (val * 120 * taper) + yOff + (Math.sin(time * 4 + i * 0.05) * 5);
            pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = 0;
            const bIdx = (i + 300) * 3;
            pos[bIdx] = x; pos[bIdx+1] = -y; pos[bIdx+2] = 0;
          }
          line.geometry.attributes.position.needsUpdate = true;
        });
      }

      const camTargetZ = 240 - (bass * 60);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, 0.05);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) containerRef.current.removeChild(renderer.domElement);
    };
  }, [mode]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />;
};

export default Visualizer;
