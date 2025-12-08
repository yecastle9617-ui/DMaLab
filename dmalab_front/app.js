const API_BASE_URL = 'http://localhost:8000';

// 네이버 블로그 카테고리 구조
const NAVER_CATEGORIES = {
    'entertainment': {
        name: '엔터테인먼트·예술',
        subCategories: [
            { value: 'literature', label: '문학·책' },
            { value: 'movie', label: '영화' },
            { value: 'art', label: '미술·디자인' },
            { value: 'performance', label: '공연·전시' },
            { value: 'music', label: '음악' },
            { value: 'drama', label: '드라마' },
            { value: 'celebrity', label: '스타·연예인' },
            { value: 'comic', label: '만화·애니' },
            { value: 'broadcast', label: '방송' }
        ]
    },
    'life': {
        name: '생활·노하우·쇼핑',
        subCategories: [
            { value: 'daily', label: '일상·생각' },
            { value: 'parenting', label: '육아·결혼' },
            { value: 'pet', label: '반려동물' },
            { value: 'quote', label: '좋은글·이미지' },
            { value: 'fashion', label: '패션·미용' },
            { value: 'interior', label: '인테리어·DIY' },
            { value: 'cooking', label: '요리·레시피' },
            { value: 'review', label: '상품리뷰' },
            { value: 'gardening', label: '원예·재배' }
        ]
    },
    'hobby': {
        name: '취미·여가·여행',
        subCategories: [
            { value: 'game', label: '게임' },
            { value: 'sports', label: '스포츠' },
            { value: 'photo', label: '사진' },
            { value: 'car', label: '자동차' },
            { value: 'hobby', label: '취미' },
            { value: 'travel-domestic', label: '국내여행' },
            { value: 'travel-world', label: '세계여행' },
            { value: 'restaurant', label: '맛집' }
        ]
    },
    'knowledge': {
        name: '지식·동향',
        subCategories: [
            { value: 'it', label: 'IT·컴퓨터' },
            { value: 'society', label: '사회·정치' },
            { value: 'health', label: '건강·의학' },
            { value: 'business', label: '비즈니스·경제' },
            { value: 'language', label: '어학·외국어' },
            { value: 'education', label: '교육·학문' }
        ]
    }
};

// ===== 외부 링크 UI 초기화 =====
function initExternalLinksUI() {
    const container = document.getElementById('external-links-container');
    const addBtn = document.getElementById('add-external-link-btn');
    const levelSelect = document.getElementById('generate-blog-level');

    if (!container || !addBtn || !levelSelect) return;

    // 외부 링크 행 추가
    function addExternalLinkRow(initialValue = '') {
        const row = document.createElement('div');
        row.className = 'external-link-row';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'external-link-input';
        input.placeholder = 'https://example.com/page';
        input.value = initialValue;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-link-remove';
        removeBtn.textContent = '삭제';

        removeBtn.addEventListener('click', () => {
            if (container.children.length > 1) {
                container.removeChild(row);
            } else {
                // 최소 1개 행은 유지하되 값만 비우기
                input.value = '';
            }
        });

        row.appendChild(input);
        row.appendChild(removeBtn);
        container.appendChild(row);
    }

    // 초기 1개 행 생성
    if (container.children.length === 0) {
        addExternalLinkRow();
    }

    // 레벨에 따라 활성/비활성
    function updateExternalLinksState() {
        const level = levelSelect.value;
        const isNew = level === 'new';

        const inputs = container.querySelectorAll('.external-link-input');
        inputs.forEach(input => {
            input.disabled = isNew;
            if (isNew) {
                input.value = '';
            }
        });

        addBtn.disabled = isNew;
    }

    levelSelect.addEventListener('change', updateExternalLinksState);
    addBtn.addEventListener('click', () => {
        addExternalLinkRow();
    });

    // 전역 헬퍼: 현재 UI에서 외부 링크 배열 추출
    window.getExternalLinksFromUI = function(blogLevel) {
        if (blogLevel === 'new') return null;
        const inputs = container.querySelectorAll('.external-link-input');
        const links = [];
        inputs.forEach(input => {
            const v = (input.value || '').trim();
            if (v) {
                links.push(v);
            }
        });
        return links.length > 0 ? links : null;
    };

    // 초기 상태 반영
    updateExternalLinksState();
}

// ===== 참고 블로그 URL UI 초기화 =====
function initReferenceBlogsUI() {
    const container = document.getElementById('reference-blogs-container');
    const addBtn = document.getElementById('add-reference-blog-btn');
    const autoCheckbox = document.getElementById('generate-use-auto-reference');
    const countInput = document.getElementById('generate-reference-count');

    if (!container || !addBtn || !autoCheckbox || !countInput) return;

    function addReferenceRow(initialValue = '') {
        const row = document.createElement('div');
        row.className = 'external-link-row';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'external-link-input';
        input.placeholder = 'https://blog.naver.com/...';
        input.value = initialValue;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-link-remove';
        removeBtn.textContent = '삭제';

        removeBtn.addEventListener('click', () => {
            if (container.children.length > 1) {
                container.removeChild(row);
            } else {
                input.value = '';
            }
        });

        row.appendChild(input);
        row.appendChild(removeBtn);
        container.appendChild(row);
    }

    if (container.children.length === 0) {
        addReferenceRow();
    }

    addBtn.addEventListener('click', () => addReferenceRow());

    function updateAutoReferenceState() {
        // 자동 수집 사용 여부에 따라 개수 입력만 활성/비활성
        countInput.disabled = !autoCheckbox.checked;
    }

    autoCheckbox.addEventListener('change', updateAutoReferenceState);
    updateAutoReferenceState();

    // 전역 헬퍼: 참고용 블로그 URL 배열 추출
    window.getReferenceBlogsFromUI = function() {
        const inputs = container.querySelectorAll('.external-link-input');
        const urls = [];
        inputs.forEach(input => {
            const v = (input.value || '').trim();
            if (v) {
                urls.push(v);
            }
        });
        return urls.length > 0 ? urls : null;
    };
}

// 대분류 변경 시 소분류 업데이트
function initCategorySelector() {
    const mainSelect = document.getElementById('generate-category-main');
    const subSelect = document.getElementById('generate-category-sub');
    
    if (!mainSelect || !subSelect) return;
    
    mainSelect.addEventListener('change', function() {
        const mainValue = this.value;
        const subSelect = document.getElementById('generate-category-sub');
        
        // 소분류 초기화
        subSelect.innerHTML = '<option value="">소분류를 선택하세요</option>';
        
        if (mainValue && NAVER_CATEGORIES[mainValue]) {
            // 소분류 활성화 및 옵션 추가
            subSelect.disabled = false;
            NAVER_CATEGORIES[mainValue].subCategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.value;
                option.textContent = sub.label;
                subSelect.appendChild(option);
            });
        } else {
            // 대분류가 선택되지 않으면 소분류 비활성화
            subSelect.disabled = true;
        }
    });
}

// 페이지 로드 시 카테고리 선택기 초기화
// 스크립트가 body 끝에 있으므로 DOM이 이미 로드되어 있을 수 있음
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initCategorySelector();
            initExternalLinksUI();
            initReferenceBlogsUI();
            // 에디터 초기화 (항상 보이도록)
            initializeQuillEditors();
            // 임시 저장된 내용이 있으면 복원 여부를 사용자에게 물어봄
            showRestoreDraftModalIfNeeded();
        });
    } else {
        // DOM이 이미 로드된 경우 즉시 실행
        setTimeout(function() {
            initCategorySelector();
            initExternalLinksUI();
            initReferenceBlogsUI();
            // 에디터 초기화 (항상 보이도록)
            initializeQuillEditors();
            // 임시 저장된 내용이 있으면 복원 여부를 사용자에게 물어봄
            showRestoreDraftModalIfNeeded();
        }, 100); // 약간의 지연으로 DOM이 완전히 준비되도록
    }
})();

// 이미지 URL을 프록시를 통해 로드하는 헬퍼 함수
function getProxyImageUrl(imageUrl, outputDir = null) {
    if (!imageUrl) return '';
    
    // 이미 프록시 URL이거나 저장된 경로인 경우
    if (imageUrl.startsWith('/api/image-proxy') || imageUrl.startsWith('/static/')) {
        return `${API_BASE_URL}${imageUrl}`;
    }
    
    // URL 인코딩
    const encodedUrl = encodeURIComponent(imageUrl);
    let proxyUrl = `${API_BASE_URL}/api/image-proxy?url=${encodedUrl}`;
    
    // output_dir이 있으면 추가
    if (outputDir) {
        proxyUrl += `&output_dir=${encodeURIComponent(outputDir)}`;
    }
    
    return proxyUrl;
}

// 탭 전환
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // 모든 탭 버튼과 콘텐츠 비활성화
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // 선택한 탭 활성화
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// 로딩 표시
function showLoading(message = '처리 중...') {
    const loadingDiv = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    const loadingSteps = document.getElementById('loading-steps');
    
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        if (loadingSteps) {
            loadingSteps.innerHTML = '';
        }
    }
    document.getElementById('error').style.display = 'none';
}

