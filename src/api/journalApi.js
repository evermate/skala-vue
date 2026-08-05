import { mockHttp } from './mockHttp.js'

export const journalApi = {
  async getAll() {
    const res = await mockHttp.get('/journal')
    return res.data
  },
  async create(entry) {
    const res = await mockHttp.post('/journal', entry)
    return res.data
  },
  async update(id, patch) {
    const res = await mockHttp.patch(`/journal/${id}`, patch)
    return res.data
  },
  async remove(id) {
    const res = await mockHttp.delete(`/journal/${id}`)
    return res.data
  },
}
