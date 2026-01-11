# Macro Dashboard

실시간 거시경제 지표를 모니터링하는 대시보드입니다.

## 포함된 지표

모든 지표는 FRED (Federal Reserve Economic Data) API에서 제공됩니다.

| 지표 | 설명 | FRED Series ID | 업데이트 주기 |
|------|------|---------------|--------------|
| 2Y Treasury | 2년물 국채 금리 | DGS2 | Daily |
| 10Y Treasury | 10년물 국채 금리 | DGS10 | Daily |
| Fed Funds Rate | 기준금리 | FEDFUNDS | Monthly |
| CPI | 소비자물가지수 | CPIAUCSL | Monthly |
| Nonfarm Payroll | 비농업고용지수 | PAYEMS | Monthly |
| VIX | 변동성지수 | VIXCLS | Daily |
| S&P 500 | S&P 500 지수 | SP500 | Daily |

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 데이터 업데이트 (로컬에서만 실행)
npm run update-data
```

## 데이터 업데이트

`npm run update-data` 명령을 실행하면:

1. 각 지표별 JSON 파일에서 가장 최근 날짜를 확인
2. 해당 날짜 이후의 새 데이터가 있는지 API에서 확인
3. 새 데이터가 있으면 JSON 파일에 추가
4. `combined.json` 파일을 업데이트하여 대시보드에 반영

데이터는 `data/` 폴더에 JSON 형태로 저장됩니다:
- `treasury2y.json`
- `treasury10y.json`
- `fedFundsRate.json`
- `cpi.json`
- `nonfarmPayroll.json`
- `vix.json`
- `sp500.json`
- `combined.json` (모든 데이터 통합)

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data**: FRED API (Federal Reserve Economic Data)

## 주요 기능

- 📈 7개 주요 거시경제 지표 실시간 모니터링
- 📊 장단기 금리차(Yield Spread) 계산
- 📉 CPI 전년 대비 변화율(YoY) 계산
- 🎯 실질금리 계산
- 🔍 1M/3M/6M/1Y/2Y/ALL 기간별 필터링
- 🌙 터미널 스타일 다크 테마 UI

## API 키 설정

### FRED API 키

FRED API 키는 환경변수로 관리됩니다.

1. `.env.local` 파일을 생성하세요:
   ```bash
   touch .env.local
   ```

2. `.env.local` 파일에 본인의 FRED API 키를 입력하세요:
   ```
   FRED_API_KEY=your_api_key_here
   ```

3. FRED API 키는 https://fred.stlouisfed.org/docs/api/api_key.html 에서 무료로 발급받을 수 있습니다.

### Gemini API 키 (AI Chat 기능)

AI Chat 기능을 사용하려면 Gemini API 키가 필요합니다.

1. `.env.local` 파일에 Gemini API 키를 추가하세요:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. (선택사항) 사용할 모델을 지정할 수 있습니다:
   ```
   GEMINI_MODEL=gemini-2.5-flash
   ```
   - `gemini-2.5-flash` (기본값, 최신 모델, 빠르고 효율적)
   - `gemini-1.5-pro-latest` (더 정확하지만 느림)

3. Gemini API 키는 [Google AI Studio](https://makersuite.google.com/app/apikey)에서 무료로 발급받을 수 있습니다.

### 환경변수 파일 예시

`.env.local` 파일 예시:

```env
# FRED API Key (필수)
FRED_API_KEY=your_fred_api_key_here

# Gemini API Key (AI Chat 기능 사용 시 필수)
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model (선택사항, 기본값: gemini-2.5-flash)
# GEMINI_MODEL=gemini-1.5-pro-latest
```

**주의**: 
- `.env.local` 파일은 Git에 커밋되지 않습니다. 각 개발자는 자신의 API 키를 사용해야 합니다.
- 환경변수를 변경한 후에는 개발 서버를 재시작해야 합니다.
