const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const fs = require('fs')

/* 
**	Wave Database Stuff
*/

module.exports.createTideTable = function(table_name){
	return new Promise(async (resolve, reject) => {
		sqlite.open({
			filename: globals.database_directory,	
			driver: sqlite3.Database
		}).then((database) => {
			database.run(`CREATE TABLE IF NOT EXISTS ${table_name} (
				datetime TEXT PRIMARY KEY NOT NULL UNIQUE,
				water_level TEXT NOT NULL DEFAULT 0,
				wind_speed TEXT NOT NULL DEFAULT 0,
				wind_direction TEXT NOT NULL DEFAULT 0)`).then(()=> resolve())
		})
	})
}

module.exports.appendWaveData = function(table, datetime, water_level){
	return new Promise(async (resolve, reject) => {
		sqlite.open({
			filename: globals.database_directory,	
			driver: sqlite3.Database
		}).then((database) => {
			database.run(`INSERT OR IGNORE INTO ${table} (datetime, water_level)
			VALUES (?,?)`, datetime, water_level).then(()=> resolve()).catch(err=> reject(err))
		})
	})
}

module.exports.getWaveData = function(table){
	return new Promise(async (resolve, reject) => {
		sqlite.open({
			filename: globals.database_directory,
			driver: sqlite3.Database
		}).then((database)=> {
			database.all(`SELECT * FROM ${table}`).then((rows) => {
				resolve(rows)
			}).catch(err => reject(err))
		})
	})
}


module.exports.getDateWaveDataSortHeight = function(table, date){
	return new Promise(async (resolve, reject) => {
		sqlite.open({
			filename: globals.database_directory,
			driver: sqlite3.Database
		}).then((database)=> {
			let end_of_date = date.substring(0,8)
			database.all(`SELECT datetime, water_level FROM ${table} WHERE CAST(datetime AS INTEGER) > ${end_of_date}0000 AND CAST(datetime AS INTEGER) < ${end_of_date}2359 ORDER BY water_level DESC`
				).then((rows) => {
				resolve(rows)
			}).catch(err => reject(err))
		})
	})
}

module.exports.getDateNextWaveDataSortHeight = function(table, date, threshold){
	return new Promise(async (resolve, reject) => {
		sqlite.open({
			filename: globals.database_directory,
			driver: sqlite3.Database
		}).then((database)=> {
			let end_of_date = date.substring(0,8)
			database.all(`SELECT datetime, water_level FROM ${table}
				WHERE CAST(datetime AS INTEGER) > ${date}
				AND CAST(datetime AS INTEGER) < ${end_of_date}2359
				AND CAST(water_level AS REAL) > ${threshold[0]}
				ORDER BY datetime ASC`
				).then((highest_rows) => {
					database.all(`SELECT datetime, water_level FROM ${table}
						WHERE CAST(datetime AS INTEGER) > ${date}
						AND CAST(datetime AS INTEGER) < ${end_of_date}2359
						AND CAST(water_level AS REAL) < ${threshold[1]}
						ORDER BY datetime ASC`
						).then((lowest_rows) => {
							resolve([highest_rows[0], lowest_rows[0]])
						}).catch(err => reject(err))
			}).catch(err => reject(err))
		})
	})
}

module.exports.getCurrentWaveData = function(table, date){
	return new Promise(async (resolve, reject) => {
		sqlite.open({
			filename: globals.database_directory,
			driver: sqlite3.Database
		}).then(database => {
			let end_of_date = date.substring(0, 8)
			database.all(`SELECT datetime, water_level FROM ${table} WHERE CAST(datetime AS INTEGER) > ${end_of_date}0000 AND CAST(datetime AS INTEGER) < ${date} ORDER BY datetime DESC`)
				.then((rows) => {
					resolve(rows[0])
				})
		})
	})
}

/*
**	User Stuff
*/

module.exports.createUserTable = function(uuid){
	return new Promise(async (resolve, reject) => {
		sqlite.open({
			filename: globals.database_directory,	
			driver: sqlite3.Database
		}).then((database) => {
			database.run(`CREATE TABLE IF NOT EXISTS users (
				uuid TEXT NOT NULL PRIMARY KEY UNIQUE,
				family_name TEXT NOT NULL,
				given_name TEXT NOT NULL,
				email TEXT NOT NULL UNIQUE,
				phone_number TEXT UNIQUE,
				password TEXT NOT NULL)`).then(()=>{
					console.log("Created users table")
					resolve()
				})
		})
	})
}

module.exports.createSubscriptionTable = function(uuid){
	return new Promise(async (resolve, reject) => {
		sqlite.open({
			filename: globals.database_directory,	
			driver: sqlite3.Database
		}).then((database) => {
			database.run(`CREATE TABLE IF NOT EXISTS user_subscription (
				uuid TEXT NOT NULL PRIMARY KEY UNIQUE,
				phone_notification INTEGER DEFAULT 0,
				notification INTEGER DEFAULT 0,
				whyte_island INTEGER DEFAULT 0,
				southport INTEGER DEFAULT 0,
				mooloolaba INTEGER DEFAULT 0)`).then(()=> {
					console.log("Created user_subscription table")
					resolve()
				})
		})
	})
}

module.exports.createUser = function(user, subscriptions){
	return new Promise((resolve, reject) => {
		uuid=uuidv4()
		
		sqlite.open({
			filename: globals.database_directory,	
			driver: sqlite3.Database
		}).then((database) => {
			database.run(`INSERT INTO users (uuid, family_name, given_name, email, phone_number, password)
			VALUES (?,?,?,?,?,?)`, uuid, user["family_name"],
				user["given_name"], user["email"], user["phone_number"],
				user["password"])
				.then(()=> {
					database.run(`INSERT INTO user_subscription (uuid, phone_notification, notification, whyte_island, southport, mooloolaba)
					VALUES (?,?,?,?,?,?)`, uuid,
						subscriptions["phone_notification"],
						subscriptions["notification"],
						subscriptions["whyte_island"],
						subscriptions["southport"],
						subscriptions["mooloolaba"]
					).then(()=> {
						resolve()
					}).catch(err => reject(err))
				}).catch(err=> reject(err))
		})
	})
}

module.exports.checkUser = function(user){
	return new Promise((resolve, reject) => {	
		sqlite.open({
			filename: globals.database_directory,	
			driver: sqlite3.Database
		}).then((database) => {
			database.all(`SELECT s.whyte_island, s.southport, s.mooloolaba
				FROM users INNER JOIN user_subscription AS s
				ON s.uuid = users.uuid
				WHERE email='${user.email}' AND password='${user.password}'`)
				.then((rows)=> {
					if(rows.length === 0) return reject({type: 'auth', msg:'Username or Password Incorrect'})
					resolve(rows)
				}).catch(err=> reject(err))
		})
	})
}

function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}