import { Scene, GameObjects, Types } from "phaser";
import { Type } from "typescript";

export default class GameHUD extends Scene {
  constructor() {
    super("GameHUD");
  }

  player?: Types.Physics.Arcade.ImageWithDynamicBody;
  players!: Map<number, GameObjects.Image>;

  playerCoord!: GameObjects.Text;
  playersPoint!: GameObjects.Text;

  init(data: {
    player: Types.Physics.Arcade.ImageWithDynamicBody;
    players: Map<number, GameObjects.Image>;
  }) {
    this.player = data.player;
    this.players = data.players;

    console.log(this.players);
  }

  create() {
    this.playerCoord = this.add
      .text(0, 0, "Player coordinate:", {
        font: "16px Arial",
      })
      .setOrigin(0);

    this.playersPoint = this.add
      .text(700, 0, "Leaderboards:", {
        font: "16px Arial",
      })
      .setOrigin(0);
  }

  update() {
    this.updatePlayerCoordinate();
    this.updatePlayersPoint();
  }

  updatePlayerCoordinate() {
    const { x, y } = this.player?.active ? this.player : { x: 0, y: 0 };
    const data = this.playerCoord.getData("data");
    const next = `${x.toFixed(0)}, ${y.toFixed(0)}`;

    if (data !== next) {
      this.playerCoord.setData("data", next);
      this.playerCoord.setText(`Player coordinate: ${next}`);
    }
  }

  updatePlayersPoint() {
    var leaderboard = `\n`;
    this.players.forEach((p) => {
      if (p.getData("id")) {
        leaderboard += `Guest${p.getData("id")} - ${p.getData("point")}\n`;
      }
    });

    this.playersPoint.setText(`Leaderboard: ${leaderboard}`);
  }
}
