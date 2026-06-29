import { PALETTE } from "./state";

function hex(n: number): string {
  return "#" + n.toString(16).padStart(6, "0");
}

// HUD overlay. Owns the Fiesta Meter now; the intro/win screens and objective
// hints are layered on in task 7.
export class UI {
  private readonly meterFill: HTMLElement;
  private readonly meterPct: HTMLElement;

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
  }

  /** frac is 0..1 for the current world. */
  setFiesta(frac: number): void {
    const pct = Math.round(frac * 100);
    this.meterFill.style.width = `${pct}%`;
    this.meterPct.textContent = `${pct}%`;
  }
}
