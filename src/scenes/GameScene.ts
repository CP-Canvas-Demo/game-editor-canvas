import Phaser from "phaser";
import { directionVector, isOpposite, isValidCell, pickSpawnRule, samePoint } from "../game/logic";
import { getLevelById, getNextLevelId, LEVELS } from "../game/levels";
import { recordBestScore } from "../game/storage";
import type { ProgressionMode } from "../game/storage";
import type { Direction, EnemyDefinition, FoodInstance, LevelDefinition, ObstacleDefinition, Point } from "../game/types";

const CELL = 38;
const BOARD_X = 184;
const BOARD_Y = 130;
interface SnakeSegment {
  point: Point;
  color: number;
}

/** What pressing Enter does while the end-of-level overlay is visible. */
type EndAction = "retry" | "next" | "menu";

export interface GameSceneData {
  levelId: string;
  mode: ProgressionMode;
}

export class GameScene extends Phaser.Scene {
  private levelId = "";
  private mode: ProgressionMode = "campaign";
  private level!: LevelDefinition;
  private snake: SnakeSegment[] = [];
  private obstacles: ObstacleDefinition[] = [];
  private direction: Direction = "right";
  private queuedDirection: Direction = "right";
  private foods: FoodInstance[] = [];
  private enemies: EnemyDefinition[] = [];
  private score = 0;
  private growth = 0;
  private lastFoodKind = "spark";
  private collectedFood: Record<string, number> = {};
  private clearedCrystals = 0;
  private firstPerson = false;
  private paused = false;
  private ended = false;
  private endAction: EndAction = "retry";
  private moveTimer?: Phaser.Time.TimerEvent;
  private spawnTimers: Phaser.Time.TimerEvent[] = [];
  private board!: Phaser.GameObjects.Graphics;
  private world!: Phaser.GameObjects.Container;
  private hud!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;
  private firstPersonLayer?: Phaser.GameObjects.Container;

  constructor() {
    super("game");
  }

