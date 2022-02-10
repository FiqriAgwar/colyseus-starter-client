// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.32
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { PlayerSchema } from './PlayerSchema'
import { CollectibleSchema } from './CollectibleSchema'
import { ProjectileSchema } from './ProjectileSchema'

export class BattleSchema extends Schema {
    @type({ map: PlayerSchema }) public players: MapSchema<PlayerSchema> = new MapSchema<PlayerSchema>();
    @type({ map: CollectibleSchema }) public collectibles: MapSchema<CollectibleSchema> = new MapSchema<CollectibleSchema>();
    @type({ map: ProjectileSchema }) public projectiles: MapSchema<ProjectileSchema> = new MapSchema<ProjectileSchema>();
}
