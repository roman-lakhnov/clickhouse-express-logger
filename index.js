const express = require('express')
const { createClient } = require('@clickhouse/client')
require('dotenv').config()

const app = express()
const port = process.env.EXPRESS_PORT

const client = createClient({
	url: `http://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT}`,
	username: process.env.CLICKHOUSE_USER,
	password: process.env.CLICKHOUSE_PASSWORD
})

app.use(express.json())

async function initDB() {
	try {
		const dbName = process.env.CLICKHOUSE_DATABASE
		console.log(`Initializing database ${dbName}...`)
		await client.query({
			query: `CREATE DATABASE IF NOT EXISTS ${dbName}`
		})
		console.log('Database created or already exists')

		await client.query({
			query: `
			CREATE TABLE IF NOT EXISTS ${process.env.CLICKHOUSE_DATABASE}.${process.env.CLICKHOUSE_TABLE} (
				timestamp DateTime64(3),
				serviceXRoadInstance String,
				serviceCode String,
				serviceSecurityServerAddress String,
				requestAttachmentCount Int32,
				requestOutTs Int64,
				serviceSubsystemCode String,
				responseAttachmentCount Int32,
				clientMemberCode String,
				requestType String,
				responseInTs Int64,
				messageProtocolVersion String,
				messageId String,
				clientXRoadInstance String,
				clientMemberClass String,
				serviceMemberCode String,
				transactionId String,
				securityServerType String,
				securityServerInternalIp String,
				serviceMemberClass String,
				requestInTs Int64,
				clientSecurityServerAddress String,
				requestSoapSize Int32,
				responseOutTs Int64,
				responseSoapSize Int32,
				succeeded Bool
				)
				ENGINE = MergeTree()
				ORDER BY timestamp
				`
		})
		console.log('Table created or already exists')
		return true
	} catch (error) {
		console.error('Error initializing database:', error)
		return false
	}
}

initDB()

app.use(async (req, res, next) => {
	const now = new Date()
	const formattedTimestamp = now
		.toISOString()
		.replace('T', ' ')
		.replace('Z', '')

	const recordData =
		req.body && req.body.records && req.body.records ? req.body.records : []

	const records = []

	recordData.forEach(record => {
		const formattedRecord = {
			timestamp: formattedTimestamp,
			serviceXRoadInstance: record.serviceXRoadInstance || '',
			serviceCode: record.serviceCode || '',
			serviceSecurityServerAddress: record.serviceSecurityServerAddress || '',
			requestAttachmentCount: record.requestAttachmentCount || 0,
			requestOutTs: record.requestOutTs || 0,
			serviceSubsystemCode: record.serviceSubsystemCode || '',
			responseAttachmentCount: record.responseAttachmentCount || 0,
			clientMemberCode: record.clientMemberCode || '',
			requestType: record.requestType || '',
			responseInTs: record.responseInTs || 0,
			messageProtocolVersion: record.messageProtocolVersion || '',
			messageId: record.messageId || '',
			clientXRoadInstance: record.clientXRoadInstance || '',
			clientMemberClass: record.clientMemberClass || '',
			serviceMemberCode: record.serviceMemberCode || '',
			transactionId: record.transactionId || '',
			securityServerType: record.securityServerType || '',
			securityServerInternalIp: record.securityServerInternalIp || '',
			serviceMemberClass: record.serviceMemberClass || '',
			requestInTs: record.requestInTs || 0,
			clientSecurityServerAddress: record.clientSecurityServerAddress || '',
			requestSoapSize: record.requestSoapSize || 0,
			responseOutTs: record.responseOutTs || 0,
			responseSoapSize: record.responseSoapSize || 0,
			succeeded:
				typeof record.succeeded === 'boolean' ? record.succeeded : false
		}
		records.push(formattedRecord)
	})

	// Send to ClickHouse
	try {
		await client.insert({
			table: `${process.env.CLICKHOUSE_DATABASE}.${process.env.CLICKHOUSE_TABLE}`,
			values: records,
			format: 'JSONEachRow'
		})
	} catch (err) {
		console.error('Error logging request to ClickHouse:', err)
	}
	next()
})

app.post('/record', (req, res) => {
	res.send('OK')
})

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`)
	console.log(
		`ClickHouse query http://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT}/play`
	)
	console.log(`Grafana dashboard http://localhost:${process.env.GRAFANA_PORT}`)
})