  init(data: Partial<GameSceneData>): void {
    this.levelId = data.levelId && getLevelById(data.levelId) ? data.levelId : (LEVELS[0]?.id ?? "");
    this.mode = data.mode === "single" ? "single" : "campaign";
    // A run entered from the menu always starts from zero; campaign mode then
    // carries the running total forward across levels within the same run.
    this.score = 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#09051f");
    // Scenes are restarted on every menu round-trip, so clear references to
    // game objects destroyed by the previous shutdown.
    this.firstPersonLayer = undefined;
    this.spawnTimers = [];
    this.moveTimer = undefined;
    this.createBackdrop();
    this.world = this.add.container();
    this.board = this.add.graphics();
    this.world.add(this.board);
    this.hud = this.add.text(184, 15, "", { fontFamily: "monospace", fontSize: "15px", color: "#f7eaff", lineSpacing: 3 });
    this.message = this.add.text(640, 370, "", { fontFamily: "Trebuchet MS", fontStyle: "bold", fontSize: "36px", color: "#fff6ff", align: "center" }).setOrigin(0.5).setDepth(10);
    this.createOverlay();
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.handleKey(event));
    this.startLevel(this.levelId, this.score);
  }

  private createBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0b0624, 0x0b0624, 0x26063d, 0x26063d, 1);
    graphics.fillRect(0, 0, 1280, 720);
    graphics.lineStyle(1, 0xb442ff, 0.32);
    for (let y = 450; y < 720; y += 22) graphics.lineBetween(0, y, 1280, y);
    for (let x = -300; x < 1580; x += 70) graphics.lineBetween(640, 450, x, 720);
    graphics.fillStyle(0xff3ebf, 0.8);
    graphics.fillCircle(1070, 113, 78);
    graphics.fillStyle(0xffcd61, 1);
    graphics.fillCircle(1070, 107, 75);
    for (let y = 68; y < 156; y += 14) {
      graphics.fillStyle(0x26063d, 0.35);
      graphics.fillRect(995, y, 150, 5);
    }
  }

  private createOverlay(): void {
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x060212, 0.78);
    const panel = this.add.rectangle(640, 360, 780, 390, 0x150a35, 0.95).setStrokeStyle(3, 0x36e6ff);
    const title = this.add.text(640, 245, "", { fontSize: "38px", fontStyle: "bold", color: "#ff65d5" }).setOrigin(0.5);
    const details = this.add.text(640, 350, "", { fontFamily: "monospace", fontSize: "19px", color: "#f8efff", align: "center", lineSpacing: 10 }).setOrigin(0.5);
    this.overlay = this.add.container(0, 0, [shade, panel, title, details]).setDepth(20).setVisible(false);
    this.overlay.setData({ title, details });
  }

  private startLevel(levelId: string, startingScore: number): void {
    const level = getLevelById(levelId);
    if (!level) {
      this.scene.start("menu");
      return;
    }
    this.levelId = levelId;
    this.level = level;
    this.snake = this.level.initialSnake.map((point) => ({ point: { ...point }, color: 0xffdf4a }));
    this.obstacles = this.level.obstacles.map((obstacle) => ({ ...obstacle, position: { ...obstacle.position } }));
    this.enemies = this.level.enemies.map((enemy) => ({ ...enemy, position: { ...enemy.position } }));
    this.direction = "right";
    this.queuedDirection = "right";
    this.foods = [];
    this.score = startingScore;
    this.growth = 0;
    this.lastFoodKind = "spark";
    this.collectedFood = {};
    this.clearedCrystals = 0;
    this.firstPerson = false;
    this.paused = false;
    this.ended = false;
    this.overlay.setVisible(false);
    this.message.setText("");
    this.clearTimers();
    this.addFood();
    this.addFood();
    this.moveTimer = this.time.addEvent({ delay: this.level.speedMs, loop: true, callback: this.moveSnake, callbackScope: this });
    for (const rule of this.level.spawns) {
      this.spawnTimers.push(this.time.addEvent({ delay: rule.intervalMs, loop: true, callback: () => this.addFood(rule.foodId) }));
    }
    this.render();
  }

  private handleKey(event: KeyboardEvent): void {
    const directions: Record<string, Direction> = {
      ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
      ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
    };
    if (directions[event.key]) {
      const candidate = directions[event.key];
      if (!isOpposite(this.direction, candidate)) this.queuedDirection = candidate;
      return;
    }
    if (event.key === "Escape") {
      this.clearTimers();
      this.scene.start("menu");
      return;
    }
    if (event.key === " " || event.key.toLowerCase() === "p") this.togglePause();
    if (event.key.toLowerCase() === "v" && this.level.firstPersonEnabled && !this.ended) {
      this.firstPerson = !this.firstPerson;
      this.render();
    }
    if (event.key === "Enter" && this.ended) this.resolveEndAction();
  }

  private resolveEndAction(): void {
    if (this.endAction === "menu") {
      this.scene.start("menu");
      return;
    }
    if (this.endAction === "next") {
      const nextId = getNextLevelId(this.levelId);
      if (nextId) {
        this.startLevel(nextId, this.score);
        return;
      }
      this.scene.start("menu");
      return;
    }
    this.startLevel(this.levelId, this.mode === "campaign" ? this.score : 0);
  }

  private moveSnake(): void {
    if (this.paused || this.ended) return;
    this.direction = this.queuedDirection;
    const vector = directionVector[this.direction];
    const head = { x: this.snake[0].point.x + vector.x, y: this.snake[0].point.y + vector.y };
    const withoutTail = (this.growth > 0 ? this.snake : this.snake.slice(0, -1)).map((segment) => segment.point);
    const collisionLevel = { ...this.level, obstacles: this.obstacles };
    if (!isValidCell(head, collisionLevel, withoutTail)) {
      const crystal = this.obstacles.find((obstacle) => samePoint(obstacle.position, head) && obstacle.breakableInFirstPerson);
      if (crystal && this.firstPerson) {
        this.obstacles = this.obstacles.filter((obstacle) => obstacle.id !== crystal.id);
        this.clearedCrystals += 1;
      } else {
        this.endLevel("SIGNAL LOST\nYou clipped the grid", "retry");
        return;
      }
    }
    const enemy = this.enemies.find((item) => samePoint(item.position, head));
    if (enemy) {
      if (enemy.edibleAfterFood === this.lastFoodKind) {
        this.enemies = this.enemies.filter((item) => item.id !== enemy.id);
        this.score += 300;
      } else {
        this.endLevel("A WOBBLER GOT YOU\nTry a matching food first", "retry");
        return;
      }
    }
    this.snake.unshift({ point: head, color: this.foodColor(this.lastFoodKind) });
    if (this.growth > 0) this.growth -= 1;
    else this.snake.pop();
    const foodIndex = this.foods.findIndex((food) => samePoint(food.position, head));
    if (foodIndex >= 0) {
      const food = this.foods[foodIndex];
      if (food.firstPersonOnly && !this.firstPerson) {
        this.message.setText("SWITCH TO FIRST-PERSON TO COLLECT THIS");
        this.time.delayedCall(1000, () => { if (!this.paused && !this.ended && !this.firstPerson) this.message.setText(""); });
      } else {
        this.eatFood(this.foods.splice(foodIndex, 1)[0]);
      }
    }
    this.moveEnemies();
    this.checkObjective();
    this.render();
  }

  private eatFood(food: FoodInstance): void {
    this.growth += food.growth;
    this.score += food.score;
    this.lastFoodKind = food.kind;
    this.collectedFood[food.id] = (this.collectedFood[food.id] ?? 0) + 1;
  }

  private moveEnemies(): void {
    this.enemies.forEach((enemy) => {
      const patrol = enemy.patrol ?? [{ x: enemy.position.x + 1, y: enemy.position.y }, { x: enemy.position.x - 1, y: enemy.position.y }];
      const target = patrol[Math.floor(this.time.now / 1250) % patrol.length];
      if (isValidCell(target, { ...this.level, obstacles: this.obstacles }, this.snake.map((segment) => segment.point))) enemy.position = { ...target };
    });
  }

  private addFood(forceId?: string): void {
    if (this.ended || this.paused) return;
    const rule = forceId ? this.level.spawns.find((item) => item.foodId === forceId) : pickSpawnRule(this.level.spawns);
    if (!rule || this.foods.filter((food) => food.id === rule.foodId).length >= rule.maxActive) return;
    const food = this.level.food.find((item) => item.id === rule.foodId);
    if (!food) return;
    const occupied = [...this.snake.map((segment) => segment.point), ...this.foods.map((item) => item.position), ...this.enemies.map((item) => item.position)];
    const candidates = rule.regions ?? Array.from({ length: this.level.grid.width * this.level.grid.height }, (_, index) => ({ x: index % this.level.grid.width, y: Math.floor(index / this.level.grid.width) }));
    const valid = candidates.filter((candidate) => isValidCell(candidate, this.level, occupied));
    if (valid.length) this.foods.push({ ...food, position: Phaser.Utils.Array.GetRandom(valid) });
  }

  private checkObjective(): void {
    const objective = this.level.objective;
    const complete = objective.type === "score" ? this.score >= objective.target
      : objective.type === "clear-crystals" ? this.clearedCrystals >= objective.target
        : (this.collectedFood[objective.foodId ?? ""] ?? 0) >= objective.target;
    if (!complete) return;

    const nextId = this.mode === "campaign" ? getNextLevelId(this.levelId) : undefined;
    if (nextId) {
      this.endLevel("LEVEL CLEAR\nEnter the next signal", "next");
    } else if (this.mode === "campaign") {
      this.endLevel("YOU RODE THE NEON CURRENT\nEvery signal cleared", "menu");
    } else {
      this.endLevel("LEVEL CLEAR\nSignal locked in", "menu");
    }
  }

  private togglePause(): void {
    if (this.ended) return;
    this.paused = !this.paused;
    this.message.setText(this.paused ? "PAUSED\nSpace / P to resume" : "");
    this.render();
  }

  private endLevel(text: string, action: EndAction): void {
    this.ended = true;
    this.endAction = action;
    this.clearTimers();
    const best = recordBestScore(this.levelId, this.score);
    const [heading, subheading = ""] = text.split("\n");
    const prompt = action === "next" ? "Press Enter for the next level"
      : action === "menu" ? "Press Enter to return to the level select"
        : "Press Enter to retry";
    (this.overlay.getData("title") as Phaser.GameObjects.Text).setText(heading);
    (this.overlay.getData("details") as Phaser.GameObjects.Text).setText(
      `${subheading}\n\nSCORE  ${this.score}    BEST  ${best}\n\n${prompt}\nPress Esc for the level select`,
    );
    this.overlay.setVisible(true);
  }

  private clearTimers(): void {
    this.moveTimer?.remove();
    this.spawnTimers.forEach((timer) => timer.remove());
    this.spawnTimers = [];
  }

  private render(): void {
    this.firstPersonLayer?.destroy(true);
    this.firstPersonLayer = undefined;
    this.world.removeAll(true);
    this.board = this.add.graphics();
    this.world.add(this.board);
    const width = this.level.grid.width * CELL;
    const height = this.level.grid.height * CELL;
    this.board.fillStyle(0x100a2d, 0.97).fillRoundedRect(BOARD_X - 8, BOARD_Y - 8, width + 16, height + 16, 14);
    this.board.lineStyle(2, 0x36e6ff, 0.9).strokeRoundedRect(BOARD_X - 8, BOARD_Y - 8, width + 16, height + 16, 14);
    this.board.lineStyle(1, 0x7b55cf, 0.18);
    for (let x = 0; x <= this.level.grid.width; x += 1) this.board.lineBetween(BOARD_X + x * CELL, BOARD_Y, BOARD_X + x * CELL, BOARD_Y + height);
    for (let y = 0; y <= this.level.grid.height; y += 1) this.board.lineBetween(BOARD_X, BOARD_Y + y * CELL, BOARD_X + width, BOARD_Y + y * CELL);
    this.obstacles.forEach((obstacle) => this.drawObstacle(obstacle.position, obstacle.kind, obstacle.breakableInFirstPerson));
    this.foods.forEach((food) => this.drawFood(food));
    this.enemies.forEach((enemy) => this.drawEnemy(enemy));
    this.snake.slice().reverse().forEach((segment, index) => this.drawBrick(segment, index === this.snake.length - 1));
    this.hud.setText(`${this.level.name.toUpperCase()}  //  ${this.level.subtitle}  //  ${this.mode === "campaign" ? "CAMPAIGN" : "SINGLE LEVEL"}\nSCORE ${this.score.toString().padStart(5, "0")}   LENGTH ${this.snake.length + this.growth}   ${this.firstPerson ? "VIEW: FIRST-PERSON" : "VIEW: SKYLINE"}\n${this.objectiveText()}\n[WASD/ARROWS] STEER   [V] VIEW   [SPACE/P] PAUSE   [ESC] LEVELS`);
    if (this.firstPerson && !this.ended) this.drawFirstPerson();
  }

  private objectiveText(): string {
    const objective = this.level.objective;
    if (objective.type === "score") return `OBJECTIVE: REACH ${objective.target} POINTS`;
    if (objective.type === "collect") {
      const collected = this.collectedFood[objective.foodId ?? ""] ?? 0;
      return `OBJECTIVE: COLLECT ${collected}/${objective.target} ${(objective.foodId ?? "").toUpperCase()}`;
    }
    return `OBJECTIVE: CLEAR CRYSTALS ${this.clearedCrystals}/${objective.target} IN FIRST-PERSON`;
  }

  private cell(point: Point): Point {
    return { x: BOARD_X + point.x * CELL + CELL / 2, y: BOARD_Y + point.y * CELL + CELL / 2 };
  }

  private drawBrick(segment: SnakeSegment, head: boolean): void {
    const { x, y } = this.cell(segment.point);
    const color = head ? 0xffe45e : segment.color;
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1).fillRoundedRect(x - 17, y - 15, 34, 30, 6);
    graphics.fillStyle(0xffffff, 0.24).fillCircle(x - 8, y - 7, 5).fillCircle(x + 8, y - 7, 5);
    graphics.lineStyle(2, 0x210b42, 0.75).strokeRoundedRect(x - 17, y - 15, 34, 30, 6);
    if (head) graphics.fillStyle(0x17052a).fillCircle(x - 7, y - 2, 3).fillCircle(x + 7, y - 2, 3);
    this.world.add(graphics);
  }

  private drawFood(food: FoodInstance): void {
    const { x, y } = this.cell(food.position);
    const graphics = this.add.graphics();
    graphics.fillStyle(food.color, 0.22).fillCircle(x, y, 18);
    graphics.fillStyle(food.color, 1).fillRoundedRect(x - 11, y - 11, 22, 22, 4);
    graphics.fillStyle(0xffffff, 0.42).fillCircle(x - 5, y - 5, 3);
    graphics.lineStyle(2, 0xffffff, 0.65).strokeRoundedRect(x - 11, y - 11, 22, 22, 4);
    if (food.firstPersonOnly && !this.firstPerson) graphics.lineStyle(2, 0xff65d5, 0.9).strokeCircle(x, y, 15);
    this.world.add(graphics);
  }

  private drawObstacle(point: Point, kind: string, breakable?: boolean): void {
    const { x, y } = this.cell(point);
    const graphics = this.add.graphics();
    const color = kind === "crystal" ? 0xae6eff : 0x3b295d;
    graphics.fillStyle(color, 0.9).fillRoundedRect(x - 18, y - 18, 36, 36, kind === "crystal" ? 4 : 7);
    graphics.lineStyle(2, breakable ? 0xff65d5 : 0x8d70be, 1).strokeRoundedRect(x - 18, y - 18, 36, 36, kind === "crystal" ? 4 : 7);
    if (kind === "crystal") graphics.lineStyle(2, 0xffffff, 0.5).lineBetween(x - 9, y + 8, x + 7, y - 9);
    this.world.add(graphics);
  }

  private drawEnemy(enemy: EnemyDefinition): void {
    const { x, y } = this.cell(enemy.position);
    const graphics = this.add.graphics();
    graphics.fillStyle(enemy.kind === "glitch" ? 0xff4fd8 : 0x41e1d0, 0.22).fillCircle(x, y, 19);
    graphics.fillStyle(enemy.kind === "glitch" ? 0xff4fd8 : 0x41e1d0, 1).fillCircle(x, y, 13);
    graphics.fillStyle(0x16062e).fillCircle(x - 5, y - 2, 3).fillCircle(x + 5, y - 2, 3);
    graphics.lineStyle(2, 0xffffff, 0.7).strokeCircle(x, y, 13);
    this.world.add(graphics);
  }

  private drawFirstPerson(): void {
    const layer = this.add.container().setDepth(8);
    this.firstPersonLayer = layer;
    const horizonY = BOARD_Y + 112;
    const bottomY = BOARD_Y + this.level.grid.height * CELL;
    const centerX = BOARD_X + (this.level.grid.width * CELL) / 2;
    const viewport = this.add.graphics();
    layer.add(viewport);
    viewport.fillStyle(0x09041e, 0.98).fillRoundedRect(BOARD_X, BOARD_Y, this.level.grid.width * CELL, this.level.grid.height * CELL, 8);
    viewport.fillGradientStyle(0x12082b, 0x12082b, 0x33114e, 0x33114e, 1).fillRect(BOARD_X, horizonY, this.level.grid.width * CELL, bottomY - horizonY);
    viewport.fillStyle(0xff4dbf, 0.84).fillCircle(centerX, horizonY - 28, 57);
    viewport.fillStyle(0x09041e, 0.5).fillRect(BOARD_X, horizonY, this.level.grid.width * CELL, 4);
    viewport.lineStyle(1, 0x36e6ff, 0.55);
    for (let lane = -7; lane <= 7; lane += 1) viewport.lineBetween(centerX, horizonY, centerX + lane * 75, bottomY);
    for (let depth = 1; depth <= 9; depth += 1) {
      const y = horizonY + (bottomY - horizonY) * (1 - depth / 10);
      viewport.lineBetween(BOARD_X, y, BOARD_X + this.level.grid.width * CELL, y);
    }
    viewport.lineStyle(2, 0xff65d5, 0.9).strokeRoundedRect(BOARD_X, BOARD_Y, this.level.grid.width * CELL, this.level.grid.height * CELL, 8);

    const head = this.snake[0].point;
    const forward = directionVector[this.direction];
    const lateral = { x: -forward.y, y: forward.x };
    const objects = [
      ...this.obstacles.map((obstacle) => ({ point: obstacle.position, color: obstacle.kind === "crystal" ? 0xae6eff : 0x544070, type: obstacle.kind === "crystal" ? "crystal" : "barrier" })),
      ...this.foods.map((food) => ({ point: food.position, color: food.color, type: "food" })),
      ...this.enemies.map((enemy) => ({ point: enemy.position, color: enemy.kind === "glitch" ? 0xff4fd8 : 0x41e1d0, type: "enemy" })),
    ].map((item) => ({
      ...item,
      distance: (item.point.x - head.x) * forward.x + (item.point.y - head.y) * forward.y,
      offset: (item.point.x - head.x) * lateral.x + (item.point.y - head.y) * lateral.y,
    })).filter((item) => item.distance > 0 && item.distance <= 18 && Math.abs(item.offset) <= 6)
      .sort((a, b) => b.distance - a.distance);

    objects.forEach((item) => {
      const progress = 1 - item.distance / 19;
      const x = centerX + item.offset * (25 + progress * 53);
      const y = horizonY + progress * (bottomY - horizonY - 45);
      const size = 12 + progress * 34;
      viewport.fillStyle(item.color, 0.25).fillCircle(x, y, size * 1.55);
      if (item.type === "barrier") {
        viewport.fillStyle(item.color, 1).fillRect(x - size, y - size, size * 2, size * 2);
        viewport.lineStyle(2, 0xbda7e8, 0.9).strokeRect(x - size, y - size, size * 2, size * 2);
        viewport.lineStyle(1, 0x251147, 0.7).lineBetween(x - size, y, x + size, y).lineBetween(x, y - size, x, y + size);
      } else if (item.type === "crystal") {
        viewport.fillStyle(item.color, 1).fillTriangle(x, y - size, x + size * 0.75, y + size, x - size * 0.75, y + size);
        viewport.lineStyle(2, 0xffffff, 0.7).strokeTriangle(x, y - size, x + size * 0.75, y + size, x - size * 0.75, y + size);
      } else if (item.type === "enemy") {
        viewport.fillStyle(item.color, 1).fillCircle(x, y, size * 0.65);
        viewport.fillStyle(0x18062e, 1).fillCircle(x - size * 0.22, y, size * 0.12).fillCircle(x + size * 0.22, y, size * 0.12);
        viewport.lineStyle(2, 0xffffff, 0.7).strokeCircle(x, y, size * 0.65);
      } else {
        viewport.fillStyle(item.color, 1).fillRoundedRect(x - size * 0.55, y - size * 0.55, size * 1.1, size * 1.1, 4);
        viewport.fillStyle(0xffffff, 0.45).fillCircle(x - size * 0.2, y - size * 0.2, size * 0.18);
        viewport.lineStyle(2, 0xffffff, 0.7).strokeRoundedRect(x - size * 0.55, y - size * 0.55, size * 1.1, size * 1.1, 4);
      }
    });
    const title = this.add.text(BOARD_X + 18, BOARD_Y + 17, "FIRST-PERSON RUN  //  FOLLOW THE GRID", { fontFamily: "monospace", fontSize: "16px", color: "#ffb3e7" });
    const legend = this.add.text(BOARD_X + 18, BOARD_Y + 42, "SQUARE: BARRIER   TRIANGLE: CRYSTAL   ORB: WOBBLER", { fontFamily: "monospace", fontSize: "12px", color: "#bdf8ff" });
    const controls = this.add.text(centerX, bottomY - 28, "<  TURN WITH WASD / ARROWS  >", { fontFamily: "monospace", fontSize: "15px", color: "#bdf8ff" }).setOrigin(0.5);
    layer.add([title, legend, controls]);
  }

  private foodColor(kind: string): number {
    return this.level.food.find((food) => food.kind === kind)?.color ?? 0xffdf4a;
  }

  getDebugState(): { firstPerson: boolean; perspectiveChildren: number; worldChildren: number; paused: boolean } {
    return {
      firstPerson: this.firstPerson,
      perspectiveChildren: this.firstPersonLayer?.length ?? 0,
      worldChildren: this.world.length,
      paused: this.paused,
    };
  }
}
