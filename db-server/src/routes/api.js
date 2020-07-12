const Express = require('express')
const path = require('path')
const { getWaveData } = require('../database')
const { normalize } = require('path')

const { 
	getDateWaveDataSortHeight, 
	getDateNextWaveDataSortHeight, 
	getCurrentWaveData, 
	createUser, 
	checkUser,
} = require(path.join(globals.root_directory, 'src/database.js'))

router = Express.Router()

router.get('/get', async (req, resp) => {
	queries = Object.keys(req.query)
	if(!req.query['site']) resp.send("no")
	site_name = req.query['site']
	if(queries.length > 0){
		for(let query of queries){
			switch(query){
				case "max_range":
					resp.send(await getMinMaxHeight(site_name))
					break
				case "next_range":
					resp.send(await getNextMinMaxHeightFromThreshold(site_name))
					break
				case "alert_level":
					resp.send({alert_level : await getAlertLevel(site_name)})
					break
				case "current":
					getCurrentWaveData(site_name, getBadCurrentDate()).then(data => {
						data['datetime'] = getFormattedTime(data['datetime'])
						resp.send([data])
					})
				/*default:
					resp.send("invalid query you egg")
					break*/
			}
		}
	}
	//resp.send("Not avaliable yet...")	
})

router.get('/test', (req, resp) => {
	getNextMinMaxHeightFromThreshold('whyte_island').then(data => resp.send(data))
		.catch(err => console.error(err))
})

router.post('/user/add', (req, resp) => {
	if(Object.keys(req.body).length == 0) return resp.send("No data recieved")
	q = req.body
	user = {
		family_name: q["family_name"],
		given_name: q["given_name"],
		email: q["email"],
		phone_number: q["phone_number"],
		password: q["password"]
	}

	subscriptions = {
		phone_notification: q["phone_notification"],
		notification: q["notification"],
		southport: q["southport"],
		whyte_island: q["brisbane_bar"],
		mooloolaba: q["mooloolaba"]
	}

	createUser(user, subscriptions).then(() => {
		//resp.status(300)
		resp.send("OK")
	}).catch(err => {
		console.error(err)
		resp.status(500)
		resp.send("Whoops")
	});
})


router.post('/user/check', (req, resp) => {
	if(Object.keys(req.body).length == 0) return resp.send("No data recieved")
	q = req.body
	user = {
		email: q["email"],
		password: q["password"]
	}

	checkUser(user).then((sites) => {
		resp.status(200)
		resp.send(sites)
	}).catch(err => {
		if(err.type == "auth"){
			resp.status(401)
			resp.send(err.msg)
		}else{
			console.error(err)
			resp.status(500)
			resp.send("Whoops")
		}
	});
})

module.exports = router

function getFormattedTime(time){
	if(time.length == 11){
		time = '0' + time
	}
	let day = time.substring(0,2)
	let month = parseInt((time.substring(2,4)))+1
	let year = time.substring(4,8)
	let hour = time.substring(8,10)
	let minute = time.substring(10,12)

	let date = new Date(year, month, day, hour, minute)
	return `${date.getFullYear()}\
${padzero(date.getMonth()-1)}\
${padzero(date.getDate())}\
${padzero(date.getHours())}\
${padzero(date.getMinutes())}`
}

function getNormalisedFigure(value, min, max) {
	return (value-min)/(max-min)
}

function getDenormalisedFigure(normalised, min, max) {
	return (normalised * (max-min))+parseFloat(min)
}

function getThresholdValues(baseline) {
	return [baseline + (baseline/2), baseline - (baseline/2)]
}

function getBadAppendedDate(date, days) {
	date.setDate(date.getDate()+days)
	return getBadDate(date)
}

function getBadDate(date) {
	return `\
${padzero(date.getDate())}\
${padzero(date.getMonth()+1)}\
${date.getFullYear()}\
${padzero(date.getHours())}\
${padzero(date.getMinutes())}`
}

