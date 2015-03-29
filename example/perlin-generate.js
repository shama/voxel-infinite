var ndarray = require('ndarray')
var noise = require('perlin').noise

var floor = 0
var ceiling = 10
var divisor = 50
var width = 34
noise.seed('voxel')
function pointsInside(startX, startY, width, func) {
  for (var x = startX; x < startX + width; x++)
    for (var y = startY; y < startY + width; y++)
      func(x, y)
}
function scale( x, fromLow, fromHigh, toLow, toHigh ) {
  return ( x - fromLow ) * ( toHigh - toLow ) / ( fromHigh - fromLow ) + toLow
}

module.exports = function(pos, done) {
  // TODO: Needs to better account for padding
  var s = [34,34,34]
  var arr = ndarray(new Int32Array(s[0] * s[1] * s[2]), s)
  var startX = pos[0] * width
  var startY = pos[1] * width
  var startZ = pos[2] * width
  var chunk = new Int8Array(width * width * width)
  pointsInside(startX, startZ, width, function(x, z) {
    var n = noise.simplex2(x / divisor , z / divisor)
    var y = ~~scale(n, -1, 1, floor, ceiling)
    if (y === floor || startY < y && y < startY + width) {
      var xidx = Math.abs((width + x % width) % width)
      var yidx = Math.abs((width + y % width) % width)
      var zidx = Math.abs((width + z % width) % width)
      arr.set(xidx, yidx, zidx, (1<<15) + parseInt(Math.random() * 99))
    }
  })
  return done(null, arr)
}
