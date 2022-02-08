import { Client, Room } from "colyseus.js";
import { GameObjects, Input, Scene, Scenes, Types } from "phaser";
import { ClassificationType } from "typescript";
import { SERVER_MSG } from "../Config/ServerMessage";
import { BattleSchema } from "../Schema/BattleSchema";
import PhysicsUtil from "../Util/Util";

export default class GameScene extends Scene {
  client!: Client;
  battleRoom?: Room;
  sessionId?: string;

  playerId!: number;
  player?: Types.Physics.Arcade.ImageWithDynamicBody;
  players!: Map<number, GameObjects.Image>;

  coins!: Map<number, GameObjects.Image>;

  bound = Math.pow(2, 12);
  cursors!: Types.Input.Keyboard.CursorKeys;
  gameHUD?: Scene;
  startButton?: GameObjects.Container;

  constructor() {
    super("GameScene");
  }

  // !* -------- INITIATION -------- *!

  init() {
    this.resetReference();

    this.playerId = (Math.floor(Math.random() * 1e5) + Date.now()) % 65000;

    this.client = new Client(`https://tank-server-26216.herokuapp.com/`);

    this.cameras.main.setBounds(0, 0, this.bound, this.bound);
    this.physics.world.setBounds(0, 0, this.bound, this.bound);

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  resetReference() {
    this.battleRoom = undefined;
    this.player = undefined;
    this.players = new Map<number, GameObjects.Image>();
    this.coins = new Map<number, GameObjects.Image>();
  }

  // !* -------- SETUP -------- *!

  create() {
    this.connect();
    this.setupRestartEvent();
  }

  async connect() {
    try {
      this.battleRoom = await this.client.joinOrCreate("battle_room");
    } catch (error) {
      console.log(error);
      throw new Error("An Error has been occured");
    }

    this.setupBattleRoomEvents();
    this.setupSpawnButton();
    this.sessionId = this.battleRoom.sessionId;
  }

  setupBattleRoomEvents() {
    if (!this.battleRoom) {
      return;
    }

    for (let i = 0; i < this.bound / 32; i++) {
      for (let j = 0; j < this.bound / 32; j++) {
        this.add.image(i * 32, j * 32, "grass", Math.floor(Math.random() * 64));
      }
    }

    this.battleRoom.onMessage(SERVER_MSG.PING, (message) => {
      this.battleRoom?.send(SERVER_MSG.PONG, message);
    });

    this.battleRoom.onMessage(SERVER_MSG.DESPAWN, (id: number) => {
      this.despawnPlayer(id);
    });

    this.battleRoom.onMessage(
      SERVER_MSG.COLLECTED,
      ({ coinId, nX, nY, playerId }) => {
        this.handleCoin(coinId, nX, nY);
        this.handlePlayerPoint(playerId);
      }
    );

    this.battleRoom.onMessage(
      SERVER_MSG.CRASH,
      ({ playerId, anotherPlayerId }) => {
        this.handlePlayerCrash(playerId);
        this.handlePlayerCrash(anotherPlayerId);
      }
    );

    this.battleRoom.onStateChange((state: BattleSchema) => {
      state.players.forEach((p) => {
        const { x, y } = p.position;
        p.isSpawned && this.handlePlayer(p.id, x, y, p.angle, p.point);
      });

      state.collectibles.forEach((c) => {
        const { x, y } = c.position;
        this.handleCoin(c.id, x, y);
      });
    });
  }

  despawnPlayer(id: number) {
    const player = this.players.get(id);
    player?.destroy();
    this.players.delete(id);
  }

  handlePlayer(id: number, x: number, y: number, angle: number, point: number) {
    if (this.players.has(id)) {
      if (id !== this.playerId) {
        this.handlePlayerTransform(id, x, y, angle);
      }

      this.players.get(id)?.setData("point", point);

      return;
    }

    let player;
    if (id === this.playerId) {
      player = this.physics.add.image(x, y, "tank"); //change to tank after spritesheet finished
      this.player = player;
      this.setupCameraFollow();
      this.setupPlayerHUD();
    } else {
      player = this.physics.add.image(x, y, "enemy"); //change to tank after spritesheet finished
    }

    if (player) {
      player.setOrigin(0.5);
      player.setScale(1.5);
      player.setData("id", id);
      player.setData("transform", { x, y, angle: 0 });
      player.setData("point", point);
      player.setData("alive", true);
      this.players.set(id, player);
    }
  }

  handleCoin(id: number, x: number, y: number) {
    if (this.coins.has(id)) {
      const coin = this.coins.get(id);
      coin?.setData("transform", { x, y });
      coin?.setPosition(x, y);
      return;
    }

    let coin;
    coin = this.physics.add.sprite(x, y, "coin");
    if (coin) {
      coin.setOrigin(0.5);
      coin.setScale(1.5);
      coin.setData("id", id);
      coin.setData("transform", { x, y });
      if (this.startButton?.active) {
        this.children.moveBelow(coin, this.startButton);
      }
      this.coins.set(id, coin);
    }

    this.anims.create({
      key: "coin",
      frames: this.anims.generateFrameNumbers("coin", { start: 0, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    coin.play("coin", true);
  }

  handlePlayerTransform(id: number, x: number, y: number, angle: number) {
    const player = this.players.get(id);
    player?.setData("transform", { x, y, angle });
  }

  handlePlayerPoint(id: number) {
    const player = this.players.get(id);
    player?.setData("point", player.getData("point") + 1);
  }

  handlePlayerCrash(id: number) {
    const player = this.players.get(id);
    player?.setData("alive", false);

    if (player?.getData("id") == this.playerId) {
      this.player?.setData("alive", false);
    }

    player?.setTexture("crashed");
  }

  setupCameraFollow() {
    if (!this.player || !this.battleRoom) {
      return;
    }

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  setupPlayerHUD() {
    this.scene.launch("GameHUD", {
      player: this.player,
      players: this.players,
      scene: this,
    });
    this.gameHUD = this.scene.get("GameHUD");
  }

  setupSpawnButton() {
    const screenCenterX =
      this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const screenCenterY =
      this.cameras.main.worldView.y + this.cameras.main.height / 2;

    const rectangle = this.add.rectangle(0, 0, 300, 150, 0x069420, 1);
    const spawnText = this.add
      .text(0, 0, "START GAME", {
        fontSize: "32px",
        wordWrap: { width: 200 },
        align: "center",
      })
      .setOrigin(0.5);
    this.startButton = this.add.container(screenCenterX, screenCenterY, [
      rectangle,
      spawnText,
    ]);

    rectangle.setInteractive().on(Input.Events.POINTER_DOWN, () => {
      if (!this.battleRoom) {
        return;
      }

      this.spawnPlayer();
      this.startButton?.destroy();
    });

    this.children.bringToTop(this.startButton);
    this.children.bringToTop(rectangle);
    this.children.bringToTop(spawnText);
  }

  spawnPlayer() {
    const data = {
      id: this.playerId,
      x: Math.floor(Math.random() * this.bound),
      y: Math.floor(Math.random() * this.bound),
    };

    this.battleRoom?.send("spawn", data);
    this.player?.setData("alive", true);
  }

  setupRestartEvent() {
    this.input.keyboard.removeListener("keyup-R", this.restartScene, this);
    this.input.keyboard.once("keyup-R", this.restartScene, this);
  }

  restartScene() {
    this.goToNextScene("GameScene");
  }

  goToNextScene(scene: string, data?: object) {
    this.battleRoom?.leave();
    this.player?.destroy();
    this.players = new Map();
    this.resetReference();
    this.scene.start(scene, data);
  }

  // !* -------- UPDATE CONTROL -------- *!
  update() {
    this.updatePlayerPosition(0.333);

    if (!this.player?.active) {
      return;
    }

    if (this.player?.getData("alive")) {
      this.player.setVelocity(0);

      this.handleInputUser();
      this.checkCoinIntersect();
      this.checkPlayerIntersect();
    } else {
      // const randomMove = this.player.getData("randomMove");
      // if (!randomMove) {
      //   const x = Math.floor(Math.random() * 150) - 75;
      //   const y = Math.floor(Math.random() * 150) - 75;
      //   this.player.setVelocity(x, y);
      //   this.player.setData("randomMove", { x, y });
      // }
    }

    this.sendPlayerTransform();
  }

  updatePlayerPosition(percentage: number) {
    this.players?.forEach((player) => {
      const id = player.getData("id") as number;
      if (id === this.playerId || !player) {
        return;
      }

      const {
        x: nX,
        y: nY,
        angle: nAngle,
      } = (player.getData("transform") as {
        x: number;
        y: number;
        angle: number;
      }) || {};

      const { x, y } = player;
      player.setPosition(
        Phaser.Math.Linear(x, nX, percentage),
        Phaser.Math.Linear(y, nY, percentage)
      );

      player.setAngle(nAngle || 0);

      if (!player.getData("alive")) {
        var transform = player.getData("transform");
        var fire = this.add.sprite(transform.x, transform.y, "fire");
        this.anims.create({
          key: "fire",
          frames: this.anims.generateFrameNumbers("fire", { start: 0, end: 3 }),
          frameRate: 10,
          repeat: -1,
        });

        fire.play("fire", true);
      }
    });
  }

  handleInputUser() {
    const left = this.cursors.left.isDown;
    const right = this.cursors.right.isDown;
    const up = this.cursors.up.isDown;
    const down = this.cursors.down.isDown;

    var rotation = this.player?.angle;
    var velocityX = 0;
    var velocityY = 0;

    if (left) {
      rotation = -90;
      velocityX = -200;
      if (up) {
        rotation += 45;
        velocityY = -100 * Math.sqrt(2);
        velocityX = -100 * Math.sqrt(2);
      } else if (down) {
        rotation -= 45;
        velocityY = 100 * Math.sqrt(2);
        velocityX = -100 * Math.sqrt(2);
      }
    } else if (right) {
      rotation = 90;
      velocityX = 200;
      if (up) {
        rotation -= 45;
        velocityY = -100 * Math.sqrt(2);
        velocityX = 100 * Math.sqrt(2);
      } else if (down) {
        rotation += 45;
        velocityY = 100 * Math.sqrt(2);
        velocityX = 100 * Math.sqrt(2);
      }
    }

    if (down) {
      rotation = -180;
      velocityY = 200;
      if (left) {
        rotation += 45;
        velocityY = 100 * Math.sqrt(2);
        velocityX = -100 * Math.sqrt(2);
      } else if (right) {
        rotation -= 45;
        velocityY = 100 * Math.sqrt(2);
        velocityX = 100 * Math.sqrt(2);
      }
    } else if (up) {
      rotation = 0;
      velocityY = -200;
      if (left) {
        rotation -= 45;
        velocityY = -100 * Math.sqrt(2);
        velocityX = -100 * Math.sqrt(2);
      } else if (right) {
        rotation += 45;
        velocityY = -100 * Math.sqrt(2);
        velocityX = 100 * Math.sqrt(2);
      }
    }

    this.player?.setVelocity(velocityX, velocityY).setAngle(rotation);

    if (this.player?.active) {
      if (this.player.x < 0) {
        this.player.x = 0;
      }

      if (this.player.x >= this.bound) {
        this.player.x = this.bound;
      }

      if (this.player.y < 0) {
        this.player.y = 0;
      }

      if (this.player.y >= this.bound) {
        this.player.y = this.bound;
      }
    }
  }

  checkCoinIntersect() {
    this.coins.forEach((c) => {
      if (PhysicsUtil.Intersect(c, this.player as GameObjects.GameObject, 50)) {
        var coinId = c.getData("id");

        const data = {
          coinId,
        };

        this.battleRoom?.send(SERVER_MSG.COLLECTED, data);
      }
    });
  }

  checkPlayerIntersect() {
    this.players.forEach((p) => {
      if (
        p.getData("id") !== this.playerId &&
        PhysicsUtil.Intersect(p, this.player as GameObjects.GameObject, 75)
      ) {
        var enemyId = p.getData("id");

        const data = {
          enemyId,
        };

        this.battleRoom?.send(SERVER_MSG.CRASH, data);
      }
    });
  }

  sendPlayerTransform() {
    if (!this.player?.active || !this.battleRoom) {
      return;
    }

    const data = {
      x: this.player.x,
      y: this.player.y,
      angle: this.player.angle,
    };

    const lastMove = this.player.getData("lastMove");

    if (
      !lastMove ||
      lastMove.x !== data.x ||
      lastMove.y !== data.y ||
      lastMove.angle !== data.angle
    ) {
      try {
        this.battleRoom.send("move", data);
        this.player.setData("lastMove", data);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
