// What the game gets from the cartoon's own code. The build puts the panther rig (panther/panther-rig.js) and the
// hoofed animals of the trailer episode into game.js at its markers, so these names exist at run time but not in
// the source file. Declaring them here lets the type checker (npm run typecheck) know about them.
declare const COATS: Record<string, any>;
declare const BEASTS: Record<string, any>;
declare const PSTYLE: { rim2: number; [k: string]: any };
declare let CH_D: number;
declare let P_SCR: any;
declare const ST: number, CT: number, RS: number, RC: number, PIV: number;
declare function pr(f: number, y: number, z: number): [number, number];
declare function camK0(f: number, y: number, z: number): number;
declare function setTurn(v: number): void;
declare function setGroundTransform(c: CanvasRenderingContext2D): void;
declare function beastShadow(sp: any, lift: number): void;
declare function drawBeast(sp: any, st: any): void;
declare function drawPanther(t: number, ph?: number): void;

// The state of one round. Typing it means a misspelled field is caught, instead of silently becoming a new one.
interface RunState {
  t: number; dist: number; stars: number; paws: number; inv: number; lane: number;
  jumpT: number; jumpBuf: number; fireT: number; fireBuf: number;
  next: number; nextLog: number; wave: number; lastRow: number; lastGap: number; botT: number;
  rnd: () => number; hinted: boolean; combo: number; won: boolean; slow: number;
  bonus: number; spooked: number; popT: number; nextGem: number; spitT: number; cancels: number; gems: number; warned: boolean;
  armor: null | { kind: string; t0: number; until: number; hits: number };
}
