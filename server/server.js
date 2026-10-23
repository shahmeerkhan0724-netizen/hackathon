import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import connectDb from "./config/db.js"

const app = express()

app.use(cors())
app.use(express.json()) 
connectDb()
const PORT = process.env.PORT || 3000

app.get("/", (req, res) => {
  res.send("Hello World!")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})