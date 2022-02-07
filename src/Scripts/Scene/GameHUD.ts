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
    var points = new Array<number>();
    var user = new Array<string>();

    this.players.forEach((p) => {
      if (p.getData("id")) {
        points.push(p.getData("point"));
        user.push(p.getData("id"));
      }
    });

    for (let i = 0; i < points.length; i++) {
      for (let j = i; j < points.length; j++) {
        if (points[i] <= points[j]) {
          var pts_temp = points[i];
          points[i] = points[j];
          points[j] = pts_temp;

          var user_temp = user[i];
          user[i] = user[j];
          user[j] = user_temp;
        }
      }
    }

    for (let i = 0; i < points.length; i++) {
      if (user[i] == this.player?.getData("id")) {
        leaderboard += `${i + 1}. You - ${points[i]}\n`;
      } else {
        leaderboard += `${i + 1}. Guest${user[i]} - ${points[i]}\n`;
      }
    }

    this.playersPoint.setText(`Leaderboard: ${leaderboard}`);
  }
}
