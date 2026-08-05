const initialJournal = [
  {
    id: 1,
    cityName: '서울',
    weatherTag: '맑음',
    content: '오늘 하늘이 유독 맑네요.',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 2,
    cityName: '부산',
    weatherTag: '비',
    content: '갑자기 소나기가 쏟아졌어요.',
    createdAt: '2026-08-02T10:30:00.000Z',
    updatedAt: '2026-08-02T10:30:00.000Z',
  },
]

let journal = []
let nextId = 1

export function resetJournal() {
  journal = structuredClone(initialJournal)
  nextId = Math.max(...journal.map((entry) => entry.id)) + 1
  return journal
}

export function listJournal() {
  return journal.toSorted((a, b) => b.id - a.id)
}

export function findJournalById(id) {
  return journal.find((entry) => entry.id === id)
}

export function createJournal(input) {
  const now = new Date().toISOString()
  const entry = { id: nextId++, ...input, createdAt: now, updatedAt: now }
  journal.push(entry)
  return entry
}

export function updateJournal(id, patch) {
  const entry = findJournalById(id)
  if (!entry) return undefined
  Object.assign(entry, patch, { updatedAt: new Date().toISOString() })
  return entry
}

export function deleteJournal(id) {
  const index = journal.findIndex((entry) => entry.id === id)
  if (index === -1) return undefined
  const [deleted] = journal.splice(index, 1)
  return deleted
}

resetJournal()