function getBadCurrentDate() {
	date = new Date()
	return getBadDate(date)
}

function getMinMaxHeight(site_name){
	return new Promise((resolve, reject) => {
		current_date = getBadCurrentDate()
		getDateWaveDataSortHeight(`${site_name}_pred`, current_date).then(data => {
			data[0]['datetime'] = getFormattedTime(data[0]['datetime'])
			data[data.length-1]['datetime'] = getFormattedTime(data[data.length-1]['datetime'])
			resolve([data[0], data[data.length-1]])
		}).catch(err=> reject(err))
	})
}

function getNextMinMaxHeightFromThreshold(site_name){
	return new Promise((resolve, reject) => {
		current_date = getBadCurrentDate()
		thresholds = getDenormalisedThresholds(site_name).then(thresholds => {
			getDateNextWaveDataSortHeight(`${site_name}_pred`, current_date, thresholds).then(data => {
				data[0]['datetime'] = getFormattedTime(data[0]['datetime'])
				data[data.length-1]['datetime'] = getFormattedTime(data[data.length-1]['datetime'])
				resolve([data[0], data[data.length-1]])
			}).catch(err=> reject(err))
		})
	})
}

function getAverageHeight(site_name) {
	return new Promise((resolve, reject) => {
		date = new Date()
		current_date = getBadCurrentDate()
		end_date = getBadAppendedDate(date, 7)

		getWaveData(`${site_name}_pred`).then(data => {
			total_water_level = 0
			total_entries = 0

			for(let entry of data){
				total_water_level += parseFloat(entry['water_level'])
				total_entries++
			}
			resolve(parseFloat(total_water_level/total_entries))
		}).catch(err => reject(err))
	}).catch(err => reject(err))
}

function getBaselineNormTideHeight(site_name) {
	return new Promise((resolve, reject) => {
		getAverageHeight(site_name).then(avg_height => {
			getMinMaxHeight(site_name).then(range => {
				resolve(getNormalisedFigure(avg_height, range[1]['water_level'], range[0]['water_level']))
			}).catch(err => reject(err))
		}).catch(err => reject(err))
	})
}

function getCurrentNormTideHeight(site_name) {
	return new Promise((resolve, reject) => {
		bad_date = getBadCurrentDate()
		getMinMaxHeight(site_name).then(range => {
			getCurrentWaveData(site_name, bad_date).then(data => {
				resolve(getNormalisedFigure(data['water_level'], range[1]['water_level'], range[0]['water_level']))
			}).catch(err => reject(err))
		}).catch(err => reject(err))
	})
}

function getThresholdFromBaselineNorm(site_name) {
	return new Promise((resolve, reject) => {
		getBaselineNormTideHeight(site_name).then(baseline_tideheight => {
			resolve(getThresholdValues(baseline_tideheight))
		}).catch(err => reject(err))
	})
}

function getDenormalisedThresholds(site_name) {
	return new Promise((resolve, reject) => {
		getMinMaxHeight(site_name).then(range => {
			getThresholdFromBaselineNorm(site_name).then(thresholds => {
				resolve([
					getDenormalisedFigure(thresholds[0], range[1]['water_level'], range[0]['water_level']),
					getDenormalisedFigure(thresholds[1], range[1]['water_level'], range[0]['water_level']),
				])
			})
		}).catch(err => reject(err))
	})
}

function getAlertLevel(site_name) {
	return new Promise((resolve, reject) => {
		getCurrentNormTideHeight(site_name).then(current_tideheight => {
			getThresholdFromBaselineNorm(site_name).then(normal_threshold => {
				if(current_tideheight > 1 || current_tideheight < 0){
					resolve(2)
				}else if (current_tideheight > normal_threshold[0] || current_tideheight < normal_threshold[1]){
					resolve(1)
				}else{
					resolve(0)
				}
			}).catch(err => reject(err))
		}).catch(err => reject(err))
	})
}

function padzero(num){
	if(num < 10){
		return '0' + num
	}
	return num
}