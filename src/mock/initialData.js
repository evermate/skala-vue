// Node mock-api/data/journalStore.js와 같은 시드 데이터. 서버 코드는 브라우저 번들에 못 들어가서 따로 유지한다.
export const initialJournal = [
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
