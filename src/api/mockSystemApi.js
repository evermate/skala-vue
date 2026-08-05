import { mockHttp } from './mockHttp.js'

export const mockSystemApi = {
  async getHealth() {
    const res = await mockHttp.get('/health')
    return res.data
  },
  async reset() {
    const res = await mockHttp.post('/reset')
    return res.data
  },
}