function updateLoadingStep(step, status = 'pending') {
    // status: 'pending', 'processing', 'completed', 'error'
    const loadingSteps = document.getElementById('loading-steps');
    if (!loadingSteps) return;
    
    const stepId = `step-${step.replace(/\s+/g, '-').toLowerCase()}`;
    let stepElement = document.getElementById(stepId);
    
    if (!stepElement) {
        stepElement = document.createElement('div');
        stepElement.id = stepId;
        stepElement.className = 'loading-step';
        loadingSteps.appendChild(stepElement);
    }
    
    const icons = {
        'pending': '⏳',
        'processing': '🔄',
        'completed': '✅',
        'error': '❌'
    };
    
    const colors = {
        'pending': '#999',
        'processing': '#667eea',
        'completed': '#28a745',
        'error': '#dc3545'
    };
    
    stepElement.innerHTML = `
        <span class="step-icon">${icons[status] || icons.pending}</span>
        <span class="step-text" style="color: ${colors[status] || colors.pending}">${step}</span>
    `;
    
    stepElement.className = `loading-step step-${status}`;
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
    // 로딩이 끝나면 결과 영역(에디터)을 다시 표시
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.style.display = 'block';
    }
}

// 에러 표시
function showError(message) {
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = '오류: ' + message;
}

// 결과 표시
function showResult(data, type = 'default') {
    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('result-content');
    
    // 결과를 표시할 때는 항상 에디터 영역을 보이도록 설정
    if (resultDiv) {
        resultDiv.style.display = 'block';
    }
    
    // 타입에 따라 다른 렌더링
    switch (type) {
        case 'process': {
            if (resultContent) {
                resultContent.innerHTML = renderProcessResult(data);
            }
            break;
        }
        case 'generate': {
            // 제목, 본문, 태그로 분리된 에디터에 렌더링
            const content = data.blog_content || data;
            renderBlogContentSeparated(content);
            // 현재 블로그 콘텐츠 저장 (복사 기능용)
            window.currentBlogContent = content;
            break;
        }
        default: {
            // JSON 표시는 pre 태그 사용
            if (resultContent) {
                resultContent.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            }
            break;
        }
    }
}

