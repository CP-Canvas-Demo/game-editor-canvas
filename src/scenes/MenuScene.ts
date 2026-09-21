import Phaser from "phaser";
import { LEVELS } from "../game/levels";
import { loadBestScores, loadProgressionMode, saveProgressionMode } from "../game/storage";
import type { ProgressionMode } from "../game/storage";
import type { LevelDefinition } from "../game/types";

interface LevelCard {
  panel: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  meta: Phaser.GameObjects.Text;
}

const CARD_WIDTH = 900;
const CARD_HEIGHT = 96;
const CARD_X = 640;
const FIRST_CARD_Y = 250;
const CARD_GAP = 112;

export class MenuScene extends Phaser.Scene {
  private selected = 0;
  private mode: ProgressionMode = "campaign";
  private cards: LevelCard[] = [];
  private modeText!: Phaser.GameObjects.Text;

  constructor() {
    super("menu");
  }

  create(): void {
    this.selected = 0;
    this.cards = [];
    this.mode = loadProgressionMode();
    this.cameras.main.setBackgroundColor("#09051f");
    this.drawBackdrop();

    this.add.text(640, 92, "NEON TRAIL", {
      fontFamily: "Trebuchet MS", fontStyle: "bold", fontSize: "62px", color: "#ff65d5",
    }).setOrigin(0.5);
    this.add.text(640, 142, "CHOOSE YOUR SIGNAL", {
      fontFamily: "monospace", fontSize: "18px", color: "#bdf8ff",
    }).setOrigin(0.5);

    const bestScores = loadBestScores();
    LEVELS.forEach((level, index) => this.cards.push(this.createCard(level, index, bestScores[level.id])));

    this.modeText = this.add.text(640, 604, "", {
      fontFamily: "monospace", fontSize: "18px", color: "#f7eaff", align: "center", lineSpacing: 6,
    }).setOrigin(0.5);

    this.add.text(640, 672, "[UP/DOWN or W/S] SELECT   [ENTER] PLAY   [M] TOGGLE PROGRESSION", {
      fontFamily: "monospace", fontSize: "15px", color: "#8fb7d9",
    }).setOrigin(0.5);

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.handleKey(event));
    this.refresh();
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0b0624, 0x0b0624, 0x26063d, 0x26063d, 1);
    graphics.fillRect(0, 0, 1280, 720);
    graphics.lineStyle(1, 0xb442ff, 0.22);
    for (let y = 500; y < 720; y += 26) graphics.lineBetween(0, y, 1280, y);
    graphics.fillStyle(0xff3ebf, 0.22);
    graphics.fillCircle(640, 40, 132);
  }

  private createCard(level: LevelDefinition, index: number, best: number | undefined): LevelCard {
    const y = FIRST_CARD_Y + index * CARD_GAP;
    const panel = this.add.rectangle(CARD_X, y, CARD_WIDTH, CARD_HEIGHT, 0x150a35, 0.95).setStrokeStyle(2, 0x3b295d);
    panel.setInteractive({ useHandCursor: true });
    panel.on("pointerover", () => {
      this.selected = index;
      this.refresh();
    });
    panel.on("pointerdown", () => this.startLevel(index));

    const title = this.add.text(CARD_X - CARD_WIDTH / 2 + 26, y - 30, `${index + 1}. ${level.name.toUpperCase()}`, {
      fontFamily: "Trebuchet MS", fontStyle: "bold", fontSize: "26px", color: "#fff6ff",
    });
    const meta = this.add.text(CARD_X - CARD_WIDTH / 2 + 26, y + 4, this.describeLevel(level, best), {
      fontFamily: "monospace", fontSize: "14px", color: "#bdf8ff", lineSpacing: 4,
    });
    return { panel, title, meta };
  }

  private describeLevel(level: LevelDefinition, best: number | undefined): string {
    const objective = this.objectiveText(level);
    const grid = `${level.grid.width}x${level.grid.height}`;
    const bestText = best === undefined ? "BEST --" : `BEST ${best.toString().padStart(5, "0")}`;
    return `${level.subtitle}\n${objective}   GRID ${grid}   SPEED ${level.speedMs}ms   ${bestText}`;
  }

  private objectiveText(level: LevelDefinition): string {
    const objective = level.objective;
    if (objective.type === "score") return `OBJECTIVE REACH ${objective.target} PTS`;
    if (objective.type === "clear-crystals") return `OBJECTIVE CLEAR ${objective.target} CRYSTALS`;
    return `OBJECTIVE COLLECT ${objective.target} x ${(objective.foodId ?? "").toUpperCase()}`;
  }

  private handleKey(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === "arrowdown" || key === "s") {
      this.selected = (this.selected + 1) % LEVELS.length;
      this.refresh();
      return;
    }
    if (key === "arrowup" || key === "w") {
      this.selected = (this.selected - 1 + LEVELS.length) % LEVELS.length;
      this.refresh();
      return;
    }
    if (key === "m") {
      this.mode = this.mode === "campaign" ? "single" : "campaign";
      saveProgressionMode(this.mode);
      this.refresh();
      return;
    }
    if (key === "enter" || key === " ") this.startLevel(this.selected);
  }

  private refresh(): void {
    this.cards.forEach((card, index) => {
      const active = index === this.selected;
      card.panel.setStrokeStyle(active ? 3 : 2, active ? 0x36e6ff : 0x3b295d);
      card.panel.setFillStyle(active ? 0x201048 : 0x150a35, active ? 1 : 0.95);
      card.title.setColor(active ? "#ff65d5" : "#fff6ff");
    });
    this.modeText.setText(
      this.mode === "campaign"
        ? "PROGRESSION: CAMPAIGN  //  finishing a level rolls straight into the next one, score carries over"
        : "PROGRESSION: SINGLE LEVEL  //  finishing a level returns you here, score resets each run",
    );
    this.modeText.setColor(this.mode === "campaign" ? "#ffd76a" : "#8ef2d0");
  }

  private startLevel(index: number): void {
    const level = LEVELS[index];
    if (!level) return;
    this.scene.start("game", { levelId: level.id, mode: this.mode });
  }
}
