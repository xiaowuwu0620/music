
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

  const objectsRef = useRef<THREE.Object3D[]>([]);
  const peaksRef = useRef<{y: number, vel: number}[]>([]); 
  const bgParticlesRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    colorRef.current.set(activeColor);
  }, [activeColor]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 240;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create persistent Aurora Background Particles
    const createBG = () => {
      const pCount = 800;
      const pGeom = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for(let i=0; i<pCount; i++) {
        pPos[i*3] = (Math.random() - 0.5) * 1500;
        pPos[i*3+1] = (Math.random() - 0.5) * 1500;
        pPos[i*3+2] = (Math.random() - 0.5) * 800 - 400;
      }
      pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        size: 1.5,
        color: 0x44ff44,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
      });
      const bg = new THREE.Points(pGeom, pMat);
      scene.add(bg);
      bgParticlesRef.current = bg;
    };
    createBG();

    const clearModeObjects = () => {
      objectsRef.current.forEach(obj => {
        scene.remove(obj);
        obj.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
            else child.material.dispose();
          }
        });
      });
      objectsRef.current = [];
    };

    const setupMode = () => {
      clearModeObjects();
      const col = colorRef.current;

      if (mode === VizMode.ORGANIC_WAVE) {
        // Mode 1: Ethereal Ripples
        const group = new THREE.Group();
        for (let l = 0; l < 24; l++) {
          const geom = new THREE.BufferGeometry();
          const verts = new Float32Array(256 * 3);
          geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
          const mat = new THREE.LineBasicMaterial({ 
              color: col, 
              transparent: true, 
              opacity: 0.8 - (l * 0.03),
              blending: THREE.AdditiveBlending 
          });
          const line = new THREE.LineLoop(geom, mat);
          line.userData = { offset: l * 0.4 };
          group.add(line);
        }
        
        // Highlighted Peak Nodes
        const pGeom = new THREE.BufferGeometry();
        const pPos = new Float32Array(80 * 3); 
        pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ 
          size: 4, color: 0xffffff, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending 
        });
        const nodes = new THREE.Points(pGeom, pMat);
        nodes.name = "peak_nodes";
        group.add(nodes);

        scene.add(group);
        objectsRef.current.push(group);
      } else if (mode === VizMode.SYMMETRIC_SPIKES) {
        // Mode 2: Neon Rain / Symmetric Gradients
        const barCount = 180;
        const lineGeom = new THREE.BufferGeometry();
        const linePos = new Float32Array(barCount * 2 * 3);
        const lineColors = new Float32Array(barCount * 2 * 3);
        lineGeom.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        lineGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
        const lines = new THREE.LineSegments(lineGeom, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
        scene.add(lines);
        objectsRef.current.push(lines);

        const ptsGeom = new THREE.BufferGeometry();
        const ptsPos = new Float32Array(barCount * 2 * 3);
        const ptsColors = new Float32Array(barCount * 2 * 3);
        ptsGeom.setAttribute('position', new THREE.BufferAttribute(ptsPos, 3));
        ptsGeom.setAttribute('color', new THREE.BufferAttribute(ptsColors, 3));
        const pts = new THREE.Points(ptsGeom, new THREE.PointsMaterial({ size: 5, vertexColors: true, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending }));
        scene.add(pts);
        objectsRef.current.push(pts);
      } else if (mode === VizMode.BLOCK_EQUALIZER) {
        // Mode 3: Aurora Curtains (Resplendent Ribbons)
        const group = new THREE.Group();
        
        // Sci-Fi Horizon Grid
        const grid = new THREE.GridHelper(1000, 50, 0x00ff00, 0x00ff00);
        grid.material.transparent = true;
        grid.material.opacity = 0.05;
        grid.rotation.x = Math.PI / 2;
        grid.position.z = -100;
        group.add(grid);

        for (let j = 0; j < 6; j++) {
          const ribbonGroup = new THREE.Group();
          const pointsCount = 400;
          // 8 layers for maximum "aurora curtain" thickness
          for (let l = 0; l < 8; l++) {
            const geom = new THREE.BufferGeometry();
            const verts = new Float32Array(pointsCount * 3);
            geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
            const mat = new THREE.LineBasicMaterial({ 
              color: col, transparent: true, 
              opacity: (1.0 - (j * 0.15)) * (0.8 - (l * 0.1)), 
              blending: THREE.AdditiveBlending 
            });
            const line = new THREE.Line(geom, mat);
            line.name = `curtain_${j}_l${l}`;
            line.userData = { jOff: j * 1.2, lSpread: l * 0.8 }; 
            ribbonGroup.add(line);
          }
          const pGeom = new THREE.BufferGeometry();
          const pPos = new Float32Array(64 * 3); 
          pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
          const pMat = new THREE.PointsMaterial({ size: 8, color: 0xffffff, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending });
          const nodes = new THREE.Points(pGeom, pMat);
          nodes.name = `curtain_nodes_${j}`;
          ribbonGroup.add(nodes);
          group.add(ribbonGroup);
        }
        scene.add(group);
        objectsRef.current.push(group);
      } else if (mode === VizMode.SINE_RHYTHM) {
        // Mode 4: Spectral Forest
        const eqGroup = new THREE.Group();
        const barCount = 64;
        peaksRef.current = Array.from({length: barCount}, () => ({ y: 0, vel: 0 }));
        for (let i = 0; i < barCount; i++) {
          const barGeom = new THREE.BoxGeometry(4, 1, 4);
          const barMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
          const bar = new THREE.Mesh(barGeom, barMat);
          bar.position.x = (i - barCount / 2) * 8;
          bar.name = `tree_${i}`;
          eqGroup.add(bar);
          const peakGeom = new THREE.SphereGeometry(2, 8, 8);
          const peakMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
          const peak = new THREE.Mesh(peakGeom, peakMat);
          peak.position.x = bar.position.x;
          peak.name = `glow_${i}`;
          eqGroup.add(peak);
        }
        scene.add(eqGroup);
        objectsRef.current.push(eqGroup);
      } else if (mode === VizMode.FADER_DANCE) {
        // Mode 5: Cosmic Pulse
        const group = new THREE.Group();
        const layers = 20;
        for (let l = 0; l < layers; l++) {
          const geom = new THREE.BufferGeometry();
          const verts = new Float32Array(300 * 3 * 2); 
          geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
          const mat = new THREE.LineBasicMaterial({ 
            color: new THREE.Color(0x00ff00).lerp(new THREE.Color(0xccff00), l/layers), 
            transparent: true, opacity: 1.0 - (l * 0.04), blending: THREE.AdditiveBlending
          });
          const line = new THREE.Line(geom, mat);
          line.userData = { xOff: l * 2, yOff: l * 1.5 };
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
      const treble = (freqData[60] + freqData[90]) / 2 / 255;

      // Update background cosmic particles
      if (bgParticlesRef.current) {
        const bg = bgParticlesRef.current;
        bg.rotation.y += 0.0005;
        bg.rotation.x += 0.0002;
        (bg.material as THREE.PointsMaterial).opacity = 0.1 + bass * 0.15;
      }

      // Update modes with Acid Green logic
      scene.traverse((obj: any) => {
        if (obj.material && obj.material.color && !obj.name.includes("glow") && !obj.name.includes("nodes")) {
          obj.material.color.lerp(colorRef.current, 0.06);
        }
      });

      if (mode === VizMode.ORGANIC_WAVE) {
        const group = objectsRef.current[0] as THREE.Group;
        const nodes = group.getObjectByName("peak_nodes") as THREE.Points;
        const nodePos = nodes.geometry.attributes.position.array as Float32Array;
        let nCount = 0;
        const baseR = 60 + bass * 40;

        group.children.forEach((child) => {
          if (child.type !== 'LineLoop') return;
          const line = child as THREE.LineLoop;
          const pos = line.geometry.attributes.position.array as Float32Array;
          const off = line.userData.offset;
          for(let i=0; i<256; i++){
            const angle = (i/256) * Math.PI * 2;
            const fVal = isPlaying ? freqData[i % 128] / 255 : 0;
            const r = baseR + fVal * 25 + Math.sin(time * 3 + i * 0.08) * off;
            pos[i*3] = Math.cos(angle) * r;
            pos[i*3+1] = Math.sin(angle) * r;
            pos[i*3+2] = Math.sin(time + i*0.05) * off * 2;
            
            if (off === 0 && i % 12 === 0 && nCount < 80) {
              if (fVal > 0.4) {
                nodePos[nCount*3] = pos[i*3]; nodePos[nCount*3+1] = pos[i*3+1]; nodePos[nCount*3+2] = pos[i*3+2];
                nCount++;
              }
            }
          }
          line.geometry.attributes.position.needsUpdate = true;
        });
        for(let k=nCount; k<80; k++) nodePos[k*3+2] = -5000;
        nodes.geometry.attributes.position.needsUpdate = true;
        (nodes.material as THREE.PointsMaterial).opacity = 0.5 + Math.sin(time*12)*0.5;

      } else if (mode === VizMode.SYMMETRIC_SPIKES) {
        const lines = objectsRef.current[0] as THREE.LineSegments;
        const pts = objectsRef.current[1] as THREE.Points;
        const lPos = lines.geometry.attributes.position.array as Float32Array;
        const lCol = lines.geometry.attributes.color.array as Float32Array;
        const pPos = pts.geometry.attributes.position.array as Float32Array;
        const pCol = pts.geometry.attributes.color.array as Float32Array;
        const count = 180;

        for(let i=0; i<count; i++){
          const pIdx = i / count;
          const dist = Math.abs(pIdx - 0.5) * 2;
          const fVal = isPlaying ? freqData[Math.floor(dist * 200)] / 255 : 0;
          const x = (pIdx - 0.5) * 600;
          const y = (fVal * 160) + (Math.sin(time * 6 + i * 0.2) * 5);
          
          lPos[i*6] = x; lPos[i*6+1] = y; lPos[i*6+3] = x; lPos[i*6+4] = -y;
          
          const glowCol = new THREE.Color().setHSL(0.25 + (dist * 0.1), 1.0, 0.4 + fVal * 0.5);
          lCol[i*6] = glowCol.r; lCol[i*6+1] = glowCol.g; lCol[i*6+2] = glowCol.b;
          lCol[i*6+3] = glowCol.r; lCol[i*6+4] = glowCol.g; lCol[i*6+5] = glowCol.b;
          
          pPos[i*6] = x; pPos[i*6+1] = y; pPos[i*6+3] = x; pPos[i*6+4] = -y;
          const tip = glowCol.clone().lerp(new THREE.Color(0xffffff), 0.7);
          pCol[i*6] = tip.r; pCol[i*6+1] = tip.g; pCol[i*6+2] = tip.b;
          pCol[i*6+3] = tip.r; pCol[i*6+4] = tip.g; pCol[i*6+5] = tip.b;
        }
        lines.geometry.attributes.position.needsUpdate = true;
        lines.geometry.attributes.color.needsUpdate = true;
        pts.geometry.attributes.position.needsUpdate = true;
        pts.geometry.attributes.color.needsUpdate = true;

      } else if (mode === VizMode.BLOCK_EQUALIZER) {
        const group = objectsRef.current[0] as THREE.Group;
        for (let j = 0; j < 6; j++) {
          const ribGrp = group.children[j+1] as THREE.Group;
          const nodes = ribGrp.getObjectByName(`curtain_nodes_${j}`) as THREE.Points;
          const nPos = nodes.geometry.attributes.position.array as Float32Array;
          let nIdx = 0;

          for (let l = 0; l < 8; l++) {
            const line = ribGrp.getObjectByName(`curtain_${j}_l${l}`) as THREE.Line;
            const pos = line.geometry.attributes.position.array as Float32Array;
            const { jOff, lSpread } = line.userData;
            for (let i = 0; i < 400; i++) {
              const p = i / 400;
              let val = 0;
              if (j === 0) val = isPlaying ? (timeData[Math.floor(p*128)] - 128) / 128 * 140 : 0;
              else val = Math.sin(p * 8 + time * 2.5 + jOff) * (30 + (isPlaying ? freqData[Math.floor(p*80)]/255 * 100 : 0));
              
              const x = (p - 0.5) * 700;
              const z = Math.cos(p * 4 + time + jOff) * 60;
              pos[i*3] = x; pos[i*3+1] = val + lSpread; pos[i*3+2] = z + lSpread * 0.5;

              if (l === 0 && i % 8 === 0 && nIdx < 64 && Math.abs(val) > 40) {
                nPos[nIdx*3] = x; nPos[nIdx*3+1] = val; nPos[nIdx*3+2] = z;
                nIdx++;
              }
            }
            line.geometry.attributes.position.needsUpdate = true;
          }
          for (let k = nIdx; k < 64; k++) nPos[k*3+2] = -5000;
          nodes.geometry.attributes.position.needsUpdate = true;
          (nodes.material as THREE.PointsMaterial).opacity = 0.5 + Math.sin(time*10)*0.5;
        }

      } else if (mode === VizMode.SINE_RHYTHM) {
        const group = objectsRef.current[0] as THREE.Group;
        for (let i = 0; i < 64; i++) {
          const fVal = isPlaying ? freqData[Math.floor((i/64)*160)] / 255 : 0;
          const h = Math.max(4, fVal * 200);
          const tree = group.getObjectByName(`tree_${i}`) as THREE.Mesh;
          const glow = group.getObjectByName(`glow_${i}`) as THREE.Mesh;
          if (tree) { tree.scale.y = h; tree.position.y = h / 2 - 100; (tree.material as THREE.MeshBasicMaterial).opacity = 0.2 + fVal * 0.6; }
          if (glow && peaksRef.current[i]) {
            const p = peaksRef.current[i];
            const topY = h - 100;
            if (topY > p.y) { p.y = topY; p.vel = 0; } else { p.vel -= 0.8; p.y += p.vel; }
            if (p.y < -100) p.y = -100;
            glow.position.y = p.y + 4;
            glow.scale.setScalar(0.5 + fVal);
          }
        }

      } else if (mode === VizMode.FADER_DANCE) {
        const group = objectsRef.current[0] as THREE.Group;
        group.children.forEach((child) => {
          const line = child as THREE.Line;
          const pos = line.geometry.attributes.position.array as Float32Array;
          const { xOff, yOff } = line.userData;
          for(let i=0; i<300; i++){
            const p = i / 300;
            const dist = Math.abs(p - 0.5) * 2;
            const fVal = isPlaying ? freqData[Math.floor(dist * 180)] / 255 : 0;
            const t = Math.sin(p * Math.PI);
            const x = (p - 0.5) * 600 + (Math.sin(time + yOff) * 15);
            const y = (fVal * 150 * t) + yOff + (Math.sin(time * 5 + i * 0.04) * 8);
            pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = Math.sin(time + p * 5) * 20;
            const b = (i + 300) * 3;
            pos[b] = x; pos[b+1] = -y; pos[b+2] = -pos[i*3+2];
          }
          line.geometry.attributes.position.needsUpdate = true;
        });
      }

      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 240 - (bass * 80), 0.05);
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