// 전체 처리 결과 렌더링
function renderProcessResult(data) {
    let html = `<div class="result-header">
        <h3>전체 처리 결과</h3>
        <p class="result-summary">
            키워드: <strong>${data.keyword}</strong> | 
            전체: <strong>${data.total_count}개</strong> | 
            성공: <strong>${data.success_count}개</strong> | 
            실패: <strong>${data.total_count - data.success_count}개</strong>
        </p>
        <p class="output-dir"><strong>출력 디렉토리:</strong> ${data.output_dir}</p>
    </div>`;
    
    if (data.results && data.results.length > 0) {
        html += '<div class="process-results-list">';
        data.results.forEach((result, index) => {
            html += `
                <div class="process-result-card ${result.success ? 'success' : 'error'}">
                    <div class="result-card-header">
                        <span class="result-rank">TOP ${result.rank}</span>
                        <span class="result-status-badge ${result.success ? 'success' : 'error'}">
                            ${result.success ? '✅ 성공' : '❌ 실패'}
                        </span>
                    </div>
                    <div class="result-card-body">
                        <h4 class="result-title">${escapeHtml(result.title)}</h4>
                        <p><strong>URL:</strong> <a href="${result.url}" target="_blank">${result.url}</a></p>
                        ${result.body_length ? `<p><strong>본문 길이:</strong> ${result.body_length.toLocaleString()}자</p>` : ''}
                        ${result.txt_path ? `<p><strong>TXT 파일:</strong> ${result.txt_path}</p>` : ''}
                        ${result.excel_path ? `<p><strong>엑셀 파일:</strong> ${result.excel_path}</p>` : ''}
                        ${result.keywords && result.keywords.length > 0 ? `
                            <div class="keywords-preview">
                                <strong>주요 키워드:</strong>
                                <div class="keyword-tags">
                                    ${result.keywords.slice(0, 10).map(k => `<span class="keyword-tag">${escapeHtml(k.keyword)} (${k.count})</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${result.image_urls && result.image_urls.length > 0 ? `
                            <div class="images-container" style="margin-top: 20px;">
                                <h4 style="margin-bottom: 15px; color: #333;">이미지 (${result.image_urls.length}개)</h4>
                                <div class="images-grid">
                                    ${result.image_urls.map((imgUrl, idx) => {
                                        // output_dir이 있으면 전달 (process 결과인 경우)
                                        const outputDir = data.output_dir ? `${data.output_dir}/TOP${result.rank}` : null;
                                        const proxyUrl = getProxyImageUrl(imgUrl, outputDir);
                                        const originalUrl = imgUrl.startsWith('/') ? imgUrl : imgUrl.split('?url=')[1] ? decodeURIComponent(imgUrl.split('?url=')[1].split('&')[0]) : imgUrl;
                                        return `
                                        <div class="image-item">
                                            <img src="${proxyUrl}" 
                                                 alt="이미지 ${idx + 1}" 
                                                 loading="lazy"
                                                 data-original-url="${escapeHtml(originalUrl)}"
                                                 onerror="console.error('이미지 로드 실패:', '${originalUrl}'); this.style.display='none'; this.nextElementSibling.style.display='block';"
                                                 onload="console.log('이미지 로드 성공:', '${originalUrl}');">
                                            <div class="image-error" style="display: none;">이미지를 불러올 수 없습니다<br><small>${escapeHtml(originalUrl)}</small></div>
                                            <a href="${originalUrl}" target="_blank" class="image-link">원본 보기</a>
                                        </div>
                                    `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${result.link_urls && result.link_urls.length > 0 ? `
                            <div class="links-container" style="margin-top: 15px;">
                                <h4 style="margin-bottom: 10px; color: #333;">링크 (${result.link_urls.length}개)</h4>
                                <div class="links-list">
                                    ${result.link_urls.map((linkUrl, idx) => `
                                        <div class="link-item">
                                            <a href="${linkUrl}" target="_blank">${escapeHtml(linkUrl)}</a>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${result.body_text && result.body_text.trim() ? `
                            <div class="body-text-container" style="margin-top: 20px;">
                                <h4 style="margin-bottom: 15px; color: #333;">본문 내용</h4>
                                <div class="body-text">${formatText(String(result.body_text).trim())}</div>
                            </div>
                        ` : ''}
                        ${result.error ? `<p class="error-text"><strong>오류:</strong> ${escapeHtml(result.error)}</p>` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    return html;
}

// 유틸리티 함수들
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatText(text) {
    if (!text) {
        console.log('formatText: text가 없습니다');
        return '';
    }
    
    // HTML 이스케이프 먼저 수행
    let escaped = escapeHtml(text);
    
    // 마커를 하이라이트 (숫자가 포함된 경우도 처리)
    // [이미지 삽입], [이미지 삽입1], [이미지 삽입2] 등 모두 매칭
    escaped = escaped.replace(/\[이미지 삽입\d*\]/g, '<span class="media-marker image-marker">$&</span>');
    escaped = escaped.replace(/\[링크 삽입\d*\]/g, '<span class="media-marker link-marker">$&</span>');
    escaped = escaped.replace(/\[이모티콘 삽입\d*\]/g, '<span class="media-marker emoji-marker">$&</span>');
    
    // 줄바꿈 처리
    const formatted = escaped.replace(/\n/g, '<br>');
    
    return formatted;
}

// 전체 처리
async function handleProcess() {
    const keyword = document.getElementById('process-keyword').value.trim();
    const count = parseInt(document.getElementById('process-count').value) || 3;
    const analyze = document.getElementById('process-analyze').checked;
    const topN = parseInt(document.getElementById('process-topn').value) || 20;
    const minLength = parseInt(document.getElementById('process-minlength').value) || 2;
    const minCount = parseInt(document.getElementById('process-mincount').value) || 2;

    if (!keyword) {
        alert('검색 키워드를 입력하세요.');
        return;
    }

    showLoading('전체 처리 시작...');
    updateLoadingStep('블로그 검색 중', 'processing');

    try {
        const response = await fetch(`${API_BASE_URL}/api/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                keyword: keyword,
                n: count,
                analyze: analyze,
                top_n: topN,
                min_length: minLength,
                min_count: minCount
            })
        });

        updateLoadingStep('블로그 검색 중', 'completed');
        updateLoadingStep('블로그 크롤링 중', 'processing');

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || '처리 실패');
        }

        updateLoadingStep('블로그 크롤링 중', 'completed');
        
        if (analyze) {
            updateLoadingStep('키워드 분석 중', 'processing');
            setTimeout(() => {
                updateLoadingStep('키워드 분석 중', 'completed');
                showLoading('완료!');
                setTimeout(() => {
                    showResult(data, 'process');
                }, 500);
            }, 500);
        } else {
            showLoading('완료!');
            setTimeout(() => {
                showResult(data, 'process');
            }, 500);
        }
    } catch (error) {
        showError(error.message);
        hideLoading();
    }
}

// GPT 블로그 생성
async function handleGenerateBlog() {
    const keywords = document.getElementById('generate-keywords').value.trim();
    const mainCategory = document.getElementById('generate-category-main').value;
    const subCategory = document.getElementById('generate-category-sub').value;
    const blogLevel = document.getElementById('generate-blog-level').value;
    const banWords = document.getElementById('generate-ban-words').value.trim();

    // 유효성 검증
    if (!keywords) {
        alert('키워드를 입력하세요.');
        document.getElementById('generate-keywords').focus();
        return;
    }

    if (keywords.length > 100) {
        alert('키워드는 100자 이하여야 합니다.');
        document.getElementById('generate-keywords').focus();
        return;
    }

    // 카테고리 검증
    if (!mainCategory) {
        alert('대분류를 선택하세요.');
        document.getElementById('generate-category-main').focus();
        return;
    }
    
    if (!subCategory) {
        alert('소분류를 선택하세요.');
        document.getElementById('generate-category-sub').focus();
        return;
    }
    
    // 카테고리 값 검증
    if (!NAVER_CATEGORIES[mainCategory]) {
        alert('올바른 대분류를 선택하세요.');
        document.getElementById('generate-category-main').focus();
        return;
    }
    
    const validSubCategories = NAVER_CATEGORIES[mainCategory].subCategories.map(sc => sc.value);
    if (!validSubCategories.includes(subCategory)) {
        alert('올바른 소분류를 선택하세요.');
        document.getElementById('generate-category-sub').focus();
        return;
    }
    
    // 카테고리 전체 이름 구성 (예: "엔터테인먼트·예술 > IT·컴퓨터")
    const mainCategoryName = NAVER_CATEGORIES[mainCategory].name;
    const subCategoryName = NAVER_CATEGORIES[mainCategory].subCategories.find(sc => sc.value === subCategory).label;
    const category = `${mainCategoryName} > ${subCategoryName}`;

    // 블로그 레벨 검증
    const validLevels = ['new', 'mid', 'high'];
    if (!validLevels.includes(blogLevel)) {
        alert('올바른 블로그 레벨을 선택하세요.');
        document.getElementById('generate-blog-level').focus();
        return;
    }

    // 금칙어 검증
    if (banWords && banWords.length > 200) {
        alert('금칙어는 총 200자 이하여야 합니다.');
        document.getElementById('generate-ban-words').focus();
        return;
    }

    // 외부 링크 수집 (new 레벨에서는 사용하지 않음)
    let externalLinks = null;
    if (typeof window.getExternalLinksFromUI === 'function') {
        externalLinks = window.getExternalLinksFromUI(blogLevel);
    }

    // 상위 블로그 자동 수집 및 참고용 블로그 URL 수집
    const useAutoReference = document.getElementById('generate-use-auto-reference').checked;
    let referenceCount = parseInt(document.getElementById('generate-reference-count').value || '3', 10);
    if (Number.isNaN(referenceCount)) referenceCount = 3;
    referenceCount = Math.min(10, Math.max(1, referenceCount));

    let manualReferenceUrls = null;
    if (typeof window.getReferenceBlogsFromUI === 'function') {
        manualReferenceUrls = window.getReferenceBlogsFromUI();
    }

    // 이미지 생성 여부 확인
    const generateImages = document.getElementById('generate-images').checked;

    showLoading('블로그 생성 시작...');

    try {
        const banWordsList = banWords ? banWords.split(',').map(w => w.trim()).filter(w => w) : null;

        // 단계별 진행 상황 표시
        if (useAutoReference || (manualReferenceUrls && manualReferenceUrls.length > 0)) {
            updateLoadingStep('상위 블로그 분석 중', 'processing');
        }
        
        updateLoadingStep('블로그 글 생성 중', 'processing');

        const response = await fetch(`${API_BASE_URL}/api/generate-blog`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                keywords: keywords,
                category: category,
                blog_level: blogLevel,
                ban_words: banWordsList,
                use_auto_reference: useAutoReference,
                reference_count: referenceCount,
                manual_reference_urls: manualReferenceUrls,
                external_links: externalLinks,
                generate_images: generateImages,
                save_json: true
            })
        });

        // 상위 블로그 분석 완료
        if (useAutoReference || (manualReferenceUrls && manualReferenceUrls.length > 0)) {
            updateLoadingStep('상위 블로그 분석 중', 'completed');
        }

        // 블로그 글 생성 완료
        updateLoadingStep('블로그 글 생성 중', 'completed');

        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || '블로그 생성 실패');
        }

        // 이미지 재시도 정보가 있는 경우 표시
        if (generateImages && typeof data.image_retry_count === 'number' && data.image_retry_count > 0) {
            updateLoadingStep('이미지 생성 재시도 중입니다...', 'processing');
            setTimeout(() => {
                updateLoadingStep('이미지 생성 재시도 중입니다...', 'completed');
            }, 500);
        }

        // 이미지 생성 단계 표시 (체크박스가 활성화된 경우만)
        if (generateImages && data.blog_content && data.blog_content.generated_images && data.blog_content.generated_images.length > 0) {
            const imageCount = data.blog_content.generated_images.length;
            updateLoadingStep(`이미지 생성 중 (${imageCount}개)`, 'processing');
            
            // 이미지 생성은 백엔드에서 이미 완료되었으므로 완료로 표시
            setTimeout(() => {
                updateLoadingStep(`이미지 생성 중 (${imageCount}개)`, 'completed');
            }, 500);
        } else if (generateImages) {
            // 이미지 생성이 활성화되었지만 생성된 이미지가 없는 경우 (플레이스홀더가 없거나 생성 실패)
            const imagePlaceholders = data.blog_content?.body?.flatMap(section => 
                section.blocks?.filter(block => block.type === 'image_placeholder') || []
            ) || [];
            if (imagePlaceholders.length > 0) {
                updateLoadingStep('이미지 생성 중', 'processing');
                setTimeout(() => {
                    updateLoadingStep('이미지 생성 중', 'completed');
                }, 500);
            }
        }

        // 저장 중
        updateLoadingStep('파일 저장 중', 'processing');
        
        if (data.json_path) {
            updateLoadingStep('파일 저장 중', 'completed');
        }

        // 완료 메시지
        setTimeout(() => {
            showLoading('완료!');
            setTimeout(() => {
                hideLoading();
                showResult(data, 'generate');
            }, 500);
        }, 1000);

    } catch (error) {
        showError(error.message);
        hideLoading();
    }
}

// 블로그 아이디어 생성
async function handleGenerateIdeas() {
    const keyword = document.getElementById('ideas-keyword').value.trim();
    const topic = document.getElementById('ideas-topic').value.trim();
    const blogProfile = document.getElementById('ideas-blog-profile').value.trim();
    const extraPrompt = document.getElementById('ideas-extra-prompt').value.trim();
    let count = parseInt(document.getElementById('ideas-count').value || '3', 10);

    // 기본 검증
    if (!keyword) {
        alert('대표 키워드를 입력하세요.');
        document.getElementById('ideas-keyword').focus();
        return;
    }

    if (keyword.length > 100) {
        alert('대표 키워드는 100자 이하여야 합니다.');
        document.getElementById('ideas-keyword').focus();
        return;
    }

    if (!topic) {
        alert('주제를 입력하세요.');
        document.getElementById('ideas-topic').focus();
        return;
    }

    if (!blogProfile) {
        alert('내 블로그의 특징을 입력하세요.');
        document.getElementById('ideas-blog-profile').focus();
        return;
    }

    if (Number.isNaN(count)) count = 3;
    count = Math.min(10, Math.max(1, count));

    showIdeasLoading('아이디어 생성 중...');

    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-blog-ideas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                keyword: keyword,
                topic: topic,
                blog_profile: blogProfile,
                extra_prompt: extraPrompt || null,
                count: count,
                save_files: true
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || '아이디어 생성에 실패했습니다.');
        }

        renderIdeasResult(data);
    } catch (error) {
        console.error(error);
        showError(error.message);
    } finally {
        hideIdeasLoading();
    }
}

function showIdeasLoading(message = '아이디어 생성 중...') {
    const ideasLoading = document.getElementById('ideas-loading');
    const ideasLoadingMessage = document.getElementById('ideas-loading-message');
    if (ideasLoading) {
        ideasLoading.style.display = 'block';
        if (ideasLoadingMessage) {
            ideasLoadingMessage.textContent = message;
        }
    }
}

function hideIdeasLoading() {
    const ideasLoading = document.getElementById('ideas-loading');
    if (ideasLoading) {
        ideasLoading.style.display = 'none';
    }
}

function renderIdeasResult(data) {
    const ideasResult = document.getElementById('ideas-result');
    const ideasResultContent = document.getElementById('ideas-result-content');
    const ideasResultActions = document.getElementById('ideas-result-actions');

    if (!ideasResult || !ideasResultContent) return;

    const ideas = data.ideas || [];
    const zipPath = data.zip_path || null;

    // 액션 영역 초기화
    if (ideasResultActions) {
        ideasResultActions.innerHTML = '';
        if (zipPath) {
            const downloadBtn = document.createElement('button');
            downloadBtn.type = 'button';
            downloadBtn.className = 'btn-export';
            downloadBtn.textContent = '전체 ZIP 다운로드';
            downloadBtn.addEventListener('click', () => {
                const downloadUrl = `${API_BASE_URL}${zipPath}`;
                window.location.href = downloadUrl;
            });
            ideasResultActions.appendChild(downloadBtn);
        }
    }

    if (ideas.length === 0) {
        ideasResultContent.innerHTML = '<p>생성된 아이디어가 없습니다.</p>';
        ideasResult.style.display = 'block';
        return;
    }

    let html = '';
    html += `<p class="result-summary">총 <strong>${ideas.length}개</strong>의 아이디어가 생성되었습니다.</p>`;
    html += '<div class="ideas-list">';

    ideas.forEach((idea) => {
        const safeTitle = escapeHtml(idea.title || '');
        const safePrompt = escapeHtml(idea.prompt || '').replace(/\n/g, '<br>');
        const filePath = idea.file_path || null;

        html += `
            <div class="idea-card">
                <div class="idea-card-header">
                    <span class="idea-index">#${idea.index}</span>
                    <h4 class="idea-title">${safeTitle}</h4>
                </div>
                <div class="idea-body">
                    <div class="idea-section">
                        <strong>작성 프롬프트</strong>
                        <div class="idea-prompt">${safePrompt}</div>
                    </div>
                    ${filePath ? `
                        <div class="idea-actions">
                            <a href="${API_BASE_URL}${filePath}" class="btn-secondary-small" download>TXT 다운로드</a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    html += '</div>';

    ideasResultContent.innerHTML = html;
    ideasResult.style.display = 'block';
}

// 네이버 발행용 파일 다운로드
async function handleExportBlog() {
    if (!quillTitle || !quillBody || !quillTags) {
        alert('에디터가 초기화되지 않았습니다.');
        return;
    }

    const blogContent = quillContentToJSON();
    if (!blogContent) {
        alert('블로그 내용을 JSON으로 변환할 수 없습니다.');
        return;
    }

    // 에디터 내 모든 이미지 수집
    const imgNodes = quillBody.root.querySelectorAll('img');
    const images = Array.from(imgNodes).map((img, idx) => {
        const src = img.getAttribute('src') || '';
        return {
            index: idx + 1,
            src,
            style: (window.imageStyleMap && window.imageStyleMap[src]) || null,
            caption: (window.imageCaptionMap && window.imageCaptionMap[src]) || ''
        };
    });

    try {
        showLoading('네이버 발행용 파일 생성 중...');
        updateLoadingStep('에디터 내용을 JSON으로 변환 중', 'processing');

        const res = await fetch(`${API_BASE_URL}/api/export-blog`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                blog_content: blogContent,
                images: images
            })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.error || '파일 내보내기 실패');
        }

        updateLoadingStep('에디터 내용을 JSON으로 변환 중', 'completed');
        updateLoadingStep('파일 패키지 생성 완료', 'completed');

        if (data.zip_path) {
            // ZIP 파일 다운로드
            const downloadUrl = `${API_BASE_URL}${data.zip_path}`;
            window.location.href = downloadUrl;
        } else {
            alert('ZIP 파일 경로를 받지 못했습니다.');
        }

        hideLoading();
    } catch (e) {
        console.error(e);
        hideLoading();
        alert('발행용 파일 생성 중 오류가 발생했습니다: ' + e.message);
    }
}

// JSON 파일 불러오기
// 블로그 콘텐츠 렌더링
function renderBlogContent(content) {
    if (!content) return '';

    const applyStyle = (style) => {
        if (!style) return '';
        let css = '';
        if (style.font_size) css += `font-size: ${style.font_size}px; `;
        // 색상: 기본값 설정하여 검정 배경 문제 해결
        if (style.color) {
            css += `color: ${style.color}; `;
        } else {
            css += 'color: #333333; ';
        }
        // 배경색: 명시적으로 설정
        if (style.background) {
            css += `background-color: ${style.background}; `;
        } else {
            css += 'background-color: transparent; ';
        }
        if (style.bold) css += 'font-weight: bold; ';
        if (style.italic) css += 'font-style: italic; ';
        if (style.underline) css += 'text-decoration: underline; ';
        if (style.line_height) css += `line-height: ${style.line_height}; `;
        if (style.padding) css += `padding: ${style.padding}; `;
        if (style.margin) css += `margin: ${style.margin}; `;
        if (style.border_left) css += `border-left: ${style.border_left}; `;
        if (style.quote) {
            css += 'border-left: 4px solid #cccccc; background-color: #f5f5f5; padding: 10px 15px; margin: 10px 0; ';
            // 인용구도 텍스트 색상 명시
            if (!style.color) {
                css += 'color: #333333; ';
            }
        }
        return css ? `style="${css}"` : '';
    };

    let html = '<div class="blog-content">';

    // 제목
    if (content.title) {
        html += `<h1 ${applyStyle(content.title.style)}>${escapeHtml(content.title.content)}</h1>`;
    }

    // 서론
    if (content.introduction) {
        html += `<div ${applyStyle(content.introduction.style)}>${escapeHtml(content.introduction.content).replace(/\n/g, '<br>')}</div>`;
    }

    // 본문
    if (content.body && Array.isArray(content.body)) {
        html += '<div class="blog-body">';
        content.body.forEach((section, sectionIdx) => {
            html += '<div class="blog-section">';
            
            // 부제목
            if (section.subtitle) {
                html += `<h2 ${applyStyle(section.subtitle.style)}>${escapeHtml(section.subtitle.content)}</h2>`;
            }

            // 블록들
            if (section.blocks && Array.isArray(section.blocks)) {
                html += '<div class="blog-blocks">';
                section.blocks.forEach((block, blockIdx) => {
                    if (block.type === 'paragraph') {
                        html += `<p ${applyStyle(block.style)}>${escapeHtml(block.content).replace(/\n/g, '<br>')}</p>`;
                    } else if (block.type === 'quote') {
                        html += `<blockquote ${applyStyle(block.style)}>${escapeHtml(block.content).replace(/\n/g, '<br>')}</blockquote>`;
                    } else if (block.type === 'list') {
                        html += `<ul ${applyStyle(block.style)}>`;
                        if (block.items && Array.isArray(block.items)) {
                            block.items.forEach(item => {
                                html += `<li>${escapeHtml(item)}</li>`;
                            });
                        }
                        html += '</ul>';
                    } else if (block.type === 'image_placeholder') {
                        html += `<div ${applyStyle(block.style)}>${escapeHtml(block.placeholder || '[이미지 삽입]')}</div>`;
                    } else if (block.type === 'hr') {
                        html += `<hr ${applyStyle(block.style)}>`;
                    }
                });
                html += '</div>';
            }

            html += '</div>';
        });
        html += '</div>';
    }

    // 결론
    if (content.conclusion) {
        html += `<div ${applyStyle(content.conclusion.style)}>${escapeHtml(content.conclusion.content).replace(/\n/g, '<br>')}</div>`;
    }

    // FAQ
    if (content.faq && Array.isArray(content.faq) && content.faq.length > 0) {
        html += '<div class="blog-faq"><h2>자주 묻는 질문</h2>';
        content.faq.forEach((faq, faqIdx) => {
            html += '<div class="faq-item">';
            if (faq.q) {
                html += `<h3 ${applyStyle(faq.q.style)}>Q: ${escapeHtml(faq.q.content)}</h3>`;
            }
            if (faq.a) {
                html += `<p ${applyStyle(faq.a.style)}>A: ${escapeHtml(faq.a.content).replace(/\n/g, '<br>')}</p>`;
            }
            html += '</div>';
        });
        html += '</div>';
    }

    // 태그
    if (content.tags && Array.isArray(content.tags) && content.tags.length > 0) {
        html += '<div class="blog-tags"><strong>태그: </strong>';
        content.tags.forEach((tag, tagIdx) => {
            html += `<span class="tag">#${escapeHtml(tag)}</span>`;
        });
        html += '</div>';
    }

    html += '</div>';

    // 복사 버튼 추가
    html += `
        <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
            <button id="copy-blog-content-btn" onclick="copyBlogContentToNaverEditor()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 14px 32px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
                📋 네이버 에디터에 복사하기
            </button>
            <p style="margin-top: 12px; font-size: 0.9rem; color: #666; line-height: 1.5;">복사 버튼을 클릭하면 스타일이 포함된 HTML 형식으로 클립보드에 복사됩니다.<br>네이버 블로그 에디터에 바로 붙여넣으세요.</p>
        </div>
    `;

    // JSON 원본 보기
    html += `<details style="margin-top: 20px; user-select: none;"><summary style="cursor: pointer; font-weight: 600; color: #667eea;">JSON 원본 보기</summary><pre style="user-select: text; margin-top: 10px;">${JSON.stringify(content, null, 2)}</pre></details>`;

    // 복사를 위한 원본 콘텐츠를 전역 변수에 저장
    window.currentBlogContent = content;

    return html;
}

// 블로그 콘텐츠를 제목, 본문, 태그로 분리하여 렌더링 (Quill 에디터 사용)
function renderBlogContentSeparated(content) {
    if (!content) return;

    // Quill 에디터 초기화
    initializeQuillEditors();

    // 약간의 지연을 두고 콘텐츠 로드 (에디터 초기화 완료 대기)
    setTimeout(() => {
        loadBlogContentToQuill(content);
    }, 200);
}

// 네이버 에디터용 HTML 스타일 적용 함수
function applyNaverStyle(style, isSubtitle = false) {
    let inlineStyle = '';
    
    // 소제목인 경우 강한 기본 스타일 적용 (border-bottom 제거: 네이버 에디터 자동 구분선 방지)
    if (isSubtitle) {
        inlineStyle += 'font-weight: bold; font-size: 20px; color: #333333; margin-top: 0; margin-bottom: 15px; background-color: transparent; display: block; ';
    }
    
    if (!style && !isSubtitle) return '';
    
    // 폰트 크기
    if (style && style.font_size) {
        inlineStyle += `font-size: ${style.font_size}px; `;
    }
    
    // 색상 (배경색 문제 해결: 텍스트 색상이 없으면 기본 색상 사용)
    if (style && style.color) {
        if (!isSubtitle) {
            inlineStyle += `color: ${style.color}; `;
        }
    } else if (!isSubtitle) {
        // 기본 텍스트 색상 (검정색이 아닌 진한 회색)
        inlineStyle += `color: #333333; `;
    }
    
    // 배경색 (명시적으로 설정하여 검정 배경 문제 해결)
    if (style && style.background) {
        inlineStyle += `background-color: ${style.background}; `;
    } else if (!isSubtitle) {
        // 배경색이 없으면 투명
        inlineStyle += `background-color: transparent; `;
    }
    
    // 굵게
    if (style && style.bold && !isSubtitle) {
        inlineStyle += 'font-weight: bold; ';
    }
    
    // 기울임
    if (style && style.italic) {
        inlineStyle += 'font-style: italic; ';
    }
    
    // 밑줄
    if (style && style.underline) {
        inlineStyle += 'text-decoration: underline; ';
    }
    
    // 줄 간격
    if (style && style.line_height) {
        inlineStyle += `line-height: ${style.line_height}; `;
    }
    
    // 패딩
    if (style && style.padding) {
        inlineStyle += `padding: ${style.padding}; `;
    }
    
    // 마진 (소제목이 아니면 스타일의 마진 사용)
    if (style && style.margin && !isSubtitle) {
        inlineStyle += `margin: ${style.margin}; `;
    }
    
    // 왼쪽 테두리
    if (style && style.border_left) {
        inlineStyle += `border-left: ${style.border_left}; `;
    }
    
    // 인용구 스타일
    if (style && style.quote) {
        inlineStyle += 'border-left: 4px solid #cccccc; background-color: #f5f5f5; padding: 10px 15px; margin: 20px 0; ';
        // 인용구는 텍스트 색상도 명시
        if (!style.color) {
            inlineStyle += 'color: #333333; ';
        }
    }
    
    return inlineStyle ? `style="${inlineStyle.trim()}"` : '';
}

// 네이버 에디터에 복사하기 (HTML 형식으로 스타일 포함)
function copyBlogContentToNaverEditor() {
    // Quill 에디터에서 직접 내용 가져오기
    if (!quillTitle || !quillBody || !quillTags) {
        alert('에디터가 초기화되지 않았습니다.');
        return;
    }

    // Quill에서 HTML 가져오기
    const titleHtml = quillTitle.root.innerHTML;
    const bodyHtml = quillBody.root.innerHTML;
    const tagsText = quillTags.getText();

    // 기존 JSON 구조도 유지 (하위 호환성)
    const content = window.currentBlogContent || {};
    let html = '';

    // 제목
    if (titleHtml) {
        html += `<div style="margin-bottom: 20px; font-size: 26px; font-weight: bold; color: #333;">${titleHtml}</div>\n`;
    }

    // 본문 (Quill HTML 사용)
    if (bodyHtml) {
        // 에디터 내에서만 사용되는 이미지 스타일 툴바 제거
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = bodyHtml;
        tempDiv.querySelectorAll('.image-style-toolbar').forEach(el => el.remove());

        let processedBodyHtml = tempDiv.innerHTML;

        // Quill의 이미지 URL을 절대 경로로 변환
        processedBodyHtml = processedBodyHtml.replace(/src="([^"]+)"/g, (match, url) => {
            // 상대 경로인 경우 API_BASE_URL 추가
            if (url.startsWith('/static/')) {
                return `src="${API_BASE_URL}${url}"`;
            }
            // 이미 절대 경로인 경우 그대로
            return match;
        });
        
        html += `<div style="line-height: 1.8; color: #333;">${processedBodyHtml}</div>\n`;
    }

    // 클립보드에 HTML 형식으로 복사
    if (navigator.clipboard && navigator.clipboard.write) {
        // HTML과 플레인 텍스트 모두 제공 (네이버 에디터가 HTML을 인식하도록)
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const textBlob = new Blob([html.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
        const data = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
        });

        navigator.clipboard.write([data]).then(() => {
            const btn = document.getElementById('copy-blog-content-btn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ 복사 완료!';
                btn.style.background = '#28a745';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }, 2000);
            }
            alert('✅ 블로그 내용이 클립보드에 복사되었습니다!\n\nCtrl+V (또는 Cmd+V)로 붙여넣으세요.\n스타일이 포함된 HTML 형식으로 복사되었습니다.');
        }).catch(err => {
            console.error('복사 실패:', err);
            fallbackCopyHTMLToClipboard(html);
        });
    } else {
        fallbackCopyHTMLToClipboard(html);
    }
}

// 폴백: 구형 브라우저용 HTML 복사 함수
function fallbackCopyHTMLToClipboard(html) {
    // HTML을 임시 div에 넣어서 복사
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '1px';
    tempDiv.style.height = '1px';
    tempDiv.style.opacity = '0';
    tempDiv.style.pointerEvents = 'none';
    tempDiv.style.zIndex = '-1';
    document.body.appendChild(tempDiv);

    // 텍스트 선택 및 복사
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(tempDiv);
        selection.removeAllRanges();
        
        if (successful) {
            const btn = document.getElementById('copy-blog-content-btn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ 복사 완료!';
                btn.style.background = '#28a745';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }, 2000);
            }
            alert('✅ 블로그 내용이 클립보드에 복사되었습니다!');
        } else {
            alert('복사에 실패했습니다. 텍스트를 수동으로 선택해서 복사해주세요.');
        }
    } catch (err) {
        document.body.removeChild(tempDiv);
        selection.removeAllRanges();
        alert('복사 중 오류가 발생했습니다. 텍스트를 수동으로 선택해서 복사해주세요.');
    }
}

// 이미지 다운로드 함수
function downloadImage(imageUrl, filename) {
    try {
        // 이미지 URL에서 파일 다운로드
        fetch(imageUrl, {
            method: 'GET',
            headers: {
                'Accept': 'image/*'
            }
        })
            .then(response => {
        if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // Content-Type 확인
                const contentType = response.headers.get('content-type') || 'image/png';
                return response.blob().then(blob => ({ blob, contentType }));
            })
            .then(({ blob, contentType }) => {
                // Blob 타입 확인 및 수정
                if (!blob.type && contentType) {
                    blob = new Blob([blob], { type: contentType });
                }
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                
                // 정리
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
            })
            .catch(error => {
                console.error('이미지 다운로드 실패:', error);
                console.error('이미지 URL:', imageUrl);
                alert(`이미지 다운로드에 실패했습니다: ${error.message}`);
            });
    } catch (error) {
        console.error('이미지 다운로드 오류:', error);
        alert('이미지 다운로드 중 오류가 발생했습니다.');
    }
}


// HTML 이스케이프
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ===== Quill Editor 관련 함수 =====

// 네이버 에디터 기준 폰트 크기 정의
const NAVER_FONT_SIZES = {
    '11': '11px',
    '13': '13px',
    '15': '15px',
    '16': '16px',
    '19': '19px',
    '24': '24px',
    '28': '28px',
    '30': '30px',
    '34': '34px',
    '38': '38px'
};

// 네이버 에디터 스타일 정의
const NAVER_STYLES = {
    'body': '본문',
    'subtitle': '소제목',
    'quote': '인용구'
};

// Quill 커스텀 Size 클래스 등록
const Size = Quill.import('attributors/style/size');
Size.whitelist = Object.keys(NAVER_FONT_SIZES).map(key => NAVER_FONT_SIZES[key]);
Quill.register(Size, true);

// Quill 에디터 인스턴스 저장
let quillTitle = null;
let quillBody = null;
let quillTags = null;

// 에디터 내 이미지 스타일 메타데이터 (src -> 'ai' | 'thumbnail')
window.imageStyleMap = window.imageStyleMap || {};
// 에디터 내 이미지 설명(캡션) 메타데이터 (src -> caption string)
window.imageCaptionMap = window.imageCaptionMap || {};


// localStorage 키
const STORAGE_KEYS = {
    TITLE: 'dmalab_editor_title',
    BODY: 'dmalab_editor_body',
    TAGS: 'dmalab_editor_tags'
};

// 에디터 내용을 localStorage에 저장
function saveEditorContent() {
    try {
        if (quillTitle) {
            const titleContent = quillTitle.getContents();
            localStorage.setItem(STORAGE_KEYS.TITLE, JSON.stringify(titleContent));
        }
        if (quillBody) {
            const bodyContent = quillBody.getContents();
            localStorage.setItem(STORAGE_KEYS.BODY, JSON.stringify(bodyContent));
        }
        if (quillTags) {
            const tagsContent = quillTags.getContents();
            localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tagsContent));
        }
    } catch (error) {
        console.error('에디터 내용 저장 실패:', error);
    }
}

