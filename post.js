const http = require('http')
const { requestExample } = require('./requestExample')

const POST_INTERVAL_MS = 50 
const TARGET_URL = 'http://localhost:4000/record'

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
