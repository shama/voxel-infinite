var createInfinite = require('../voxel-infinite.js')

var Viewer = require('mesh-viewer')
var mat4 = require('gl-mat4')
var ndarray = require('ndarray')
var createTileMap = require('gl-tile-map')
var terrain = require('isabella-texture-pack')
var createSelect = require('gl-select')
var createCamera = require('first-person-camera')

var select, texture, infinite, cam
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

  infinite = createInfinite(gl, {
    generate: require('./perlin-generate.js')
  })
  infinite.position([0,0,0])
  var idx = 10

  setInterval(function() {
    infinite.position(this.camera.position)
  }.bind(this), 500)

  var i = 0
  setInterval(function() {
    var x = rand(-10, 10)
    var y = rand(-10, 10)
    var z = rand(-10, 10)
    //console.log('set', [x,y,z])
    //infinite.setBlock([x,y,z], (15<<1) + rand(1,100))
    var pos = [i,1,1]
    if (pos[0] === 0 || pos[0] === 31) idx = 0
    else idx = i + 0

    infinite.setBlock(pos, (15<<1) + idx)
    //console.log(pos, idx + i)
    i++
  }, 1000)

  //select = createSelect(gl, [this.width, this.height])

  //Load texture map
  var tiles = ndarray(terrain.data,
    [16,16,terrain.shape[0]>>4,terrain.shape[1]>>4,4],
    [terrain.stride[0]*16, terrain.stride[1]*16, terrain.stride[0], terrain.stride[1], terrain.stride[2]], 0)
  texture = createTileMap(gl, tiles, 2)
  //texture.magFilter = gl.LINEAR
  //texture.minFilter = gl.LINEAR_MIPMAP_LINEAR
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

  // select.shape = [this.width, this.height]
  // select.begin(this.mouse[0], this.mouse[1], 30)
  // gl.clearColor(0.2, 0.3, 0.8, .2)
  // gl.clear(gl.COLOR_BUFFER_BIT)
  // var found = select.end()
  // if (found)
  //   console.log(found.coord, found.value, found.id, found.distance)
})

viewer.on('tick', function() {
  if (this.pointerLock) {
    this.camera.control(this.frameTime, [
      this.down('W'), this.down('S'), this.down('A'), this.down('D'),
      this.down('space'), this.down('shift'),
    ], this.mouse, this.prevMouse)
  }
})
