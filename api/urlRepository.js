export default class URLRepository {
  constructor() {
    this.DB = []
  }

  save(url, id) {
    this.DB.push({ url, id })
  }

  getById(id) {
    return this.DB.find(entry => entry.id === id)
  }

  getList() {
    return this.DB
  }
}