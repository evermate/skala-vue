const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

// 외부 API 응답값(예: 지오코딩 결과 도시명)을 Leaflet divIcon HTML 문자열처럼
// Vue 템플릿 밖에서 직접 마크업에 꽂아 넣을 때 반드시 통과시킨다.
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char])
}
