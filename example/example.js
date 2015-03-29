var createInfinite = require('../voxel-infinite.js')

var Viewer = require('mesh-viewer')
var mat4 = require('gl-mat4')
var ndarray = require('ndarray')
var createTileMap = require('gl-tile-map')
var terrain = require('isabella-texture-pack')
var createSelect = require('gl-select')
var createCamera = require('first-person-camera')
var createPhysics = require('voxel-physics-engine')

var select, texture, infinite, cam, physics, player
var shape = [32, 32, 32]
var TILE_COUNT = 16
var TILE_SIZE = Math.floor(terrain.shape[0] / TILE_COUNT)|0

var viewer = Viewer({
  clearColor: [0.2, 0.3, 0.8, 1],
  pointerLock: true,
})

function rand(min,max) {
  return Math.floor(Math.random()*(max-min+1)+min)
}

viewer.on('viewer-init', function() {
  var gl = this.gl
  this.camera = createCamera()

  var dist = 6
  infinite = createInfinite(gl, {
    generate: require('./perlin-generate.js'),
    distance: [ [-dist,-2,-dist], [dist,2,dist] ],
    //useWorker: false,
  })

  //Load texture map
  var tiles = ndarray(terrain.data,
    [16,16,terrain.shape[0]>>4,terrain.shape[1]>>4,4],
    [terrain.stride[0]*16, terrain.stride[1]*16, terrain.stride[0], terrain.stride[1], terrain.stride[2]], 0)
  texture = createTileMap(gl, tiles, 2)
  texture.magFilter = gl.NEAREST
  texture.minFilter = gl.NEAREST
  texture.mipSamples = 4
})

viewer.on('gl-render', function() {
  var gl = this.gl
  var A = mat4.create()

  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)

  infinite.draw({
    view: this.camera.view(),
    projection: mat4.perspective(A, Math.PI/4.0, this.width/this.height, 1.0, 1000.0),
    texture: texture,
    tileSize: TILE_SIZE,
    tileCount: TILE_COUNT,
  })
})

viewer.on('tick', function() {
  infinite.position(this.camera.position)
  if (this.pointerLock) {
    this.camera.control(this.frameTime, [
      this.down('W'), this.down('S'), this.down('A'), this.down('D'),
      this.down('space'), this.down('shift'),
    ], this.mouse, this.prevMouse)
  }
})
