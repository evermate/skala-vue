import { mockHttp } from './mockHttp.js'

export const authApi = {
  async signup({ email, password, name }) {
    const res = await mockHttp.post('/auth/signup', { email, password, name })
    return res.data
  },
  async login({ email, password }) {
    const res = await mockHttp.post('/auth/login', { email, password })
    return res.data
  },
}