// localStorage에서 에디터 내용 복원
function restoreEditorContent() {
    try {
        if (quillTitle) {
            const savedTitle = localStorage.getItem(STORAGE_KEYS.TITLE);
            if (savedTitle) {
                const titleDelta = JSON.parse(savedTitle);
                if (titleDelta && titleDelta.ops && titleDelta.ops.length > 0) {
                    quillTitle.setContents(titleDelta);
                }
            }
        }
        if (quillBody) {
            const savedBody = localStorage.getItem(STORAGE_KEYS.BODY);
            if (savedBody) {
                const bodyDelta = JSON.parse(savedBody);
                if (bodyDelta && bodyDelta.ops && bodyDelta.ops.length > 0) {
                    quillBody.setContents(bodyDelta);
                }
            }
        }
        if (quillTags) {
            const savedTags = localStorage.getItem(STORAGE_KEYS.TAGS);
            if (savedTags) {
                const tagsDelta = JSON.parse(savedTags);
                if (tagsDelta && tagsDelta.ops && tagsDelta.ops.length > 0) {
                    quillTags.setContents(tagsDelta);
                }
            }
        }
    } catch (error) {
        console.error('에디터 내용 복원 실패:', error);
    }
}

// 에디터 내용 초기화 (localStorage도 함께 삭제)
function clearEditorContent() {
    try {
        localStorage.removeItem(STORAGE_KEYS.TITLE);
        localStorage.removeItem(STORAGE_KEYS.BODY);
        localStorage.removeItem(STORAGE_KEYS.TAGS);
        
        if (quillTitle) quillTitle.setContents([]);
        if (quillBody) quillBody.setContents([]);
        if (quillTags) quillTags.setContents([]);
    } catch (error) {
        console.error('에디터 내용 초기화 실패:', error);
    }
}

