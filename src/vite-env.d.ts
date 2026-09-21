/// <reference types="vite/client" />

import type Phaser from "phaser";

declare global {
  interface Window {
    __neonTrailGame?: Phaser.Game;
  }
}

export {};
