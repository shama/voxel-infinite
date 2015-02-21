var createAOMesh = require('ao-mesher')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')

module.exports = function(self) {
  self.addEventListener('message', function(e) {
    var shape = [e.data.shape[0], e.data.shape[1], e.data.shape[2]]
    var chunk = ndarray(e.data.chunk, shape)
    var mesh = createAOMesh(chunk)
    //console.error(e.data.chunk)
    if (mesh) {
      var msg = {
        pos: new Int8Array(e.data.pos),
        mesh: mesh,
      }
      self.postMessage(msg, [msg.pos.buffer, msg.mesh.buffer])
    }

    // var data = e.data
    // var pos = data.pos
    // var shape = data.shape

    // // If a custom generate function has been supplied
    // var fn = data.fn
    // if (fn) {
    //   var fname = '___' + Date.now() + '___'
    //   fn = fn.toString().replace(/^"|"$/g, '').replace(/\\n|\\r\\n/g, '\n')
    //   fn = fn.replace('function ', 'function ' + fname)
    //   fn = fn + ';return ' + fname + '.apply(this, arguments)'
    //   fn = new Function(fn)
    // } else {
    //   // Otherwise use this boring one
    //   fn = function(i,j,k) {
    //     var x = i - shape[0] / 2
    //     var y = j - shape[0] / 2
    //     var z = k - shape[0] / 2
    //     if (x*x+y*y+z*z < shape[0] - 2) {
    //       return 1
    //     }  
    //     return 0
    //   }
    // }

    // var chunk = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), shape)
    // fill(chunk, fn)
    // chunk = createAOMesh(chunk)
    // var msg = {
    //   pos: new Int8Array(pos),
    //   chunk: chunk,
    // }
    // self.postMessage(msg, [msg.pos.buffer, msg.chunk.buffer])
  })
}
