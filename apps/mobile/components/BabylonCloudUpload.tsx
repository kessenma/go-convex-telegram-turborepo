import React, { useRef, useEffect, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { EngineView, useEngine } from '@babylonjs/react-native';
import {
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Animation,
  Engine,
  Mesh,
  LinesMesh,
  PointerEventTypes,
  PointerInfo,
} from 'babylonjs';

interface DockerService {
  name: string;
  color: Color3;
  position: Vector3;
}

const dockerServices: DockerService[] = [
  {
    name: 'convex-backend',
    color: new Color3(0.3, 0.65, 1),
    position: new Vector3(-0.8, 0.8, 0),
  },
  {
    name: 'convex-console',
    color: new Color3(0.3, 0.65, 1),
    position: new Vector3(0.8, 0.8, 0),
  },
  {
    name: 'next-js-app',
    color: new Color3(0.3, 0.65, 1),
    position: new Vector3(-0.8, -0.8, 0),
  },
  {
    name: 'telegram-bot',
    color: new Color3(0.3, 0.65, 1),
    position: new Vector3(0.8, -0.8, 0),
  },
  {
    name: 'vector-convert-llm',
    color: new Color3(0.3, 0.65, 1),
    position: new Vector3(0, 0.8, 0.8),
  },
  {
    name: 'lightweight-llm',
    color: new Color3(0.3, 0.65, 1),
    position: new Vector3(0, -0.8, -0.8),
  },
];

interface BabylonCloudUploadProps {
  animationEnabled?: boolean;
  onCubeClick?: (serviceName: string) => void;
}

const BabylonCloudUpload: React.FC<BabylonCloudUploadProps> = ({
  animationEnabled = true,
  onCubeClick,
}) => {
  const engine = useEngine();
  const [scene, setScene] = useState<Scene | null>(null);
  const [cubes, setCubes] = useState<Mesh[]>([]);
  const [connectionLines, setConnectionLines] = useState<LinesMesh[]>([]);
  const [cloud, setCloud] = useState<Mesh | null>(null);
  const animationRef = useRef<number>(0);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    if (engine) {
      const newScene = new Scene(engine);
      
      // Create camera
      const camera = new FreeCamera('camera', new Vector3(0, 0, 12), newScene);
      camera.setTarget(Vector3.Zero());
      
      // Create lighting
      const light = new HemisphericLight('light', new Vector3(0, 1, 0), newScene);
      light.intensity = 0.7;
      
      // Create wireframe cloud
      const cloudMesh = createWireframeCloud(newScene);
      setCloud(cloudMesh);
      
      // Create animated cubes
      const cubeMeshes = createAnimatedCubes(newScene);
      setCubes(cubeMeshes);
      
      // Create connection lines
      const lines = createConnectionLines(newScene, cubeMeshes, cloudMesh);
      setConnectionLines(lines);
      
      // Set up pointer events for cube interaction
      newScene.onPointerObservable.add((pointerInfo: PointerInfo) => {
        if (pointerInfo.pickInfo?.hit && pointerInfo.type === PointerEventTypes.POINTERTAP) {
          const pickedMesh = pointerInfo.pickInfo.pickedMesh;
          if (pickedMesh && pickedMesh.metadata?.serviceName) {
            onCubeClick?.(pickedMesh.metadata.serviceName);
          }
        }
      });
      
      setScene(newScene);
      
      // Start animation loop
      if (animationEnabled) {
        startAnimationLoop(newScene, cubeMeshes, lines, cloudMesh);
      }
      
      return () => {
        newScene.dispose();
      };
    }
  }, [engine, animationEnabled, onCubeClick]);

  const createWireframeCloud = (scene: Scene): Mesh => {
    // Create main cloud sphere
    const mainSphere = MeshBuilder.CreateSphere('cloudMain', { diameter: 2.4 }, scene);
    mainSphere.position = new Vector3(0, 4, 0);
    
    const cloudMaterial = new StandardMaterial('cloudMaterial', scene);
    cloudMaterial.emissiveColor = new Color3(0.3, 0.65, 1);
    cloudMaterial.wireframe = true;
    cloudMaterial.alpha = 0.8;
    mainSphere.material = cloudMaterial;
    
    //