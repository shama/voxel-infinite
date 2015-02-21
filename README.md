# voxel-infinite

## example

```js
var createInfinite = require('voxel-infinite')

var createViewer = require('mesh-viewer')
var mat4 = require('gl-mat4')

var infinite

var viewer = createViewer({
  useCellNormals: false,
  meshColor: [.8, .8, .8],
  specular: [0.3, 0.3, 0.3],
  ambient: [1, 1, 1],
  clearColor: [0.2, 0.3, 0.8, 1],
})

viewer.on('viewer-init', function() {
  var gl = this.gl

  // Create an instance of infinite
  infinite = createInfinite(gl, {
    // Give a method to generate chunks
    generator: function(i,j,k) {
      var x = i - 16
      var y = j - 16
      var z = k - 16
      if (x*x+y*y+z*z < 30) {
        return 1
      }  
      return 0
    }
  })

  // Set the position (of camera, player, focus, etc)
  infinite.position([0,0,0])

  // Set the camera to look at the center of 0,0,0
  var c = [shape[0]>>>1, shape[1]>>>1, shape[0]>>>1]
  this.camera.lookAt([c[0], c[1], c[2]+2*shape[2]], c, [0,1,0])
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
```

## install

```shell
npm install voxel-infinite --save
```

## api

```js
var createInfinite = require('voxel-infinite')
```

### `var infinite = createInfinite(gl, params)`
Creates a infinite mesh handler.

* `gl` - is a handle to a WebGL context
* `params` is an object that has the following properties:

    + `generate` A function to call when we need to generate a chunk.
    + `generator` A simple function
    + `shape` An array of the shape of each chunk: `[32,32,32]`
    + `distance` An array of the distance shape to chunk: `[ [0,0,0], [4,2,4] ]`
    + `shader` A shader to use for the chunks.

```










---


IDEAS

Should be createMesh(pos, chunk)
setBlock() should createMesh() on the right chunk and set hasChanged: true on the chunk
  then when chunks are removed, we check if hasChanged, if not, remove from this.grid
position() should invalidate chunks






