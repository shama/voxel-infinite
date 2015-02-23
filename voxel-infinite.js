var mat4 = require('gl-mat4')
var sub = require('vectors/sub')(3)
var div = require('vectors/div')(3)
var createBuffer = require('gl-buffer')
var createVAO = require('gl-vao')
var continuous = require('ndarray-continuous')

//var stencil = require('ndarray-stencil')
//var ndarray = require('ndarray')

var TIMING = false

var identityMatrix = [
  1,0,0,0,
  0,1,0,0,
  0,0,1,0,
  0,0,0,1]

var scratch0 = new Int32Array(12)
var scratch1 = new Int32Array(12)

function VoxelInfinite(gl, opts) {
  if (!(this instanceof VoxelInfinite)) return new VoxelInfinite(gl, opts)
  opts = opts || {}
  this.gl = gl
  // If the default generator should use a worker
  this.useWorker = opts.useWorker !== false
  // The method to call when we need to generate a chunk
  this.createMesh = opts.mesher || this.createDefaultMesher()
  // The shape of each chunk
  this.shape = opts.shape || [32,32,32]
  // The shape distance we create/destory chunks
  this.distance = opts.distance || [ [-4,-2,-4], [4,2,4] ]

  // The shape of chunks to load
  //this.stencil = opts.stencil || this.createDefaultStencil()

  // Setup ndarray-continuous
  var continuousOpts = {shape: this.shape}
  if (opts.generate) continuousOpts.getter = opts.generate
  this.data = continuous(continuousOpts)

  // The cache of current chunks
  this.cache = Object.create(null)
  // The shader for the chunks, set to false for none
  if (opts.shader !== false) {
    this.shader = opts.shader || this.createDefaultShader()
  }
  // Last know position for more efficient loading
  this._lastPosition = [null, null, null]
}
module.exports = VoxelInfinite

// Render all chunks in within the distance of this position
VoxelInfinite.prototype.position = function(pos) {
  var self = this
  var last = this._lastPosition

  // Turn position into chunk position
  scratch0[0] = Math.floor(pos[0] / this.shape[0])
  scratch0[1] = Math.floor(pos[1] / this.shape[1])
  scratch0[2] = Math.floor(pos[2] / this.shape[2])

  // Are we at the same position the last time we checked?
  if (scratch0[0] === last[0] && scratch0[1] === last[1] && scratch0[2] === last[2]) return this
  this._lastPosition = [ scratch0[0], scratch0[1], scratch0[2] ]
  if (TIMING) console.log('position', scratch0)

  // TODO: Use ndarrays and stencils here
  // TODO: Add a level of detail ability too
  var lod = 1

  // Add new chunks
  // TODO: Render chunks directly in front of player first
  scratch1[0] = Math.ceil(Math.abs(this.distance[0][0]) + Math.abs(this.distance[1][0])) / 2
  scratch1[1] = Math.ceil(Math.abs(this.distance[0][1]) + Math.abs(this.distance[1][1])) / 2
  scratch1[2] = Math.ceil(Math.abs(this.distance[0][2]) + Math.abs(this.distance[1][2])) / 2
  var valid = Object.create(null)
  for (var i = (scratch0[0] - scratch1[0]); i <= (scratch0[0] + scratch1[0]); ++i) {
    for (var j = (scratch0[1] - scratch1[1]); j <= (scratch0[1] + scratch1[1]); ++j) {
      for (var k = (scratch0[2] - scratch1[2]); k <= (scratch0[2] + scratch1[2]); ++k) {
        var p = [i,j,k]
        var id = p.join('|')
        valid[id] = true
        if (self.cache[id] && self.cache[id].vertexCount > 0) continue
        self.data.chunk(p, function(err, chunk) {
          if (err) return
          //setTimeout(function() {
            self.createMesh(p, chunk, lod)
          //}, Math.random() * 100)
        })
      }
    }
  }

  // Clear invalid chunks
  var keys = Object.keys(self.cache)
  for (var i = 0; i < keys.length; i++) {
    var id = keys[i]
    if (valid[id]) continue
    self.cache[id].vertexCount = 0
  }

  return this
}

VoxelInfinite.prototype.getBlock = function(pos) {
  return this.data.get(pos)
}

