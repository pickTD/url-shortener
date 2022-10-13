import express from 'express'
import { nanoid } from 'nanoid'
import isUrl from 'is-url'
import URLRepository from './repositories/urlRepository'

const app = express()
app.use(express.json())
const repo = new URLRepository()

app.post("/shorten", (req, res) => {
  const { url } = req.body
  if (isUrl(url)) {
    const id = nanoid(8)
    repo.save(url, id)
  
    res.json({ shortURL: `localhost:3000/${id}` })
  } else {
    res.status(422).json({ error: 'Invalid URL' })
  }
})

app.get("/list", (req, res) => {
  const list = repo.getList()
  res.json({ list })
})

app.get("/:id", (req, res) => {
  const id = req.params.id
  const entry = repo.getById(id)

  if (!entry) {
    res.status(404).json({ error: 'Not found corresponding URL' })
  } else {
    res.json({ originalUrl: entry.url })
  }
})

export default app