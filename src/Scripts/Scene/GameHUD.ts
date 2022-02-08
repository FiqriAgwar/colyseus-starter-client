import { Scene, GameObjects, Types } from "phaser";
import { idText, Type } from "typescript";

export default class GameHUD extends Scene {
  constructor() {
    super("GameHUD");
  }

  player?: Types.Physics.Arcade.ImageWithDynamicBody;
  players!: Map<number, GameObjects.Image>;

  playerCoord!: GameObjects.Text;
  playersPoint!: GameObjects.Text;

  leaderboard!: Array<PlayerScore>;
  updateLeader!: Phaser.Time.TimerEvent;

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

    this.updateLeader = this.time.addEvent({
      delay: 500,
      callback: this.updatePlayersPoint,
      callbackScope: this,
      loop: true,
    });
  }

  update() {
    this.updatePlayerCoordinate();
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
    if (!this.leaderboard) {
      this.leaderboard = new Array<PlayerScore>();

      this.players.forEach((p) => {
        if (p.getData("id")) {
          this.setLeaderboard(p);
        }
      });
    } else {
      this.players.forEach((p) => {
        if (this.searchLeaderboard(p.getData("id"))) {
          if (this.getPoint(p.getData("id")) !== p.getData("point")) {
            this.setLeaderboard(p);
          }
        } else {
          let newData = {
            user: p.getData("id"),
            point: p.getData("point"),
          };
          this.setLeaderboard(p);
        }
      });
    }
  }

  searchLeaderboard(id: string): boolean {
    this.leaderboard?.forEach((p) => {
      if (p.user == id) {
        return true;
      }
    });

    return false;
  }

  getPoint(id: string): number {
    this.leaderboard?.forEach((p) => {
      if (p.user == id) {
        return p.point;
      }
    });

    return 0;
  }

  setLeaderboard(player: GameObjects.Image) {
    let i = 0,
      found = false;
    while (i < this.leaderboard.length && !found) {
      if (this.leaderboard[i].user === player.getData("id")) {
        found = true;
      } else {
        i++;
      }
    }

    if (found) {
      this.leaderboard[i].point = player.getData("point");
    } else {
      let newData = {
        user: player.getData("id"),
        point: player.getData("point"),
      };
      this.leaderboard.push(newData);
    }

    this.updateTextLeaderboard();
  }

  sortLeaderboard() {
    for (let i = 0; i < this.leaderboard?.length; i++) {
      for (let j = i; j < this.leaderboard?.length; j++) {
        if (this.leaderboard[i].point <= this.leaderboard[j].point) {
          let temp = this.leaderboard[i];
          this.leaderboard[i] = this.leaderboard[j];
          this.leaderboard[j] = temp;
        }
      }
    }
  }

  updateTextLeaderboard() {
    let leaderboardText = `\n`;
    this.sortLeaderboard();

    for (let i = 0; i < this.leaderboard.length; i++) {
      if (this.leaderboard[i].user === this.player?.getData("id")) {
        leaderboardText += `${i + 1}. You - `;
      } else {
        leaderboardText += `${i + 1}. ${this.leaderboard[i].user} - `;
      }

      leaderboardText += `${this.leaderboard[i].point}\n`;
    }

    if (this.playersPoint.getData("leader") !== leaderboardText) {
      this.playersPoint.setText(`Leaderboard: ${leaderboardText}`);
      this.playersPoint.setData("leader", leaderboardText);
    }
  }
}

interface PlayerScore {
  user: string;
  point: number;
}
