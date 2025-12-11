#!/bin/bash

# 출력 버퍼링 비활성화 (즉시 출력)
exec > >(tee -a /tmp/restart_servers.log)
exec 2>&1

echo "=========================================="
echo "서버 재시작 스크립트 시작"
echo "=========================================="
echo ""

echo "[1/4] 서버 종료 중..."
pkill -f "uvicorn api.app:app" && echo "  ✓ 백엔드 서버 종료됨" || echo "  ℹ 실행 중인 백엔드 서버 없음"
pkill -f "http.server 3000" && echo "  ✓ 프론트엔드 서버 종료됨" || echo "  ℹ 실행 중인 프론트엔드 서버 없음"
sleep 2

echo ""
echo "[2/4] 백엔드 서버 시작 중..."
cd /home/DMaLab/dmalab_back || exit 1
nohup python3 -m uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo "  ✓ 백엔드 서버 시작됨 (PID: $BACKEND_PID)"
echo "  ℹ 로그 파일: /home/DMaLab/dmalab_back/backend.log"

echo ""
echo "[3/4] 프론트엔드 서버 시작 중..."
cd /home/DMaLab/dmalab_front || exit 1
nohup python3 -m http.server 3000 > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  ✓ 프론트엔드 서버 시작됨 (PID: $FRONTEND_PID)"
echo "  ℹ 로그 파일: /home/DMaLab/dmalab_front/frontend.log"

echo ""
echo "[4/4] 서버 상태 확인 중..."
sleep 2
echo ""
echo "실행 중인 서버 프로세스:"
ps aux | grep -E "(uvicorn|http.server)" | grep -v grep || echo "  ⚠ 실행 중인 서버를 찾을 수 없습니다."

echo ""
echo "=========================================="
echo "서버 재시작 완료!"
echo "=========================================="
