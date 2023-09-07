const http = require('http')

exports.config = {
  publish: {
    dist: [
      'css/cas13.css',
      'css/main.css',
      'js/bionode-seq.min.js',
      'js/cas13.js',
      'js/showdown.min.js',
      'js/vendor.min.js',
      'favicon.ico',
      'index.html',
    ],
  },
  controllers: {
    cors: function (controller) {
      const seq = controller.path[0]

      http.get(
        `http://genome.ucsc.edu/cgi-bin/hgBlat?userSeq=${seq}NNNNNN&type=translated%20RNA&db=hg38&output=json`,
        function (res) {
          res.setEncoding('utf8')
          let rawData = ''
          res.on('data', (chunk) => {
            rawData += chunk
          })
          res.on('end', () => {
            controller.res.end(rawData)
          })
        }
      )
    },
  },
}
