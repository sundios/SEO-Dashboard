//load our app server using express
const express = require('express')
const app = express()
const morgan = require('morgan')
const mysql = require('mysql')
const cors = require('cors')

app.use(cors())


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
	res.send("hello from ROOOT!!!")
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

