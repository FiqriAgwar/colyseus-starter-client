// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.32
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { Vector2DSchema } from './Vector2DSchema'

export class ProjectileSchema extends Schema {
    @type("boolean") public isSpawned!: boolean;
    @type("string") public id!: string;
    @type("uint16") public shooterId!: number;
    @type(Vector2DSchema) public position: Vector2DSchema = new Vector2DSchema();
    @type("number") public angle!: number;
    @type("number") public velocity!: number;
    @type("boolean") public hit!: boolean;
}
