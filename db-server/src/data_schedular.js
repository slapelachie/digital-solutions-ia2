const request = require('request')
const path = require('path')
const csv = require('fast-csv')

const { appendWaveData } = require(path.join(globals.root_directory, 'src/database.js'))

module.exports.startSchedular = async function(){
	//Start insertion of all tide links
	for(let i in globals.tide_links){
		link=globals.tide_links[i]
		await getTideData(link['name'], link['url']).catch(err => console.error(err))
	}

	// Run the above code every 10 minutes for a continous sync

	/*setInterval(async function(){
		for(let i in globals.tide_links){
			link=globals.tide_links[i]
			await getTideData(link['name'], link['url']).catch(err => console.error(err))
		}
	}, 600000)*/
}

function getTideData(name, url){
	return new Promise((resolve, reject)=> {
		console.log(`Starting fetch from ${name}`)

		// Retrieve the data from the URL provided, and add it to the database
		getData(url).then((data) => {
			addCSVtoDB(data, name).then(()=>{
				console.log(`Completed fetch of ${name}`)
				resolve()
			}).catch(err=> reject(err.message))
		}).catch(err => reject(err))
	})
}

function addCSVtoDB(data, table_name){
	return new Promise((resolve, reject) => {
		// Get the data parsed and add it to a database under a table specified
		tide_data = []
		csv.parseString(data)
		// Executes every line read by the parser
		.on('data', (data)=> {
			// If there is no data in this element
			if(data[0] == undefined) return
			// If the length of the data is 0
			if(data.length == 0) return
			// Makes sure the line starts with the datetime
			// Filters out the junk at the start of the file
			if(!data[0].match(/\d{12}/)) return
			// Split the csv line into an array
			row = data[0].split(/\s+/)
			if(row[1] > 10) return
			tide_data.push({
				datetime: row[0],
				water_level: row[1],
			})
		})
		// Once the data parsing reaches the end
		.on('end', async ()=> {
			console.log(`Adding data into ${table_name}`)
			for(let i in tide_data){
				let row = tide_data[i]
				// Add the data to the database
				await appendWaveData(table_name, row['datetime'], row['water_level'])
					.catch((err) => reject(err))
			}
			console.log(`Added data into ${table_name}`)
			resolve()
		})
		.on('error', (err)=> reject(err))
	})
}

async function getData(url){
	// Gets the data from the specified url
	return new Promise((resolve, reject) => {
		console.log(`Retrieving data from ${url}`)
		request({url, timeout: 10000}, (err, res, body) => {
			if (err) { reject("Timeout while fetching " + url)}
			console.log(`Retrieved data from ${url}`)
			resolve(body)
		})
	})
}