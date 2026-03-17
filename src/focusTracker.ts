import { FocusEvent } from "./types";
import { v4 as uuidv4 } from "uuid";

export class FocusTracker {
  private events: FocusEvent[] = [];
  private lossCount = 0;
  private onFocusLoss: (event: FocusEvent) => void;

  constructor(onFocusLoss: (event: FocusEvent) => void) {
    this.onFocusLoss = onFocusLoss;
  }

  start() {
    window.addEventListener("blur", this.handleBlur);
    window.addEventListener("focus", this.handleFocus);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    document.addEventListener("mouseleave", this.handleMouseLeave);
    document.addEventListener("mouseenter", this.handleMouseEnter);
  }

  stop() {
    window.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("focus", this.handleFocus);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    document.removeEventListener("mouseleave", this.handleMouseLeave);
    document.removeEventListener("mouseenter", this.handleMouseEnter);
  }

  private handleBlur = () => {
    this.recordEvent("blur", "Ablak elvesztette a fókuszt");
  };

  private handleMouseLeave = (e: MouseEvent) => {
    // Only trigger if the mouse actually left the browser viewport
    if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth - 1 || e.clientY >= window.innerHeight - 1) {
      this.recordEvent("blur", "Egér elhagyta az ablakot (lehetséges megosztott képernyő)");
    }
  };

  private handleMouseEnter = () => {
    this.recordEvent("focus", "Egér visszatért az ablakba", false);
  };

  private handleFocus = () => {
    this.recordEvent("focus", "Ablak visszakapta a fókuszt", false);
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      this.recordEvent("visibilitychange", "Lap rejtve lett");
    } else {
      this.recordEvent("visibilitychange", "Lap újra látható", false);
    }
  };

  private handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      this.recordEvent("fullscreenchange", "Kilépett a teljes képernyőből");
    }
  };

  private recordEvent(type: "blur" | "visibilitychange" | "focus" | "fullscreenchange", detail: string, isLoss = true) {
    if (isLoss) {
      this.lossCount++;
    }
    const event: FocusEvent = {
      id: uuidv4(),
      type,
      timestamp: Date.now(),
      detail,
    };
    this.events.push(event);
    if (isLoss) {
      this.onFocusLoss(event);
    }
  }

  getLossCount() {
    return this.lossCount;
  }

  getEvents() {
    return this.events;
  }
}
