import { Client, Room } from "colyseus.js";
import { GameObjects, Input, Scene, Scenes, Types } from 'phaser';
import { SERVER_MSG } from "../Config/ServerMessage";
import { BattleSchema } from "../Schema/BattleSchema";

export default class GameScene extends Scene {
  client!: Client;
  battleRoom?: Room;
  sessionId?: string;

  playerId!: number;
  player?: Types.Physics.Arcade.ImageWithDynamicBody;
  players!: Map<number, GameObjects.Image>;

  bound = Math.pow(2,12);
  cursors!: Types.Input.Keyboard.CursorKeys;
  gameHUD?: Scene;

  constructor(){
    super('GameScene');
  }

  // !* -------- INITIATION -------- *!

  init(){
    this.resetReference();

    this.playerId = (Math.floor(Math.random() * 1e5) + Date.now()) % 65000;

    this.client = new Client(`ws://${window.location.hostname}:2567`);

    this.cameras.main.setBounds(0, 0, this.bound, this.bound);
    this.physics.world.setBounds(0, 0, this.bound, this.bound);

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  resetReference(){
    this.battleRoom = undefined;
    this.player = undefined;
    this.players = new Map<number, GameObjects.Image>();
  }

  // !* -------- SETUP -------- *!

  create() {
    this.connect();
    this.setupRestartEvent();
  }

  async connect() {
    try {
      this.battleRoom = await this.client.joinOrCreate('battle_room');
    }
    catch (error) {
      throw new Error("An Error has been occured");
    }

    this.setupBattleRoomEvents();
    this.setupSpawnButton();
    this.sessionId = this.battleRoom.sessionId;
  }

  setupBattleRoomEvents() {
    if(!this.battleRoom){
      return;
    }

    this.battleRoom.onMessage(SERVER_MSG.PING, (message) => {
      this.battleRoom?.send(SERVER_MSG.PONG, message);
    });

    this.battleRoom.onMessage(SERVER_MSG.DESPAWN, (id: number) => {
      this.despawnPlayer(id);
    });

    this.battleRoom.onStateChange((state: BattleSchema) => {
      state.players.forEach((p) => {
        const { x, y } = p.position;
        p.isSpawned && this.handlePlayer(p.id, x, y, p.angle);
      })
    })
  }

  despawnPlayer(id : number){
    const player = this.players.get(id);
    player?.destroy();
    this.players.delete(id);
  }

  handlePlayer(id: number, x: number, y: number, angle: number){
    if(this.players.has(id)){
      if(id !== this.playerId){
        this.handlePlayerTransform(id, x, y, angle);
      }

      return;
    }

    let player;
    if(id === this.playerId){
      player = this.physics.add.image(x, y, 'tanks'); //change to tank after spritesheet finished
      this.player = player;
      this.setupCameraFollow();
      this.setupPlayerHUD();
    }
    else {
      player = this.physics.add.image(x, y, 'tanks'); //change to tank after spritesheet finished
    }

    if(player){
      player.setOrigin(0.5);
      player.setData('id', id);
      player.setData('transform', {x, y, angle: 0});
      this.players.set(id, player);
    }
  }

  handlePlayerTransform(id: number, x: number, y: number, angle: number) {
    const player = this.players.get(id);
    player?.setData('transform', {x, y, angle});
  }

  setupCameraFollow() {
    if(!this.player || !this.battleRoom){
      return;
    }

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  setupPlayerHUD() {
    this.scene.launch('GameHUD', {player: this.player, scene: this});
    this.gameHUD = this.scene.get('GameHUD');
  }

  setupSpawnButton() {
    const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
  }

  setupRestartEvent() {
    this.input.keyboard.removeListener('keyup-R', this.restartScene, this);
    this.input.keyboard.once('keyup-R', this.restartScene, this);
  }

  restartScene() {
    this.goToNextScene('GameScene');
  }

  goToNextScene(scene: string, data? : object) {
    this.battleRoom?.leave();
    this.player?.destroy();
    this.players = new Map();
    this.resetReference();
    this.scene.start(scene, data);
  }

  // !* -------- UPDATE CONTROL -------- *!

}