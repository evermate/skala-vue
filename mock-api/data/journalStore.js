const initialJournal = [
  {
    id: 1,
    cityName: '평창',
    weatherTag: '눈',
    content: '겨울에 갔던 스키장 사진 정리하다가 다시 올림. 그날 체감온도가 영하 15도였다.',
    createdAt: '2026-01-18T11:00:00.000Z',
    updatedAt: '2026-01-18T11:00:00.000Z',
  },
  {
    id: 2,
    cityName: '방콕',
    weatherTag: '비',
    content: '스콜이라더니 정말 30분 만에 쏟아지고 그쳤다. 우산은 무용지물이었다.',
    createdAt: '2026-07-20T16:40:00.000Z',
    updatedAt: '2026-07-20T16:40:00.000Z',
  },
  {
    id: 3,
    cityName: '서울',
    weatherTag: '맑음',
    content: '오늘 하늘이 유독 맑네요.',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 4,
    cityName: '부산',
    weatherTag: '비',
    content: '갑자기 소나기가 쏟아졌어요.',
    createdAt: '2026-08-02T10:30:00.000Z',
    updatedAt: '2026-08-02T10:30:00.000Z',
  },
  {
    id: 5,
    cityName: '제주',
    weatherTag: '흐림',
    content: '구름이 잔뜩 껴서 한라산이 하나도 안 보였다. 그래도 우도는 다녀왔다.',
    createdAt: '2026-08-03T14:15:00.000Z',
    updatedAt: '2026-08-03T14:15:00.000Z',
  },
  {
    id: 6,
    cityName: '도쿄',
    weatherTag: '기타',
    content: '황사인지 미세먼지인지 하늘이 뿌옇다. 마스크 챙겨오길 잘했다.',
    createdAt: '2026-08-04T08:45:00.000Z',
    updatedAt: '2026-08-04T08:45:00.000Z',
  },
  {
    id: 7,
    cityName: '강릉',
    weatherTag: '맑음',
    content: '바다 색이 그날따라 유난히 파랬다. 파도 소리 녹음해뒀다.',
    createdAt: '2026-08-04T19:20:00.000Z',
    updatedAt: '2026-08-04T19:20:00.000Z',
  },
  {
    id: 8,
    cityName: '대전',
    weatherTag: '흐림',
    content: '흐리긴 한데 습도가 낮아서 그런지 오히려 걷기 좋았다.',
    createdAt: '2026-08-05T07:30:00.000Z',
    updatedAt: '2026-08-05T07:30:00.000Z',
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
