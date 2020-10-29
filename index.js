const config = require('./utils/config')
const application = require('./app')
const http = require('http')

const server = http.createServer(application)
server.listen(config.PORT, () => console.log(`Application running on port ${config.PORT}`))