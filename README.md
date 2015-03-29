# voxel-infinite

Render an infinite voxel world.

## example

```js
var createInfinite = require('voxel-infinite')

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
```

## install

```shell
npm install voxel-infinite --save
```

## api

```js
var createInfinite = require('voxel-infinite')
```

### `var infinite = createInfinite(gl, options)`
Creates a infinite mesh handler.

* `gl` - is a handle to a WebGL context
* `options` is an object that has the following optional properties:

    + `generate` A function to call when we need to generate a chunk. Called with the signature `function(position, done)` where `position` is the `[x,y,z]` position of the chunk and `done(null, mesh)` with your compiled mesh.
    + `mesher` A meshing function that will turn a chunk into a voxel mesh. Called with the signature `function(position, chunk)` where `position` is the `[x,y,z]` position of the chunk and `chunk` is the voxel data to mesh.
    + `shape` An array of the shape of each chunk: `[32,32,32]`
    + `distance` An array of the distance to load meshes around the position: `[ [-4,-2,-4], [4,2,4] ]`
    + `shader` A shader to use for the meshes.
    + `useWorker` Whether to use a worker for the default meshing operations.

### `infinite.data`
Holds the data model of the voxels. An instance of [ndarray-continuous](https://www.npmjs.com/package/ndarray-continuous).

### `infinite.cache`
An object of the mesh cache. Indexed by `x|y|z` and will contain the positions, vertex count and vertex array object of each visible mesh.

### `infinite.shader`
The shader to render the meshes with. Defaults to [ao-shader](https://www.npmjs.com/package/ao-shader). Set to your own shader or `false` to skip shader handling.

### `infinite.getBlock(position)`
Returns the block id from the given `[x,y,z]` position in the data.

### `infinite.setBlock(position, id)`
Sets the given `[x,y,z]` position to the block `id`.

### `infinite.position(position)`
Sets the `[x,y,z]` position (such as the position of the player) to load chunks around by the set distance.

### `infinite.createMesh(position, chunk)`
Creates a mesh at the given `position` for the ndarray `chunk`.

### `infinite.loadMesh(position, mesh)`
Loads a mesh to be rendered at the `position`.

### `infinite.unloadMesh(position)`
Unloads the mesh at the given `[x,y,z]` position.

### `infinite.draw(options)`
Draws all the mesh objects within the cache.

* `options` is an object that has the following optional properties (mostly for configuring ao-shader):

    + `view` The view matrix for the shader.
    + `projection` The projection matrix for the shader.
    + `texture` A texture to apply to the shader's `tileMap` uniform.
    + `tileSize` For the shader's `tileSize` uniform.
    + `tileCount` For the shader's `tileCount` uniform.

## license
(c) 2015 Kyle Robinson Young. MIT License
