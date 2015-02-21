var createInfinite = require('../voxel-infinite.js')

var Viewer = require('mesh-viewer')
var mat4 = require('gl-mat4')
var ndarray = require('ndarray')
var createTileMap = require('gl-tile-map')
var terrain = require('isabella-texture-pack')
var createSelect = require('gl-select')
var createCamera = require('voxel-player-camera')
var createCam = require('game-shell-fps-cam')

var select, texture, infinite, cam
var shape = [32, 32, 32]
var TILE_COUNT = 16
var TILE_SIZE = Math.floor(terrain.shape[0] / TILE_COUNT)|0

var viewer = Viewer({
  useCellNormals: false,
  meshColor: [.8, .8, .8],
  specular: [0.3, 0.3, 0.3],
  ambient: [1, 1, 1],
  clearColor: [0.2, 0.3, 0.8, 1],
  pointerLock: true,
})

function rand(min,max) {
  return Math.floor(Math.random()*(max-min+1)+min)
}

viewer.on('viewer-init', function() {
  var gl = this.gl

  this.camera = createCamera()
  //this.camera = createCam(this)

  infinite = createInfinite(gl, {
    generator: function(i,j,k) {
      var x = i - 16
      var y = j - 16
      var z = k - 16
      if (x*x+y*y+z*z < 30) {
        return 1
      }  
      return 0
    }
    // generate: function(pos, shape) {
    //   var msg = { pos: new Int8Array(pos), shape: new Int8Array(shape) }
    //   worker.postMessage(msg, [msg.pos.buffer, msg.shape.buffer])
    // },
  })
  infinite.position([0,0,0])

  setInterval(function() {
    infinite.position(this.camera.position())
    //infinite.position(this.camera.position)
  }.bind(this), 500)

  setInterval(function() {
    var x = rand(-50, 50)
    var y = rand(-50, 50)
    var z = rand(-50, 50)
    //console.log('set', [x,y,z])
    infinite.setBlock([x,y,z], 1+(15<<1))
  }, 200)

  //select = createSelect(gl, [this.width, this.height])

  //var c = [shape[0]>>>1, shape[1]>>>1, shape[2]>>>1]
  //this.camera.lookAt([c[0], c[1], c[2]+2*shape[2]], c, [0,1,0])

  //Load texture map
  var tiles = ndarray(terrain.data,
    [16,16,terrain.shape[0]>>4,terrain.shape[1]>>4,4],
    [terrain.stride[0]*16, terrain.stride[1]*16, terrain.stride[0], terrain.stride[1], terrain.stride[2]], 0)
  texture = createTileMap(gl, tiles, 2)
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
  this.camera.move([
    this.down('W'), this.down('S'),
    this.down('A'), this.down('D'),
    this.down('space'), this.down('shift'),
  ])
  if (this.pointerLock) {
    this.camera.rotate(
      [this.mouseX/this.width-0.5, this.mouseY/this.height-0.5, 0],
      [this.prevMouseX/this.width-0.5, this.prevMouseY/this.height-0.5, 0]
    )
  }
})
