var createAOMesh = require('ao-mesher')
var ndarray = require('ndarray')
module.exports = function(self) {
  self.addEventListener('message', function(e) {
    var shape = [e.data.shape[0], e.data.shape[1], e.data.shape[2]]
    var chunk = ndarray(e.data.chunk, shape)
    var mesh = createAOMesh(chunk)
    if (mesh) {
      var msg = {
        pos: new Int8Array(e.data.pos),
        mesh: mesh,
      }
      self.postMessage(msg, [msg.pos.buffer, msg.mesh.buffer])
    }
  })
}
