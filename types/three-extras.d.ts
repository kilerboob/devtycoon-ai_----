declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera } from 'three';
  import { EventDispatcher } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    enableDamping: boolean;
    dampingFactor: number;
    enablePan: boolean;
    minDistance: number;
    maxDistance: number;
    update(): void;
  }
}
