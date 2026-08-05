// 인메모리 유저 저장소. 비밀번호 평문 저장 — mock, 실제 구현에서는 금지(해시 필요).
const initialUsers = [
  {
    id: 1,
    email: 'demo@skala.com',
    password: 'demo1234',
    name: '데모 계정',
  },
]

let users = []
let nextId = 1

export function resetUsers() {
  users = structuredClone(initialUsers)
  nextId = Math.max(...users.map((user) => user.id)) + 1
  return users
}

export function listUsers() {
  return users
}

export function findUserByEmail(email) {
  return users.find((user) => user.email === email)
}

export function findUserById(id) {
  return users.find((user) => user.id === id)
}

export function createUser({ email, password, name }) {
  const user = { id: nextId++, email, password, name }
  users.push(user)
  return user
}

resetUsers()
