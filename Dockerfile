FROM node:18-alpine

WORKDIR /app

# 빌드 단계에서 필요한 패키지만 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY dist ./dist

# Redis 접속 URL을 환경 변수로 받을 수 있도록 설정
ENV REDIS_URL=redis://localhost:6379

# 첫 번째 인자로 넘어온 값을 REDIS_URL로 사용
ENTRYPOINT ["node", "dist/index.js"] 