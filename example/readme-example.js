var createInfinite = require('../voxel-infinite.js')

var mat4 = require('gl-mat4')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')
var createViewer = require('mesh-viewer')
var createCamera = require('first-person-camera')

var infinite

var viewer = createViewer({
  clearColor: [0.2, 0.3, 0.8, 1],
  pointerLock: true,
})

viewer.on('viewer-init', function() {
  var gl = this.gl
  this.camera = createCamera()

  // Create an instance of infinite
  infinite = createInfinite(gl, {
    // Give a method to generate chunks
    generate: function(pos, done) {
      var chunk = ndarray(new Int32Array(32 * 32 * 32), [32,32,32])
      fill(chunk, function(i,j,k) {
        var x = i - 16
        var y = j - 16
        var z = k - 16
        if (x*x+y*y+z*z < 30) {
          return (1<<15) + 1
        }
        return 0
      })
      done(null, chunk)
    },
  })
})

viewer.on('gl-render', function() {
  var gl = this.gl
  var A = mat4.create()

  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)

  // Draw all infinite chunks
  infinite.draw({
    view: this.camera.view(),
    projection: mat4.perspective(A, Math.PI/4.0, this.width/this.height, 1.0, 1000.0),
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
