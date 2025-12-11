# 아임웹 iframe 높이 자동 조정 코드 (개선 버전)

## 문제 해결
아임웹에서 iframe 높이가 자동으로 조정되지 않는 문제를 해결하기 위한 개선된 코드입니다.

## 사용 방법

1. 아임웹 관리자 페이지에서 `/dmalab` 페이지로 이동
2. **HTML 코드** 위젯 추가 (또는 기존 위젯 수정)
3. 아래 코드를 **전체** 복사하여 붙여넣기

## 코드 (복사해서 사용)

```html
<iframe 
    id="dmalab-iframe" 
    src="https://dmalab.diffstudio.co.kr" 
    style="width: 100%; border: none; overflow: hidden; display: block; min-height: 600px;"
    scrolling="no"
    frameborder="0"
></iframe>

<script>
(function() {
    'use strict';
    
    console.log('[아임웹] iframe 높이 자동 조정 스크립트 시작');
    
    // iframe 요소 찾기 (여러 방법 시도)
    let iframe = document.getElementById('dmalab-iframe');
    if (!iframe) {
        // ID로 못 찾으면 태그로 찾기
        const iframes = document.querySelectorAll('iframe[src*="dmalab.diffstudio.co.kr"]');
        if (iframes.length > 0) {
            iframe = iframes[0];
            console.log('[아임웹] iframe을 태그로 찾음');
        }
    }
    
    if (!iframe) {
        console.error('[아임웹] iframe을 찾을 수 없습니다!');
        return;
    }
    
    console.log('[아임웹] iframe 찾음:', iframe);
    
    // 초기 설정
    iframe.style.overflow = 'hidden';
    iframe.style.border = 'none';
    
    // 높이 조정 함수
    function adjustIframeHeight(height) {
        if (height && height > 0) {
            const newHeight = Math.max(height, 600); // 최소 600px
            iframe.style.height = newHeight + 'px';
            console.log('[아임웹] iframe 높이 조정:', newHeight + 'px');
        }
    }
    
    // 모달 표시 함수
    function showRestoreModal() {
        // 이미 모달이 있으면 다시 만들지 않음
        if (document.getElementById('dmalab-restore-modal')) {
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'dmalab-restore-modal';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #fff;
            border-radius: 10px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        `;
        
        modal.innerHTML = `
            <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #222;">
                작성 중이던 글이 있습니다
            </h3>
            <p style="margin: 0 0 20px; font-size: 14px; color: #555; line-height: 1.6;">
                이전에 작성하던 임시 저장 내용을 불러올까요?<br>
                "불러오기"를 선택하면 제목/본문/태그가 복원됩니다.
            </p>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button id="dmalab-modal-restore" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    cursor: pointer;
                    font-weight: 500;
                ">불러오기</button>
                <button id="dmalab-modal-discard" style="
                    background: #f5f5f5;
                    color: #333;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    cursor: pointer;
                    font-weight: 500;
                ">새로 작성</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 버튼 클릭 이벤트
        const handleAction = (action) => {
            // iframe에 선택 결과 전달
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'restore-modal-action',
                    action: action
                }, 'https://dmalab.diffstudio.co.kr');
            }
            overlay.remove();
        };
        
        modal.querySelector('#dmalab-modal-restore').addEventListener('click', () => {
            handleAction('restore');
        });
        
        modal.querySelector('#dmalab-modal-discard').addEventListener('click', () => {
            handleAction('discard');
        });
        
        // 바깥 클릭 시 닫지 않음 (버튼으로만 처리)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // 바깥 클릭은 무시
            }
        });
    }
    
    // iframe에서 오는 메시지 수신
    window.addEventListener('message', function(event) {
        // 디버깅용 로그
        console.log('[아임웹] 메시지 수신:', {
            origin: event.origin,
            data: event.data
        });
        
        // 보안: 신뢰할 수 있는 도메인에서만 메시지 수신
        if (event.origin !== 'https://dmalab.diffstudio.co.kr') {
            console.warn('[아임웹] 신뢰할 수 없는 origin:', event.origin);
            return;
        }
        
        // 높이 조정 메시지
        if (event.data && event.data.type === 'iframe-height') {
            const height = event.data.height;
            if (height && height > 0) {
                adjustIframeHeight(height);
            }
        }
        
        // 모달 표시 요청
        if (event.data && event.data.type === 'show-restore-modal') {
            showRestoreModal();
        }
    }, false);
    
    // iframe 로드 완료 후 초기 높이 요청 (선택사항)
    iframe.addEventListener('load', function() {
        console.log('[아임웹] iframe 로드 완료');
        // iframe 내부에서 높이를 보내도록 요청
        setTimeout(function() {
            iframe.contentWindow.postMessage({
                type: 'request-height'
            }, 'https://dmalab.diffstudio.co.kr');
        }, 500);
    });
    
    // 주기적으로 높이 확인 (백업 방법)
    let lastHeight = 0;
    setInterval(function() {
        try {
            // iframe 내부 문서 높이 직접 확인 (같은 도메인이면 가능)
            // 하지만 cross-origin이므로 이 방법은 작동하지 않을 수 있음
            // 대신 postMessage에 의존
        } catch (e) {
            // cross-origin 오류는 정상
        }
    }, 1000);
    
    console.log('[아임웹] iframe 높이 자동 조정 스크립트 설정 완료');
})();
</script>
```

