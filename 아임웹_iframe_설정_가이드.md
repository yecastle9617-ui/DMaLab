# 아임웹 iframe 높이 자동 조정 설정 가이드

## 문제
iframe 내부에 스크롤이 생기는 문제를 해결합니다.

## 해결 방법

### 방법 1: HTML 코드 위젯 사용 (권장)

1. 아임웹 관리자 페이지에서 `/dmalab` 페이지로 이동
2. **HTML 코드** 위젯 추가
3. 아래 코드를 복사하여 붙여넣기:

```html
<iframe 
    id="dmalab-iframe" 
    src="https://dmalab.diffstudio.co.kr" 
    style="width: 100%; border: none; overflow: hidden; display: block;"
    scrolling="no"
></iframe>

<script>
(function() {
    const iframe = document.getElementById('dmalab-iframe');
    if (!iframe) return;
    
    // iframe에서 오는 높이 메시지 수신
    window.addEventListener('message', function(event) {
        // 보안: 신뢰할 수 있는 도메인에서만 메시지 수신
        if (event.origin !== 'https://dmalab.diffstudio.co.kr') return;
        
        if (event.data && event.data.type === 'iframe-height') {
            const height = event.data.height;
            if (height && height > 0) {
                iframe.style.height = height + 'px';
            }
        }
    });
    
    // 초기 설정
    iframe.style.overflow = 'hidden';
})();
</script>
```

### 방법 2: CSS만 사용 (간단하지만 덜 정확)

```html
<iframe 
    src="https://dmalab.diffstudio.co.kr" 
    style="width: 100%; height: 5000px; border: none; overflow: hidden;"
    scrolling="no"
></iframe>
```

**주의**: 이 방법은 고정 높이를 사용하므로 콘텐츠가 더 길거나 짧을 경우 문제가 될 수 있습니다.

## 설정 완료 후 확인사항

1. iframe 내부 스크롤이 사라졌는지 확인
2. 콘텐츠가 동적으로 로드될 때 높이가 자동으로 조정되는지 확인
3. 모바일에서도 정상 작동하는지 확인

## 문제 해결

### 높이가 조정되지 않는 경우
- 브라우저 개발자 도구(F12) → Console에서 에러 확인
- iframe의 `src` 속성이 정확한지 확인 (`https://dmalab.diffstudio.co.kr`)
- 아임웹의 HTML 코드 위젯이 제대로 저장되었는지 확인

### 여전히 스크롤이 보이는 경우
- iframe에 `scrolling="no"` 속성 추가 확인
- CSS에 `overflow: hidden` 추가 확인

