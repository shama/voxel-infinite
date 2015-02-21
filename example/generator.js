var createAOMesh = require('ao-mesher')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')

module.exports = function(self) {
  self.addEventListener('message', function(e) {
    var data = e.data
    var pos = data.pos
    var shape = data.shape
    var chunk = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), shape)
    var idx = (pos[0] * 3 * 3 + pos[1] * 3 + pos[2]) + 64
    fill(chunk, function(i,j,k) {
      var x = i - 16
      var y = j - 16
      var z = k - 16
      if (x*x+y*y+z*z < 30) {
        return idx
      }  
      return 0
    })
    chunk = createAOMesh(chunk)
    var msg = {
      pos: new Int8Array(pos),
      chunk: chunk,
    }
    self.postMessage(msg, [msg.pos.buffer, msg.chunk.buffer])
  })
}