VoxelInfinite.prototype.setBlock = function(pos, idx) {
  var self = this
  // TODO: Debounce this for multiple setBlock calls?
  this.data.set(pos, idx)
  // TODO: Only re-render chunk if within distance
  var chunkPos = [
    Math.floor(pos[0] / this.shape[0]),
    Math.floor(pos[1] / this.shape[1]),
    Math.floor(pos[2] / this.shape[2]),
  ]
  // TODO: Set chunk to hasChanged  
  this.data.chunk(chunkPos, function(err, chunk) {
    if (err) return
    self.createMesh(chunkPos, chunk)
  })
}

// Load a meshed chunk to be rendered
VoxelInfinite.prototype.loadMesh = function(pos, vert_data) {
  var gl = this.gl
  var mesh = {
    //data: vert_data,
    pos: pos,
  }
  var vert_buf = createBuffer(gl, vert_data)
  mesh.vao = createVAO(gl, [
    { "buffer": vert_buf,
      "type": gl.UNSIGNED_BYTE,
      "size": 4,
      "offset": 0,
      "stride": 8,
      "normalized": false
    },
    { "buffer": vert_buf,
      "type": gl.UNSIGNED_BYTE,
      "size": 4,
      "offset": 4,
      "stride": 8,
      "normalized": false
    }
  ])
  mesh.vertexCount = vert_data.length>>3
  this.cache[pos.join('|')] = mesh
}

VoxelInfinite.prototype.unloadMesh = function(pos) {
  if (typeof pos !== 'string') pos = pos.join('|')
  // TODO: This should check if the data chunk has changed, if not remove it from memory
  delete this.cache[pos]
}

// Draw all chunks
VoxelInfinite.prototype.draw = function(opts) {
  var gl = this.gl
  opts = opts || {}
  var shader = this.shader
  var A = mat4.create()

  if (shader) {
    shader.bind()
    shader.attributes.attrib0.location = 0
    shader.attributes.attrib1.location = 1
    shader.uniforms.projection = opts.projection || identityMatrix
    shader.uniforms.view = opts.view || identityMatrix
    if (opts.texture) {
      shader.uniforms.tileMap = opts.texture.bind()
    }
    var tileCount = opts.tileCount || 16
    shader.uniforms.tileCount = tileCount
    shader.uniforms.tileSize = opts.tileSize || Math.floor(256 / tileCount)|0
  }

  var keys = Object.keys(this.cache)
  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i]
    var mesh = this.cache[key]
    if (!mesh) continue
    if (mesh.vertexCount < 1) {
      this.unloadMesh(key)
      continue
    }

    if (shader) {
      var m = mat4.create()
      mat4.translate(m, m, [
        mesh.pos[0] * this.shape[0],
        mesh.pos[1] * this.shape[1],
        mesh.pos[2] * this.shape[2],
      ])
      //mat4.scale(m, m, [2, 2, 2])
      shader.uniforms.model = m
    }

    mesh.vao.bind()
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount)
    mesh.vao.unbind()
  }
}

// VoxelInfinite.prototype.createDefaultStencil = function() {
//   var arr = ndarray(new Int8Array(10 * 10 * 10), [10, 10, 10])
//   for (var i = 3; i < 7; ++i) {
//     for (var j = 4; j < 6; ++j) {
//       for (var k = 3; k < 7; ++k) {
//         arr.set(i, j, k, 1)
//       }
//     }
//   }
//   return arr
// }

VoxelInfinite.prototype.createDefaultMesher = function() {
  var self = this
  var mesher = null
  if (self.useWorker) {
    var createWorker = require('webworkify')
    var worker = createWorker(require('./lib/default-mesher.js'))
    mesher = function(pos, chunk, lod) {
      var msg = {
        chunk: new Int32Array(chunk.data),
        pos: new Int8Array(pos),
        shape: new Int8Array(chunk.shape),
      }
      if (TIMING) console.time('meshed ' + pos.join('|'))
      worker.postMessage(msg, [msg.chunk.buffer, msg.pos.buffer, msg.shape.buffer])
    }
    worker.addEventListener('message', function(e) {
      var pos = [e.data.pos[0], e.data.pos[1], e.data.pos[2]]
      var mesh = e.data.mesh
      if (TIMING) console.timeEnd('meshed ' + pos.join('|'))
      self.loadMesh(pos, mesh)
    })
  } else {
    var createAOMesh = require('ao-mesher')
    mesher = function(pos, chunk, lod) {
      var mesh = createAOMesh(chunk)
      if (mesh) self.loadMesh(pos, mesh)
    }
  }
  return mesher
}

VoxelInfinite.prototype.createDefaultShader = function() {
  var createAOShader = require('ao-shader')
  return createAOShader(this.gl)
}
