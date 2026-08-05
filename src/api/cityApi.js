import { mockHttp } from './mockHttp.js'

export const cityApi = {
  async getAll() {
    const res = await mockHttp.get('/custom-cities')
    return res.data
  },
  async create(city) {
    const res = await mockHttp.post('/custom-cities', city)
    return res.data
  },
  async update(id, patch) {
    const res = await mockHttp.patch(`/custom-cities/${id}`, patch)
    return res.data
  },
  async remove(id) {
    const res = await mockHttp.delete(`/custom-cities/${id}`)
    return res.data
  },
}
