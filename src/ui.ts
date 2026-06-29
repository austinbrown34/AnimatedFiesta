import { PALETTE } from "./state";

function hex(n: number): string {
  return "#" + n.toString(16).padStart(6, "0");
}

// HUD overlay. Owns the Fiesta Meter now; the intro/win screens and objective
// hints are layered on in task 7.
export class UI {
  private readonly meterFill: HTMLElement;
  private readonly meterPct: HTMLElement;
  private readonly worldName: HTMLElement;
  private readonly worldObjective: HTMLElement;
  private readonly bossBar: HTMLElement;
  private readonly bossFill: HTMLElement;
  private readonly winScreen: HTMLElement;
  private readonly restartBtn: HTMLButtonElement;
  private readonly introScreen: HTMLElement;
  private readonly crosshairDot: HTMLElement;
  private readonly aimLabel: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    const meter = document.createElement("div");
    meter.style.cssText = `
      position:absolute; top:18px; left:50%; transform:translateX(-50%);
      width:min(440px, 70vw); text-align:center; font-weight:bold;
      text-shadow:0 1px 3px rgba(0,0,0,0.6);`;
    meter.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:13px;
           letter-spacing:2px; margin-bottom:5px; opacity:0.95">
        <span>FIESTA METER</span><span data-pct>0%</span>
      </div>
      <div style="height:16px; border-radius:10px; background:rgba(255,255,255,0.12);
           border:1px solid rgba(255,255,255,0.25); overflow:hidden">
        <div data-fill style="height:100%; width:0%;
             background:linear-gradient(90deg, ${hex(PALETTE.cyan)}, ${hex(PALETTE.lime)},
             ${hex(PALETTE.yellow)}, ${hex(PALETTE.orange)}, ${hex(PALETTE.pink)});
             transition:width 0.3s ease"></div>
      </div>`;
    this.root.appendChild(meter);

    this.meterFill = meter.querySelector("[data-fill]") as HTMLElement;
    this.meterPct = meter.querySelector("[data-pct]") as HTMLElement;

    // World name + objective banner, just under the meter.
    const banner = document.createElement("div");
    banner.style.cssText = `
      position:absolute; top:52px; left:50%; transform:translateX(-50%);
      text-align:center; text-shadow:0 2px 6px rgba(0,0,0,0.7);`;
    banner.innerHTML = `
      <div data-world style="font-size:22px; font-weight:bold; letter-spacing:1px;
           color:${hex(PALETTE.yellow)}"></div>
      <div data-objective style="font-size:14px; opacity:0.9; margin-top:2px"></div>`;
    this.root.appendChild(banner);
    this.worldName = banner.querySelector("[data-world]") as HTMLElement;
    this.worldObjective = banner.querySelector("[data-objective]") as HTMLElement;

    // --- Boss bar (hidden until the Auditor appears) -----------------------
    this.bossBar = document.createElement("div");
    this.bossBar.style.cssText = `
      position:absolute; bottom:34px; left:50%; transform:translateX(-50%);
      width:min(520px, 80vw); text-align:center; font-weight:bold; display:none;
      text-shadow:0 1px 3px rgba(0,0,0,0.7);`;
    this.bossBar.innerHTML = `
      <div style="font-size:14px; letter-spacing:2px; margin-bottom:5px; color:${hex(PALETTE.pink)}">
        THE GREY AUDITOR — JOY RESISTANCE
      </div>
      <div style="height:18px; border-radius:10px; background:rgba(255,255,255,0.12);
           border:1px solid rgba(255,255,255,0.3); overflow:hidden">
        <div data-boss-fill style="height:100%; width:0%;
             background:linear-gradient(90deg, ${hex(PALETTE.purple)}, ${hex(PALETTE.pink)},
             ${hex(PALETTE.yellow)}); transition:width 0.15s ease"></div>
      </div>`;
    this.root.appendChild(this.bossBar);
    this.bossFill = this.bossBar.querySelector("[data-boss-fill]") as HTMLElement;

    // --- Win screen (hidden) ----------------------------------------------
    this.winScreen = document.createElement("div");
    this.winScreen.className = "clickable";
    this.winScreen.style.cssText = `
      position:absolute; inset:0; display:none; align-items:center; justify-content:center;
      flex-direction:column; gap:18px; text-align:center;
      background:radial-gradient(circle at 50% 40%, rgba(40,10,50,0.82), rgba(8,8,12,0.92));`;
    this.winScreen.innerHTML = `
      <div style="font-size:52px; font-weight:bold; color:${hex(PALETTE.yellow)};
           text-shadow:0 0 20px ${hex(PALETTE.pink)}">YOU SAVED THE FIESTA</div>
      <div style="font-size:20px; max-width:560px; line-height:1.5">
        The Grey Auditor is doing the worm. Joy has been deemed
        <i>fiscally responsible after all.</i> The universe is colorful again.
      </div>
      <button data-restart style="margin-top:8px; font:inherit; font-size:20px; font-weight:bold;
        color:#16161c; background:${hex(PALETTE.yellow)}; border:none; border-radius:30px;
        padding:14px 30px; cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,0.4)">
        🎉 Throw Another Fiesta</button>`;
    this.root.appendChild(this.winScreen);
    this.restartBtn = this.winScreen.querySelector("[data-restart]") as HTMLButtonElement;

    // --- Crosshair + aim label --------------------------------------------
    this.crosshairDot = document.createElement("div");
    this.crosshairDot.style.cssText = `position:absolute; left:50%; top:50%; width:8px; height:8px;
      transform:translate(-50%,-50%); border-radius:50%; pointer-events:none;
      background:${hex(PALETTE.pink)}; box-shadow:0 0 8px ${hex(PALETTE.pink)};
      transition:width 0.1s, height 0.1s, background 0.1s;`;
    this.root.appendChild(this.crosshairDot);

    this.aimLabel = document.createElement("div");
    this.aimLabel.style.cssText = `position:absolute; left:50%; top:calc(50% + 26px);
      transform:translateX(-50%); pointer-events:none; font-size:14px; font-weight:bold;
      color:#fff; text-shadow:0 1px 4px rgba(0,0,0,0.8); opacity:0; white-space:nowrap;
      transition:opacity 0.1s;`;
    this.root.appendChild(this.aimLabel);

    // --- Intro screen ------------------------------------------------------
    this.introScreen = document.createElement("div");
    this.introScreen.className = "clickable";
    this.introScreen.style.cssText = `position:absolute; inset:0; display:flex; align-items:center;
      justify-content:center; flex-direction:column; gap:14px; text-align:center; cursor:pointer;
      background:radial-gradient(circle at 50% 35%, rgba(30,8,46,0.92), rgba(8,8,12,0.97));`;
    this.introScreen.innerHTML = `
      <div style="font-size:18px; letter-spacing:6px; color:${hex(PALETTE.cyan)}">THE LAST PARTY ON EARTH</div>
      <div style="font-size:58px; font-weight:bold; letter-spacing:1px; color:${hex(PALETTE.pink)};
           text-shadow:0 0 24px ${hex(PALETTE.purple)}">ANIMATED FIESTA</div>
      <div style="font-size:18px; max-width:620px; line-height:1.6; margin-top:6px">
        The <b>Grey Auditor</b> has declared joy <i>fiscally irresponsible</i> and drained the
        color from the universe. You are the last <b style="color:${hex(PALETTE.yellow)}">Fiesta Director</b>.
        Your weapon: a confetti cannon. Your mission: cheer everything up.
      </div>
      <div style="font-size:15px; opacity:0.85; margin-top:10px; line-height:1.8">
        <b>WASD</b> move &nbsp;·&nbsp; <b>Mouse</b> look &nbsp;·&nbsp; <b>Click</b> to fire confetti<br>
        Fill the <b style="color:${hex(PALETTE.lime)}">FIESTA METER</b> to open the portal to the next world
      </div>
      <button data-begin style="margin-top:18px; font:inherit; font-size:22px; font-weight:bold;
        color:#16161c; background:${hex(PALETTE.yellow)}; border:none; border-radius:30px;
        padding:14px 34px; cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,0.45)">
        ▶ Begin the Fiesta</button>`;
    this.root.appendChild(this.introScreen);
  }

  /** Highlight the crosshair + show a label when aiming at something cheerable. */
  setAim(label: string | null): void {
    if (label) {
      this.crosshairDot.style.width = "16px";
      this.crosshairDot.style.height = "16px";
      this.crosshairDot.style.background = hex(PALETTE.yellow);
      this.aimLabel.textContent = label;
      this.aimLabel.style.opacity = "1";
    } else {
      this.crosshairDot.style.width = "8px";
      this.crosshairDot.style.height = "8px";
      this.crosshairDot.style.background = hex(PALETTE.pink);
      this.aimLabel.style.opacity = "0";
    }
  }

  showIntro(onBegin: () => void): void {
    this.introScreen.style.display = "flex";
    const begin = (e: Event) => {
      e.stopPropagation();
      onBegin();
    };
    (this.introScreen.querySelector("[data-begin]") as HTMLButtonElement).onclick = begin;
    this.introScreen.onclick = () => onBegin();
  }
  hideIntro(): void {
    this.introScreen.style.display = "none";
  }

  /** frac is 0..1 for the current world. */
  setFiesta(frac: number): void {
    const pct = Math.round(frac * 100);
    this.meterFill.style.width = `${pct}%`;
    this.meterPct.textContent = `${pct}%`;
  }

  setWorld(name: string, objective: string): void {
    this.worldName.textContent = name;
    this.worldObjective.textContent = objective;
  }

  /** When the portal opens, nudge the objective text. */
  setObjective(text: string): void {
    this.worldObjective.textContent = text;
  }

  showBossBar(): void {
    this.bossBar.style.display = "block";
  }
  hideBossBar(): void {
    this.bossBar.style.display = "none";
  }
  setBossJoy(frac: number): void {
    this.bossFill.style.width = `${Math.round(frac * 100)}%`;
  }

  showWin(onRestart: () => void): void {
    this.winScreen.style.display = "flex";
    this.restartBtn.onclick = onRestart;
  }
  hideWin(): void {
    this.winScreen.style.display = "none";
  }
}