## 디버깅 방법

1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭 확인
3. 다음 메시지들이 보여야 함:
   - `[아임웹] iframe 높이 자동 조정 스크립트 시작`
   - `[아임웹] iframe 찾음: ...`
   - `[아임웹] 메시지 수신: ...`
   - `[아임웹] iframe 높이 조정: ...px`

## 문제 해결

### 높이가 조정되지 않는 경우

1. **Console 확인**: 에러 메시지 확인
2. **iframe 찾기 확인**: `[아임웹] iframe 찾음` 메시지 확인
3. **메시지 수신 확인**: `[아임웹] 메시지 수신` 메시지 확인
4. **도메인 확인**: `event.origin`이 `https://dmalab.diffstudio.co.kr`인지 확인

### 여전히 작동하지 않는 경우

1. 아임웹 HTML 코드 위젯이 제대로 저장되었는지 확인
2. 브라우저 캐시 삭제 후 다시 시도
3. 다른 브라우저에서 테스트
4. 아임웹 관리자에게 문의 (JavaScript 실행 제한 여부)

## 대안 방법 (간단 버전)

위 코드가 작동하지 않으면 아래 간단한 버전을 시도해보세요 (모달 기능 포함):

```html
<iframe 
    id="dmalab-iframe" 
    src="https://dmalab.diffstudio.co.kr" 
    style="width: 100%; height: 5000px; border: none; overflow: hidden; min-height: 600px;"
    scrolling="no"
    frameborder="0"
></iframe>

<script>
(function() {
    const iframe = document.getElementById('dmalab-iframe');
    if (!iframe) return;
    
    // 모달 표시 함수
    function showModal() {
        if (document.getElementById('dmalab-restore-modal')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'dmalab-restore-modal';
        overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999999;';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'background: #fff; border-radius: 10px; padding: 24px; max-width: 400px; width: 90%;';
        modal.innerHTML = `
            <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 700;">작성 중이던 글이 있습니다</h3>
            <p style="margin: 0 0 20px; font-size: 14px; color: #555;">이전에 작성하던 임시 저장 내용을 불러올까요?</p>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button id="restore-btn" style="background: #667eea; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">불러오기</button>
                <button id="discard-btn" style="background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 6px; padding: 8px 16px; cursor: pointer;">새로 작성</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        modal.querySelector('#restore-btn').onclick = () => {
            iframe.contentWindow.postMessage({type: 'restore-modal-action', action: 'restore'}, 'https://dmalab.diffstudio.co.kr');
            overlay.remove();
        };
        modal.querySelector('#discard-btn').onclick = () => {
            iframe.contentWindow.postMessage({type: 'restore-modal-action', action: 'discard'}, 'https://dmalab.diffstudio.co.kr');
            overlay.remove();
        };
    }
    
    window.addEventListener('message', function(e) {
        if (e.origin !== 'https://dmalab.diffstudio.co.kr') return;
        
        if (e.data.type === 'iframe-height') {
            iframe.style.height = Math.max(e.data.height, 600) + 'px';
        } else if (e.data.type === 'show-restore-modal') {
            showModal();
        }
    });
})();
</script>
```