// 임시 저장된 에디터 내용이 있는지 확인
function hasSavedEditorContent() {
    try {
        const title = localStorage.getItem(STORAGE_KEYS.TITLE);
        const body = localStorage.getItem(STORAGE_KEYS.BODY);
        const tags = localStorage.getItem(STORAGE_KEYS.TAGS);

        const hasTitle = !!(title && JSON.parse(title)?.ops?.length);
        const hasBody = !!(body && JSON.parse(body)?.ops?.length);
        const hasTags = !!(tags && JSON.parse(tags)?.ops?.length);

        return hasTitle || hasBody || hasTags;
    } catch (e) {
        console.error('임시 저장 여부 확인 중 오류:', e);
        return false;
    }
}

// 새로고침 시 임시 저장된 글을 불러올지 물어보는 팝업 표시
function showRestoreDraftModalIfNeeded() {
    if (!hasSavedEditorContent()) {
        return;
    }

    // 이미 모달이 있으면 다시 만들지 않음
    if (document.querySelector('.autosave-modal-overlay')) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'autosave-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'autosave-modal';
    modal.innerHTML = `
        <h3 class="autosave-modal-title">작성 중이던 글이 있습니다</h3>
        <p class="autosave-modal-message">
            이전에 작성하던 임시 저장 내용을 불러올까요?<br>
            "불러오기"를 선택하면 제목/본문/태그가 복원됩니다.
        </p>
        <div class="autosave-modal-actions">
            <button type="button" class="autosave-btn-primary" data-action="restore">불러오기</button>
            <button type="button" class="autosave-btn-secondary" data-action="discard">새로 작성</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const handleAction = (action) => {
        if (action === 'restore') {
            restoreEditorContent();
        } else if (action === 'discard') {
            clearEditorContent();
        }
        overlay.remove();
    };

    overlay.addEventListener('click', (e) => {
        // 바깥 클릭 시에는 닫지 않고, 버튼으로만 처리
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        handleAction(action);
    });
}

// Quill 에디터 초기화
function initializeQuillEditors() {
    // 제목 에디터
    const titleContainer = document.getElementById('result-title');
    if (titleContainer && !quillTitle) {
        quillTitle = new Quill('#result-title', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'size': Object.values(NAVER_FONT_SIZES) }],
                    ['bold', 'italic', 'underline'],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link']
                ]
            },
            placeholder: '제목을 입력하세요...'
        });
        
        // 제목 변경 시 자동 저장 (디바운싱 적용)
        let titleSaveTimeout = null;
        quillTitle.on('text-change', function() {
            clearTimeout(titleSaveTimeout);
            titleSaveTimeout = setTimeout(() => {
                saveEditorContent();
            }, 500); // 500ms 후 저장
        });

    }

    // 본문 에디터
    const bodyContainer = document.getElementById('result-body');
    if (bodyContainer && !quillBody) {
        const toolbarOptions = [
            [{ 'size': Object.values(NAVER_FONT_SIZES) }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ];
        
        quillBody = new Quill('#result-body', {
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions
            },
            placeholder: '본문을 입력하세요...'
        });

        // 이미지 업로드 핸들러
        quillBody.getModule('toolbar').addHandler('image', function() {
            selectLocalImage();
        });

        // 이미지 클릭 시 스타일 편집 UI 표시 (에디터 DOM을 직접 수정하지 않고, 바깥에 오버레이로 표시)
        quillBody.root.addEventListener('click', function (event) {
            const img = event.target.closest('img');

            // 이미지 외 영역 클릭 시 기존 오버레이 제거
            if (!img) {
                const existingOverlay = document.querySelector('.image-style-toolbar-overlay');
                if (existingOverlay) existingOverlay.remove();
                return;
            }

            const src = img.getAttribute('src');
            if (!src) return;

            // 기존 오버레이 제거 후 새로 생성
            const existingOverlay = document.querySelector('.image-style-toolbar-overlay');
            if (existingOverlay) existingOverlay.remove();

            const overlay = document.createElement('div');
            overlay.className = 'image-style-toolbar-overlay image-style-toolbar';
            overlay.innerHTML = `
                <div class="image-style-row">
                    <span class="image-style-label">이미지 스타일:</span>
                    <button type="button" data-style="ai">AI 생성</button>
                    <button type="button" data-style="thumbnail">썸네일</button>
                </div>
                <div class="image-caption-row">
                    <input type="text" class="image-caption-input" placeholder="이미지 설명 (파일 제목용) 입력..." />
                </div>
            `;

            // 현재 스타일 반영
            const currentStyle = window.imageStyleMap[src] || '';
            overlay.querySelectorAll('button[data-style]').forEach(btn => {
                if (btn.getAttribute('data-style') === currentStyle) {
                    btn.classList.add('active');
                }
            });

            // 현재 캡션 반영
            const captionInput = overlay.querySelector('.image-caption-input');
            if (captionInput) {
                captionInput.value = window.imageCaptionMap[src] || '';
                captionInput.addEventListener('input', () => {
                    const value = captionInput.value.trim();
                    if (value) {
                        window.imageCaptionMap[src] = value;
                        // 이미지 데이터 속성에도 저장 (추후 활용)
                        img.dataset.caption = value;
                    } else {
                        delete window.imageCaptionMap[src];
                        delete img.dataset.caption;
                    }
                });
            }

            // 버튼 클릭 핸들러
            overlay.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-style]');
                if (!btn) return;
                const style = btn.getAttribute('data-style');

                const prev = window.imageStyleMap[src] || '';

                let nextStyle = style;
                // 같은 버튼을 다시 누르면 해제(기본 본문 이미지)
                if (prev === style) {
                    nextStyle = '';
                }

                // 메타데이터 갱신
                if (nextStyle) {
                    window.imageStyleMap[src] = nextStyle;
                } else {
                    delete window.imageStyleMap[src];
                }

                // 버튼 active 상태 갱신
                overlay.querySelectorAll('button[data-style]').forEach(b => b.classList.remove('active'));
                if (nextStyle) {
                    btn.classList.add('active');
                }

                // 이미지 클래스/데이터 속성 갱신
                img.classList.remove('img-style-ai', 'img-style-thumbnail');
                img.dataset.style = nextStyle || '';
                if (nextStyle === 'ai') img.classList.add('img-style-ai');
                if (nextStyle === 'thumbnail') img.classList.add('img-style-thumbnail');
            });

            // 화면 좌표 기준으로 이미지 바로 아래에 오버레이 위치시키기
            const imgRect = img.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;

            overlay.style.top = `${imgRect.bottom + scrollY + 4}px`;
            overlay.style.left = `${imgRect.left + scrollX}px`;

            document.body.appendChild(overlay);
        });
        
        // 툴바에 스타일 드롭다운 추가 (본문 / 소제목 / 인용구)
        setTimeout(() => {
            const toolbarModule = quillBody.getModule('toolbar');
            if (!toolbarModule || !toolbarModule.container) {
                console.warn('[DMaLab] Quill toolbar 모듈을 찾을 수 없습니다.');
                return;
            }

            const toolbar = toolbarModule.container;

            // 이미 추가되어 있다면 다시 추가하지 않음
            if (toolbar.querySelector('.ql-style-custom')) {
                return;
            }

            const styleContainer = document.createElement('span');
            styleContainer.className = 'ql-formats';

            const styleSelect = document.createElement('select');
            styleSelect.className = 'ql-style-custom';
            styleSelect.title = '글 스타일';

            Object.keys(NAVER_STYLES).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = NAVER_STYLES[key]; // 본문 / 소제목 / 인용구
                styleSelect.appendChild(option);
            });

            // 기본 선택값을 '본문'으로 설정
            styleSelect.value = 'body';

            styleSelect.addEventListener('change', function() {
                const value = this.value;
                const range = quillBody.getSelection(true);
                if (!range) return;

                if (value === 'subtitle') {
                    // 소제목: H2
                    quillBody.formatLine(range.index, range.length, 'header', 2);
                    quillBody.formatLine(range.index, range.length, 'blockquote', false);
                } else if (value === 'quote') {
                    // 인용구
                    quillBody.formatLine(range.index, range.length, 'header', false);
                    quillBody.formatLine(range.index, range.length, 'blockquote', true);
                } else if (value === 'body') {
                    // 본문
                    quillBody.formatLine(range.index, range.length, 'header', false);
                    quillBody.formatLine(range.index, range.length, 'blockquote', false);
                }
                // 선택값은 유지해서 드롭다운에 현재 스타일이 보이도록 함
            });

            styleContainer.appendChild(styleSelect);
            // 툴바 맨 앞에 스타일 드롭다운 삽입
            toolbar.insertBefore(styleContainer, toolbar.firstChild);

            console.log('[DMaLab] 스타일 드롭다운 추가 완료');

            // 현재 커서 위치에 따라 드롭다운 값을 동기화하는 헬퍼
            const syncStyleSelectWithCursor = () => {
                // focus=true를 주지 않아서 다른 에디터(제목/태그)로 포커스를 옮겼을 때
                // 다시 본문으로 포커스가 강제로 돌아오지 않도록 함
                const range = quillBody.getSelection();
                if (!range) return;
                const format = quillBody.getFormat(range);
                if (format.header === 2) {
                    styleSelect.value = 'subtitle';
                } else if (format.blockquote) {
                    styleSelect.value = 'quote';
                } else {
                    styleSelect.value = 'body';
                }
            };

            // 선택 변경 / 내용 변경 시 드롭다운 값 업데이트
            quillBody.on('selection-change', () => {
                syncStyleSelectWithCursor();
            });
            quillBody.on('text-change', () => {
                syncStyleSelectWithCursor();
            });
        }, 150);
        
        // 본문 변경 시 자동 저장 (디바운싱 적용)
        let bodySaveTimeout = null;
        quillBody.on('text-change', function() {
            clearTimeout(bodySaveTimeout);
            bodySaveTimeout = setTimeout(() => {
                saveEditorContent();
            }, 500); // 500ms 후 저장
        });
    }

    // 태그 에디터 (툴바 없이 간단한 텍스트 입력)
    const tagsContainer = document.getElementById('result-tags');
    if (tagsContainer && !quillTags) {
        quillTags = new Quill('#result-tags', {
            theme: 'snow',
            modules: {
                toolbar: false
            },
            placeholder: '태그를 입력하세요 (쉼표로 구분)...'
        });
        
        // 태그 변경 시 자동 저장 (디바운싱 적용)
        let tagsSaveTimeout = null;
        quillTags.on('text-change', function() {
            clearTimeout(tagsSaveTimeout);
            tagsSaveTimeout = setTimeout(() => {
                saveEditorContent();
            }, 500); // 500ms 후 저장
        });
    }
    
    // 에디터 초기화 후 저장된 내용 복원 (단, loadBlogContentToQuill이 호출되지 않은 경우만)
    // loadBlogContentToQuill이 호출되면 자동으로 복원하지 않음
    if (!window._isLoadingBlogContent) {
        setTimeout(() => {
            restoreEditorContent();
        }, 100);
    }
}

// 로컬 이미지 선택 및 삽입
function selectLocalImage() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
        const file = input.files[0];
        if (file) {
            // 파일 크기 체크 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                alert('이미지 크기는 5MB 이하여야 합니다.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                if (!quillBody) {
                    console.error('[DMaLab] quillBody 인스턴스를 찾을 수 없어 이미지를 삽입하지 못했습니다.');
                    return;
                }

                let range = quillBody.getSelection(true);
                // 선택 영역이 없으면 문서 끝에 삽입
                if (!range) {
                    range = { index: quillBody.getLength(), length: 0 };
                }

                try {
                    quillBody.insertEmbed(range.index, 'image', imageUrl, 'user');
                    // 이미지 뒤에 줄바꿈 추가
                    quillBody.setSelection(range.index + 1, 0);
                } catch (err) {
                    console.error('[DMaLab] 이미지 삽입 중 오류:', err);
                }
            };
            reader.readAsDataURL(file);
        }
    };
}

// JSON 스타일 정보를 Quill Delta 형식으로 변환
function styleToQuillDelta(content, style) {
    if (!content) return null;

    const ops = [];
    const lines = content.split('\n');
    
    lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
            ops.push({ insert: '\n' });
        }

        if (line.trim()) {
            const op = { insert: line };
            
            // 스타일 속성을 class로 변환
            const classes = [];
            const attributes = {};

            if (style) {
                if (style.font_size) {
                    attributes.size = getQuillSize(style.font_size);
                }
                if (style.color) {
                    attributes.color = style.color;
                }
                if (style.background) {
                    attributes.background = style.background;
                }
                if (style.bold) {
                    attributes.bold = true;
                }
                if (style.italic) {
                    attributes.italic = true;
                }
                if (style.underline) {
                    attributes.underline = true;
                }
                if (style.quote) {
                    attributes.blockquote = true;
                }
            }

            if (Object.keys(attributes).length > 0) {
                op.attributes = attributes;
            }

            ops.push(op);
        }
    });

    return { ops };
}

// 폰트 크기를 Quill size로 변환 (네이버 에디터 기준)
function getQuillSize(fontSize) {
    // 네이버 에디터 기준 폰트 크기로 매핑
    const sizeMap = {
        11: '11px',
        13: '13px',
        15: '15px',
        16: '16px',
        19: '19px',
        24: '24px',
        28: '28px',
        30: '30px',
        34: '34px',
        38: '38px'
    };
    
    // 가장 가까운 크기 찾기
    const sizes = Object.keys(sizeMap).map(Number).sort((a, b) => a - b);
    let closestSize = 16; // 기본값
    
    for (let i = 0; i < sizes.length; i++) {
        if (fontSize <= sizes[i]) {
            closestSize = sizes[i];
            break;
        }
        closestSize = sizes[i];
    }
    
    return sizeMap[closestSize] || '16px';
}

// Quill Delta를 JSON 스타일 형식으로 변환
function quillDeltaToStyle(delta) {
    if (!delta || !delta.ops) return { content: '', style: {} };

    let content = '';
    const style = {
        font_size: 16,
        color: null,
        background: null,
        bold: false,
        italic: false,
        underline: false,
        quote: false
    };

    // 첫 번째 op의 스타일 정보 추출
    const firstOp = delta.ops.find(op => op.insert && typeof op.insert === 'string' && op.insert.trim());
    if (firstOp && firstOp.attributes) {
        const attrs = firstOp.attributes;
        
        if (attrs.size) {
            style.font_size = getFontSizeFromQuillSize(attrs.size);
        }
        if (attrs.color) {
            style.color = attrs.color;
        }
        if (attrs.background) {
            style.background = attrs.background;
        }
        if (attrs.bold) {
            style.bold = true;
        }
        if (attrs.italic) {
            style.italic = true;
        }
        if (attrs.underline) {
            style.underline = true;
        }
        if (attrs.blockquote) {
            style.quote = true;
        }
    }

    // 전체 텍스트 추출
    delta.ops.forEach(op => {
        if (typeof op.insert === 'string') {
            content += op.insert;
        } else if (op.insert && op.insert.image) {
            // 이미지는 placeholder로 처리
            content += '[이미지]\n';
        }
    });

    return { content: content.trim(), style };
}

// Quill size를 폰트 크기로 변환 (네이버 에디터 기준)
function getFontSizeFromQuillSize(size) {
    if (!size) return 16; // 기본값
    
    // '11px', '13px' 등의 형식에서 숫자만 추출
    const match = size.match(/(\d+)px/);
    if (match) {
        return parseInt(match[1], 10);
    }
    
    // 기존 매핑 (하위 호환성)
    const sizeMap = {
        'small': 13,
        'large': 19,
        'huge': 24
    };
    return sizeMap[size] || 16;
}

// JSON 블로그 콘텐츠를 Quill 에디터에 로드
function loadBlogContentToQuill(content) {
    if (!content) return;

    // 에디터 초기화 확인
    if (!quillTitle || !quillBody || !quillTags) {
        window._isLoadingBlogContent = true; // 콘텐츠 로딩 중 플래그 설정
        initializeQuillEditors();
        // 초기화 후 약간의 지연을 두고 로드
        setTimeout(() => {
            loadBlogContentToQuill(content);
        }, 200);
        return;
    }
    
    // 새 콘텐츠 로드 시 기존 저장된 내용은 덮어쓰기 (블로그 생성 시)
    window._isLoadingBlogContent = true; // 콘텐츠 로딩 중 플래그 설정

    // 제목 로드
    if (content.title) {
        const titleDelta = styleToQuillDelta(content.title.content, content.title.style);
        if (titleDelta) {
            quillTitle.setContents(titleDelta);
        }
    }

    // 본문을 Delta 형식으로 구성
    const bodyOps = [];
    const generatedImages = content.generated_images || [];
    let globalImageIndex = 1;

    // 서론
    if (content.introduction) {
        const introDelta = styleToQuillDelta(content.introduction.content, content.introduction.style);
        if (introDelta && introDelta.ops) {
            bodyOps.push(...introDelta.ops);
            bodyOps.push({ insert: '\n\n' });
        }
    }

    // 본문 섹션들
    if (content.body && Array.isArray(content.body)) {
        content.body.forEach((section, sectionIdx) => {
            // 섹션 간 구분선 (첫 섹션이 아니면)
            if (sectionIdx > 0) {
                bodyOps.push({ insert: '\n' });
            }

            // 부제목
            if (section.subtitle) {
                const subtitleDelta = styleToQuillDelta(section.subtitle.content, section.subtitle.style);
                if (subtitleDelta && subtitleDelta.ops) {
                    // 부제목은 header로 설정
                    subtitleDelta.ops.forEach(op => {
                        if (op.insert && typeof op.insert === 'string') {
                            if (!op.attributes) op.attributes = {};
                            op.attributes.header = 2;
                            if (section.subtitle.style && section.subtitle.style.bold) {
                                op.attributes.bold = true;
                            }
                        }
                    });
                    bodyOps.push(...subtitleDelta.ops);
                    bodyOps.push({ insert: '\n\n' });
                }
            }

            // 블록들
            if (section.blocks && Array.isArray(section.blocks)) {
                section.blocks.forEach((block) => {
                    if (block.type === 'paragraph') {
                        const paraDelta = styleToQuillDelta(block.content, block.style);
                        if (paraDelta && paraDelta.ops) {
                            bodyOps.push(...paraDelta.ops);
                            bodyOps.push({ insert: '\n\n' });
                        }
                    } else if (block.type === 'quote') {
                        const quoteDelta = styleToQuillDelta(block.content, block.style);
                        if (quoteDelta && quoteDelta.ops) {
                            quoteDelta.ops.forEach(op => {
                                if (op.insert && typeof op.insert === 'string') {
                                    if (!op.attributes) op.attributes = {};
                                    op.attributes.blockquote = true;
                                }
                            });
                            bodyOps.push(...quoteDelta.ops);
                            bodyOps.push({ insert: '\n\n' });
                        }
                    } else if (block.type === 'list') {
                        if (block.items && Array.isArray(block.items)) {
                            block.items.forEach(item => {
                                bodyOps.push({ insert: item });
                                if (block.style) {
                                    const attrs = {};
                                    if (block.style.font_size) {
                                        attrs.size = getQuillSize(block.style.font_size);
                                    }
                                    if (block.style.color) {
                                        attrs.color = block.style.color;
                                    }
                                    if (block.style.bold) attrs.bold = true;
                                    if (block.style.italic) attrs.italic = true;
                                    if (Object.keys(attrs).length > 0) {
                                        bodyOps[bodyOps.length - 1].attributes = attrs;
                                    }
                                }
                                bodyOps.push({ insert: '\n', attributes: { list: 'bullet' } });
                            });
                        }
                        bodyOps.push({ insert: '\n' });
                    } else if (block.type === 'image_placeholder') {
                        const imageInfo = generatedImages.find(img => 
                            img.index === globalImageIndex || 
                            img.placeholder === block.placeholder
                        );
                        
                        if (imageInfo && imageInfo.image_path) {
                            // 이미지 URL 구성
                            let normalizedPath = imageInfo.image_path.replace(/\\/g, '/');
                            
                            // 상대 경로인 경우 절대 경로로 변환
                            let imageUrl;
                            if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
                                // 이미 절대 URL인 경우
                                imageUrl = normalizedPath;
                            } else if (normalizedPath.startsWith('/static/')) {
                                // /static/로 시작하는 경우
                                imageUrl = `${API_BASE_URL}${normalizedPath}`;
                            } else {
                                // 상대 경로인 경우
                                imageUrl = `${API_BASE_URL}/static/blog/create_naver/${normalizedPath}`;
                            }
                            
                            console.log('[이미지 삽입]', {
                                imageInfo,
                                normalizedPath,
                                imageUrl,
                                globalImageIndex
                            });
                            
                            // Quill에 이미지 삽입
                            bodyOps.push({ insert: { image: imageUrl } });
                            bodyOps.push({ insert: '\n\n' });
                        } else {
                            // 플레이스홀더 텍스트
                            const placeholderDelta = styleToQuillDelta(block.placeholder || '[이미지 삽입]', block.style);
                            if (placeholderDelta && placeholderDelta.ops) {
                                bodyOps.push(...placeholderDelta.ops);
                                bodyOps.push({ insert: '\n\n' });
                            }
                        }
                        globalImageIndex++;
                    } else if (block.type === 'hr') {
                        bodyOps.push({ insert: '\n' });
                        // Quill은 hr을 직접 지원하지 않으므로 구분선으로 표시
                        bodyOps.push({ insert: '---\n\n' });
                    }
                });
            }
        });
    }

    // 결론
    if (content.conclusion) {
        const conclusionDelta = styleToQuillDelta(content.conclusion.content, content.conclusion.style);
        if (conclusionDelta && conclusionDelta.ops) {
            bodyOps.push({ insert: '\n' });
            bodyOps.push(...conclusionDelta.ops);
            bodyOps.push({ insert: '\n\n' });
        }
    }

    // FAQ
    if (content.faq && Array.isArray(content.faq) && content.faq.length > 0) {
        bodyOps.push({ insert: '자주 묻는 질문\n\n', attributes: { header: 2, bold: true } });
        content.faq.forEach((faq) => {
            if (faq.q) {
                const qDelta = styleToQuillDelta('Q: ' + faq.q.content, faq.q.style);
                if (qDelta && qDelta.ops) {
                    qDelta.ops.forEach(op => {
                        if (op.insert && typeof op.insert === 'string' && !op.attributes) {
                            op.attributes = { bold: true };
                        }
                    });
                    bodyOps.push(...qDelta.ops);
                    bodyOps.push({ insert: '\n' });
                }
            }
            if (faq.a) {
                const aDelta = styleToQuillDelta('A: ' + faq.a.content, faq.a.style);
                if (aDelta && aDelta.ops) {
                    bodyOps.push(...aDelta.ops);
                    bodyOps.push({ insert: '\n\n' });
                }
            }
        });
    }

    // 본문을 Quill에 설정
    quillBody.setContents({ ops: bodyOps });
    
    // 콘텐츠 로드 후 자동 저장
    setTimeout(() => {
        saveEditorContent();
        window._isLoadingBlogContent = false; // 콘텐츠 로딩 완료
    }, 100);

    // 태그 로드
    if (content.tags && Array.isArray(content.tags) && content.tags.length > 0) {
        quillTags.setText(content.tags.join(', '));
    }
}

// Quill 에디터 내용을 JSON 형식으로 변환
function quillContentToJSON() {
    if (!quillTitle || !quillBody || !quillTags) {
        return null;
    }

    const titleDelta = quillTitle.getContents();
    const bodyDelta = quillBody.getContents();
    
    // 본문 Delta를 줄 단위로 분해
    const bodyOps = (bodyDelta && bodyDelta.ops) || [];
    const lines = []; // { type: 'text'|'image', delta?, attrs?, src? }
    let currentLineOps = [];
    
    bodyOps.forEach(op => {
        if (typeof op.insert === 'string') {
            if (op.insert === '\n') {
                // 줄 종료 (블록 속성 포함)
                lines.push({
                    type: 'text',
                    delta: { ops: currentLineOps },
                    attrs: op.attributes || {}
                });
                currentLineOps = [];
            } else if (op.insert.includes('\n')) {
                const parts = op.insert.split('\n');
                parts.forEach((part, idx) => {
                    if (part.length > 0) {
                        currentLineOps.push({
                            insert: part,
                            attributes: op.attributes
                        });
                    }
                    if (idx < parts.length - 1) {
                        lines.push({
                            type: 'text',
                            delta: { ops: currentLineOps },
                            attrs: op.attributes || {}
                        });
                        currentLineOps = [];
                    }
                });
            } else {
                currentLineOps.push(op);
            }
        } else if (op.insert && op.insert.image) {
            // 이전에 쌓인 텍스트 라인 flush
            if (currentLineOps.length > 0) {
                lines.push({
                    type: 'text',
                    delta: { ops: currentLineOps },
                    attrs: {}
                });
                currentLineOps = [];
            }
            
            lines.push({
                type: 'image',
                src: op.insert.image,
                attrs: op.attributes || {}
            });
        }
    });
    
    // 마지막 라인 flush
    if (currentLineOps.length > 0) {
        lines.push({
            type: 'text',
            delta: { ops: currentLineOps },
            attrs: {}
        });
    }
    
    // 섹션 구성: header=2 는 소제목, 그 외는 paragraph
    const body = [];
    let currentSection = null;
    let imageIndex = 1;
    
    const ensureDefaultSection = () => {
        if (!currentSection) {
            currentSection = {
                subtitle: {
                    content: '본문',
                    style: { font_size: 20, bold: true }
                },
                blocks: []
            };
            body.push(currentSection);
        }
    };
    
    lines.forEach(line => {
        if (line.type === 'image') {
            ensureDefaultSection();
            const src = line.src || '';
            const caption = (window.imageCaptionMap && window.imageCaptionMap[src]) || '';
            const placeholder = caption || `[이미지 ${imageIndex}]`;
            
            currentSection.blocks.push({
                type: 'image_placeholder',
                placeholder: placeholder,
                image_prompt: '',
                index: imageIndex
            });
            imageIndex++;
        } else if (line.type === 'text' && line.delta && line.delta.ops && line.delta.ops.length > 0) {
            const lineData = quillDeltaToStyle(line.delta);
            if (!lineData.content) {
                return;
            }
            
            const isHeader2 = line.attrs && line.attrs.header === 2;
            
            if (isHeader2) {
                currentSection = {
                    subtitle: {
                        content: lineData.content,
                        style: Object.assign({}, lineData.style, { bold: true })
                    },
                    blocks: []
                };
                body.push(currentSection);
            } else {
                ensureDefaultSection();
                const style = Object.assign({}, lineData.style);
                if (line.attrs && line.attrs.blockquote) {
                    style.quote = true;
                }
                currentSection.blocks.push({
                    type: 'paragraph',
                    content: lineData.content,
                    style: style
                });
            }
        }
    });

    // 제목
    const titleData = quillDeltaToStyle(titleDelta);
    const title = {
        content: titleData.content,
        style: titleData.style
    };

    // 태그
    const tagsText = quillTags.getText();
    const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);

    return {
        title: title,
        introduction: { content: '', style: {} },
        body: body,
        conclusion: { content: '', style: {} },
        faq: [],
        tags: tags
    };
}

