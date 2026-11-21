// Wanted level as a state machine: crimes add heat, hiding cools it, capture and death resolve it.
export function createWantedSystem() {
  return {
    stars: 0, heat: 0, hiddenTimer: 0, bustTimer: 0, lastCrime: '',
    commitCrime(points, label) {
      this.heat = Math.min(100, this.heat + points); this.lastCrime = label; this.hiddenTimer = 0;
      this.stars = Math.max(this.stars, Math.min(5, Math.ceil(this.heat / 20)));
    },
    setStars(stars, label = 'Police attention') { this.stars = Math.max(this.stars, Math.min(5, stars)); this.heat = Math.max(this.heat, this.stars * 20 - 8); this.lastCrime = label; },
    clear() { this.stars = 0; this.heat = 0; this.bustTimer = 0; this.hiddenTimer = 0; },
    update(delta, seenByPolice) {
      if (this.stars <= 0) return;
      if (seenByPolice) this.hiddenTimer = 0;
      else {
        this.hiddenTimer += delta;
        if (this.hiddenTimer > 4.2) {
          this.heat -= delta * 7.5;
          const cooled = Math.max(0, Math.ceil(this.heat / 20));
          if (cooled < this.stars) this.stars = cooled;
          if (this.heat <= 0) this.clear();
        }
      }
    },
    starText() { return '★'.repeat(this.stars) + '☆'.repeat(5 - this.stars); },
  };
}
