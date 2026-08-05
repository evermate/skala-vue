# skala-vue — 날씨 대시보드

Vue 3 + Vite로 만든 날씨 대시보드. 국내/해외 도시 날씨 조회에, 도시 검색해서 추가하기와 날씨 일지 두 가지 CRUD 기능을 붙였다.

## 기능

### 날씨 대시보드

- 국내 22개 / 해외 14개 고정 도시의 실시간 날씨를 카드와 지도로 보여준다. 상태는 `dashboardStore`(Pinia)에 지역(국내/해외)별로 나눠 저장하고, 10분 TTL 캐시를 둬서 화면을 재진입할 때마다 다시 부르지 않는다.
- 날씨 데이터는 Open-Meteo API를 직접 호출한다(`utils/fetchWeather.js`). `.env.local`에 `VITE_OPENWEATHER_API_KEY`를 넣으면 로컬 개발 중에만 OpenWeatherMap을 먼저 시도하고 실패하면 Open-Meteo로 넘어간다. 두 공급자를 비교해보려고 남겨둔 로컬 전용 옵션이며, Pages 배포본엔 이 키가 아예 없어서 항상 Open-Meteo만 쓴다.
- 검색어/상태 필터, 도시 클릭 시 지도·온도계 포커스, 현재 위치 날씨(Geolocation) 지원.
- 상단 단위 토글로 섭씨/화씨를 전환하면 화면 전체(카드, 지도, 상세보기, 온도계)의 온도 표시가 즉시 바뀐다. 선택한 단위는 `configStore`가 `localStorage`에 저장해서 다음 방문에도 유지된다.
- Open-Meteo/OpenWeatherMap이 둘 다 실패하면(요청 한도 초과 등) 화면이 비지 않도록 도시 위경도 기반으로 그럴듯한 데모 값을 만들어 보여준다. 데모로 대체된 경우 목록 상단에 사유가 뜬다.

### 상세보기

- 기온·습도·풍속·미세먼지·5일 예보. 미세먼지와 예보는 메인 날씨와 따로, 상세 화면에서 도시 1개 단위로만 부른다(목록 화면까지 다 부르면 호출량이 너무 커짐).
- 제목 옆에 LIVE/데모 표시가 붙는다. 메인 날씨뿐 아니라 미세먼지·예보도 API가 실패하면 각자 데모 값으로 대체되고, 그 사실이 배지로 보인다.

### 도시 검색해서 추가

- 검색은 Open-Meteo Geocoding API(실제 외부 API)를 직접 호출한다. 한글 도시명은 행정구역 접미사(시/군/구 등)를 붙여야 정확히 잡히는 경우가 많아서, 접미사 붙인 쿼리도 같이 날려 보완한다.
- 추가 버튼을 누르면 그 결과(id/name/lat/lon/region)를 Mock API(`POST /api/custom-cities`)로 저장한다. 이름이나 좌표가 이미 있는 도시와 겹치면 추가 대신 기존 도시로 안내한다.
- 카드에서 메모를 달아두고 나중에 고칠 수 있다(`PATCH /api/custom-cities/:id`). 상세보기에서도 그 메모가 보인다.
- 최대 20개까지 추가할 수 있고, 넘으면 가장 먼저 추가한 도시부터 자동으로 삭제된다.
- 날씨 값 자체는 저장하지 않는다. 저장된 커스텀 도시 목록을 불러온 뒤 항상 Open-Meteo에서 새로 받아와 메모리에만 둔다(`customCityStore`의 `weatherById`).

### 날씨 일지

- `/journal`에서 다녀온 곳의 날씨를 기록한다. 목록 조회·작성·수정·삭제 전부 Mock API(`/api/journal`)로 처리하는 CRUD. Element Plus 컴포넌트로 화면을 구성했다.

## Mock API와 실제 API 구분

커스텀 도시와 날씨 일지, 이 두 기능만 Mock API를 쓴다(날씨 조회는 항상 실제 API). 로컬에서는 Node 서버(`server.js`)가 메모리에 데이터를 들고 있고 재시작하면 초기화된다. GitHub Pages는 서버를 띄울 수 없어서, `src/api/staticMockAdapter.js`가 같은 API 경로를 브라우저 안에서 그대로 흉내 내고 `localStorage`에 저장한다. 어느 쪽을 쓸지는 `VITE_API_MODE` 환경변수로 정하고(`src/api/mockHttp.js`), 그 외 컴포넌트나 API 모듈 코드는 두 환경에서 동일하다.

화면 상단 배너로 지금 로컬 Node 서버/브라우저 어댑터 중 어디에 붙어있는지 확인할 수 있다.

## 로컬 실행

Node.js `20.19 이상` 또는 `22.12 이상` 필요.

```sh
npm install
```

`.env.local`을 만들고 아래처럼 설정한다.

```dotenv
# 로컬 테스트용. 없어도 Open-Meteo로 정상 동작함
VITE_OPENWEATHER_API_KEY=발급받은_API_키

# Mock API를 로컬 Node 서버로 쓰겠다는 뜻
VITE_API_MODE=server
VITE_API_BASE_URL=http://localhost:3001/api
```

Vue와 Node Mock API를 함께 실행한다.

```sh
npm run dev:all
```

- Vue: `http://localhost:5173`
- Mock API: `http://localhost:3001/api`

`npm run dev`만 실행하면 날씨 대시보드는 정상 동작하지만, 커스텀 도시 추가·날씨 일지는 Mock API 서버가 없어서 실패한다.

## GitHub Pages 배포

`.github/workflows/deploy.yml`이 `main` 브랜치 push 시 `npm run build:pages`(`.env.pages`의 `VITE_API_MODE=static` 적용)로 빌드하고, `dist/index.html`을 `dist/404.html`로 복사(SPA 라우팅용)한 뒤 Pages에 배포한다.

로컬에서 Pages 빌드만 확인하려면:

```sh
npm run build:pages
npm run preview
```

Pages 빌드 환경(GitHub Actions)엔 `.env.local`이 없고 레포 Secrets에도 OpenWeatherMap 키가 없어서, 로컬에서 그 키를 쓰고 있어도 배포본은 항상 Open-Meteo만 쓴다.

## npm 명령

| 명령                   | 역할                                   |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Vite 서버만 실행                        |
| `npm run api`          | 로컬 Node Mock API만 실행               |
| `npm run dev:all`      | Vue + Mock API 동시 실행                |
| `npm run build`        | 기본 프로덕션 빌드                      |
| `npm run build:pages`  | 브라우저 Mock API를 포함한 Pages 빌드   |
| `npm run preview`      | 최근 빌드 결과 미리보기                 |
| `npm run lint`         | oxlint → eslint 순서로 실행             |
| `npm run format`       | prettier로 `src/` 포맷팅                |
