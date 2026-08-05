import { fetchWithTimeout } from './fetchWithTimeout'

// 위키백과 한국어판 문서 제목 예외 테이블. 도시명 그대로 검색하면 동음이의어 문서로
// 빠지는 경우만 등록한다. 고정 도시 목록(국내22/해외14) 전수 확인 결과 이 둘뿐이었다.
const WIKI_TITLE_OVERRIDES = {
  파리: '파리 (프랑스)', // 곤충 '파리'와 동음이의어
  제주: '제주특별자치도', // '제주도(섬)'/'제주시' 등과 갈리는 동음이의어
}

// 도시명으로 위키백과 요약(설명 + 대표 사진)을 가져온다. 키 발급 불필요, CORS 허용된
// 공개 API(Wikimedia REST API)라 로컬/Pages 배포본 어디서든 동일하게 동작한다.
// 동음이의어 문서(type !== 'standard')나 아예 매칭 실패는 콘텐츠를 신뢰할 수 없으므로
// null을 돌려주고, 호출한 쪽이 그 섹션을 조용히 숨기게 한다 — 커스텀 검색으로 추가된
// 도시처럼 위키 표제어와 이름이 안 맞는 경우가 실패의 대부분이라, 에러를 던지기보다
// "정보 없음"으로 취급하는 편이 자연스럽다.
export async function fetchCityInfo(cityName) {
  const title = WIKI_TITLE_OVERRIDES[cityName] ?? cityName
  const url = `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`

  try {
    const response = await fetchWithTimeout(url)
    if (!response.ok) return null

    const data = await response.json()
    if (data.type !== 'standard') return null

    return {
      title: data.title,
      description: data.description ?? '',
      extract: data.extract ?? '',
      thumbnailUrl: data.thumbnail?.source ?? null,
      pageUrl: data.content_urls?.desktop?.page ?? null,
    }
  } catch {
    return null
  }
}
