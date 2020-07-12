const Express = require('express')
const path = require('path')
const bodyPaser=require('body-parser')

const web = Express()
const port = 1110
const root_directory = path.resolve(__dirname, '../')
const database_directory = path.join(root_directory, 'res/db/database.sqlite3')

global.globals = {
	root_directory,
	database_directory
}

global.globals.tide_links = [
	{
		name: "whyte_island",
		url: "http://opendata.tmr.qld.gov.au/Whyte_Island.txt",
	},
	{
		name: "whyte_island_pred",
		url: "https://www.tmr.qld.gov.au/-/media/aboutus/corpinfo/Open%20data/predictiveintervaldata/Brisbane-Bar/P046046A_2020.csv",
	},
	{
		name: "southport",
		url: "http://opendata.tmr.qld.gov.au/southport.txt",
	},
	{
		name: "southport_pred",
		url: "https://www.tmr.qld.gov.au/-/media/aboutus/corpinfo/Open%20data/predictiveintervaldata/Southport/P100035_2020.csv"
	},
	{
		name: "mooloolaba",
		url: "http://opendata.tmr.qld.gov.au/Mooloolaba.txt"
	},
	{
		name: "mooloolaba_pred",
		url: "https://www.tmr.qld.gov.au/-/media/aboutus/corpinfo/Open%20data/predictiveintervaldata/Mooloolaba/P011008A_2020.csv"
	}
]
/*

*/

const { createTideTable, createUserTable, createSubscriptionTable, createUserView} 
	= require(path.join(root_directory, 'src/database.js'))
const { startSchedular } = require(path.join(root_directory, 'src/data_schedular.js'))

web.use(bodyPaser.urlencoded({extended: false}))
web.use(bodyPaser.json())
web.use('/api', require(path.join(root_directory, 'src/routes/api.js')))

async function main(){
	for(let i in globals.tide_links){
		await createTideTable(globals.tide_links[i]['name'])
	}

	await createUserTable()
	await createSubscriptionTable()

	web.listen(port, ()=> console.log(`Running on port ${port}`))
	startSchedular()
}

main()
