const http = require('http')
const { requestExample } = require('./requestExample')
require('dotenv').config()

const POST_INTERVAL_MS = parseInt(process.env.POST_INTERVAL_MS)
const PORT = process.env.EXPRESS_PORT
const TARGET_URL = `http://localhost:${PORT}/record`

const data = JSON.stringify(requestExample)

function sendPost() {
	const req = http.request(
		TARGET_URL,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': data.length
			}
		},
		res => {
			console.log(`${new Date().toISOString()} Status: ${res.statusCode}`)
		}
	)

	req.on('error', err => console.error('Error:', err.message))
	req.write(data)
	req.end()
}

console.log(`Sending requests to ${TARGET_URL} every ${POST_INTERVAL_MS}ms...`)
console.log('Press Ctrl+C to stop')

const interval = setInterval(sendPost, POST_INTERVAL_MS)

process.on('SIGINT', () => {
	console.log('\nStopping the request interval')
	clearInterval(interval)
	process.exit(0)
})
