declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Core elements
      group: any;
      mesh: any;
      primitive: any;

      // Geometries
      boxGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      circleGeometry: any;
      ringGeometry: any;
      torusGeometry: any;
      edgesGeometry: any;

      // Materials
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      meshPhongMaterial: any;
      meshLambertMaterial: any;
      lineBasicMaterial: any;
      lineDashedMaterial: any;
      pointsMaterial: any;

      // Lights
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      hemisphereLight: any;

      // Other elements
      line: any;
      points: any;
      sprite: any;
      instancedMesh: any;
      lineSegments: any;

      // Cameras
      perspectiveCamera: any;
      orthographicCamera: any;

      // Helpers
      axesHelper: any;
      gridHelper: any;

      // Textures
      texture: any;
      canvasTexture: any;

      // Audio
      audio: any;
      positionalAudio: any;
    }
  }
}
