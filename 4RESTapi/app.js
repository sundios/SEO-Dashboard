//load our app server using express
const express = require('express')
const app = express()
const morgan = require('morgan')
const mysql = require('mysql')
const cors = require('cors')
const path = require('path')

app.use(cors())

// ---- All data API Call ----
app.get('/all/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM all_t", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//Top Keywords API Call
app.get('/keywords-all/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM `keywords-all`", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//Top URLs API Call
app.get('/urls-all/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM `urls-all`", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//---- END ALL ----

// ---- Mobile API Call ----
app.get('/mobile/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM mobile", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//Top Keywords API Call
app.get('/keywords-mobile/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM `keywords-mobile`", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//Top URLs API Call
app.get('/urls-mobile/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM `urls-mobile`", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//---- END MOBILE ----



// ---- Desktop API call ----
app.get('/desktop/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM desktop", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//Top Keywords API Call
app.get('/keywords-desktop/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM `keywords-desktop`", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//Top URLs API Call
app.get('/urls-desktop/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM `urls-desktop`", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//---- END DESKTOP ----

//---- Tablet API Call ----

app.get('/tablet/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM tablet", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//Top Keywords API Call
app.get('/keywords-tablet/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM `keywords-tablet`", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})

//Top URLs API Call
app.get('/urls-tablet/' ,(req, res) => {
	console.log("fetching user with ID" + req.params)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	
	connection.query("SELECT * FROM `urls-tablet`", (err,rows,fields) => {
		if (err) {
			console.log("Failed to query for" + err)
			res.sendStatu(500)
			return
			//throw err
		}
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})
//res.end()
})



//Get specific ID 

app.get('/mobile/:id' ,(req, res) => {
	console.log("fetching user with ID" + req.params.id)

	const connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock',
		password:'root',
		database :'ecom'
	})	

	const id = req.params.id
	const queryString = "SELECT * FROM mobile WHERE id = ?"
	connection.query(queryString, [id], (err,rows,fields) => {
		console.log("I think we fetch users succesfully")
		res.json(rows)
	})

//res.end()
})


app.get("/",(req, res) => {
	console.log("responding to root route")
	res.sendFile(path.join(__dirname + '/index.html'))
} )

app.get("/users", (req,res) => {
	var user1 = {firstName: "Konrad" , lastName: "Burchardt"}
	const user2 = {firstName: "Margi" , lastName: "Sant"}
	res.json([user1, user2])
})

//localhost:3003
app.listen(3003, () => {
	console.log("Server is up and listening on 3003")
})

