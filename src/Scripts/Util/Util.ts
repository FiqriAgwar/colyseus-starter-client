import { GameObjects } from "phaser";

class PhysicsUtil {
  public static Distance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }
  public static Intersect(
    g1: GameObjects.GameObject,
    g2: GameObjects.GameObject,
    threshold: number
  ): boolean {
    return (
      this.Distance(
        g1.body.position.x,
        g1.body.position.y,
        g2.body.position.x,
        g2.body.position.y
      ) <= threshold
    );
  }
}

export default PhysicsUtil;
