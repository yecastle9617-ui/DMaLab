"""
FastAPI 서버 애플리케이션
네이버 블로그 크롤링 및 키워드 분석 API
"""

import sys
from pathlib import Path

# 프로젝트 루트를 sys.path에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import uvicorn
import requests
from urllib.parse import quote, unquote, urlparse
import hashlib
from pathlib import Path

from crawler.naver_crawler import NaverCrawler
from analyzer.morpheme_analyzer import MorphemeAnalyzer

# FastAPI 앱 생성
app = FastAPI(
    title="네이버 블로그 크롤링 API",
    description="네이버 블로그 검색, 크롤링 및 키워드 분석 API",
    version="1.0.0"
)

# 이미지 저장 기본 디렉토리 설정 (naver_crawler 하위)
current_dir = Path(__file__).parent
project_dir = current_dir.parent
NAVER_CRAWLER_DIR = project_dir / "naver_crawler"
NAVER_CRAWLER_DIR.mkdir(parents=True, exist_ok=True)

# 정적 파일 서빙 (naver_crawler 디렉토리 전체)
app.mount("/static/naver_crawler", StaticFiles(directory=str(NAVER_CRAWLER_DIR)), name="static_naver_crawler")

# CORS 설정 (필요시 수정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용하세요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Pydantic 모델 정의 =====

class BlogInfo(BaseModel):
    """블로그 정보 모델"""
    title: str
    url: str


class SearchRequest(BaseModel):
    """검색 요청 모델"""
    keyword: str = Field(..., description="검색 키워드")
    n: int = Field(default=3, ge=1, le=10, description="가져올 블로그 개수 (1-10)")


class SearchResponse(BaseModel):
    """검색 응답 모델"""
    keyword: str
    count: int
    blogs: List[BlogInfo]


class CrawlRequest(BaseModel):
    """크롤링 요청 모델 (단일)"""
    url: str = Field(..., description="블로그 URL")
    title: Optional[str] = Field(None, description="블로그 제목 (선택사항)")


class CrawlBulkRequest(BaseModel):
    """크롤링 요청 모델 (리스트)"""
    urls: List[str] = Field(..., description="크롤링할 블로그 URL 리스트")
    titles: Optional[List[Optional[str]]] = Field(None, description="블로그 제목 리스트 (선택사항, urls와 같은 길이)")


class CrawlResponse(BaseModel):
    """크롤링 응답 모델"""
    success: bool
    title: Optional[str] = None
    url: str
    body_text: Optional[str] = None
    body_length: Optional[int] = None
    image_urls: Optional[List[str]] = None
    link_urls: Optional[List[str]] = None
    txt_path: Optional[str] = None
    error: Optional[str] = None


class CrawlBulkResponse(BaseModel):
    """크롤링 응답 모델 (리스트)"""
    total_count: int
    success_count: int
    results: List[CrawlResponse]


class AnalyzeRequest(BaseModel):
    """키워드 분석 요청 모델"""
    text: str = Field(..., description="분석할 텍스트")
    top_n: int = Field(default=20, ge=1, le=100, description="상위 N개 키워드")
    min_length: int = Field(default=2, ge=1, description="최소 키워드 길이")
    min_count: int = Field(default=2, ge=1, description="최소 출현 횟수")


class KeywordStat(BaseModel):
    """키워드 통계 모델"""
    keyword: str
    count: int
    rank: int


class AnalyzeResponse(BaseModel):
    """키워드 분석 응답 모델"""
    success: bool
    total_keywords: int
    keywords: List[KeywordStat]
    excel_path: Optional[str] = None
    error: Optional[str] = None


class ProcessRequest(BaseModel):
    """전체 처리 요청 모델 (검색 + 크롤링 + 분석)"""
    keyword: str = Field(..., description="검색 키워드")
    n: int = Field(default=3, ge=1, le=10, description="처리할 블로그 개수")
    analyze: bool = Field(default=True, description="키워드 분석 수행 여부")
    top_n: int = Field(default=20, ge=1, le=100, description="상위 N개 키워드")
    min_length: int = Field(default=2, ge=1, description="최소 키워드 길이")
    min_count: int = Field(default=2, ge=1, description="최소 출현 횟수")


class ProcessResult(BaseModel):
    """단일 블로그 처리 결과"""
    rank: int
    title: str
    url: str
    success: bool
    body_text: Optional[str] = None
    body_length: Optional[int] = None
    image_urls: Optional[List[str]] = None
    link_urls: Optional[List[str]] = None
    txt_path: Optional[str] = None
    excel_path: Optional[str] = None
    keywords: Optional[List[KeywordStat]] = None
    error: Optional[str] = None


class ProcessResponse(BaseModel):
    """전체 처리 응답 모델"""
    keyword: str
    output_dir: str
    total_count: int
    success_count: int
    results: List[ProcessResult]


# ===== 유틸리티 함수 =====

def get_output_directory(count: int = 10):
    """
    실행 시간 기준으로 출력 디렉토리 경로를 생성합니다.
    
    Args:
        count: 생성할 TOP 디렉토리 개수 (기본값: 10)
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(current_dir)
    
    base_dir = os.path.join(project_dir, "naver_crawler")
    if not os.path.exists(base_dir):
        os.makedirs(base_dir, exist_ok=True)
    
    today = datetime.now().strftime("%Y%m%d")
    dir_pattern = f"{today}_"
    existing_dirs = [d for d in os.listdir(base_dir) if d.startswith(dir_pattern) and os.path.isdir(os.path.join(base_dir, d))]
    
    max_num = 0
    for dir_name in existing_dirs:
        try:
            num = int(dir_name.split('_')[-1])
            max_num = max(max_num, num)
        except ValueError:
            continue
    
    next_num = max_num + 1
    output_dir = os.path.join(base_dir, f"{today}_{next_num}")
    os.makedirs(output_dir, exist_ok=True)
    
    # 요청한 개수만큼만 TOP 디렉토리 생성
    for rank in range(1, count + 1):
        top_dir = os.path.join(output_dir, f"TOP{rank}")
        os.makedirs(top_dir, exist_ok=True)
    
    return output_dir


def process_single_blog(
    crawler: NaverCrawler,
    blog_info: Dict[str, str],
    rank: int,
    base_output_dir: str,
    analyze: bool = True,
    top_n: int = 20,
    min_length: int = 2,
    min_count: int = 2
) -> ProcessResult:
    """단일 블로그를 처리하는 함수"""
    result = ProcessResult(
        rank=rank,
        title=blog_info['title'],
        url=blog_info['url'],
        success=False
    )
    
    try:
        top_dir = os.path.join(base_output_dir, f"TOP{rank}")
        
        # 본문 텍스트 및 미디어 URL 추출
        media_result = crawler.extract_blog_body_with_media(blog_info['url'])
        
        if not media_result or not media_result.get('body_text'):
            result.error = "본문 텍스트를 추출할 수 없습니다."
            return result
        
        body_text = media_result['body_text']
        result.body_text = body_text
        result.body_length = len(body_text)
        
        # 이미지 URL을 다운로드하여 저장하고 경로 변환 (마커 순서와 일치)
        original_image_urls = media_result.get('image_urls', [])
        saved_image_paths = []
        for idx, img_url in enumerate(original_image_urls, 1):
            # 블로그 URL을 Referer로 전달하여 원본 이미지 다운로드
            # NaverCrawler의 세션을 사용하여 쿠키와 헤더 유지
            saved_path = download_and_save_image(
                img_url, 
                top_dir, 
                image_index=idx, 
                referer_url=blog_info['url'],
                session=crawler.session
            )
            if saved_path:
                # 저장된 경로는 상대 경로로 반환 (프론트엔드에서 API_BASE_URL 추가)
                saved_image_paths.append(saved_path)
            else:
                # 저장 실패 시 프록시 URL 사용
                saved_image_paths.append(f"/api/image-proxy?url={quote(img_url)}&output_dir={quote(top_dir)}&referer={quote(blog_info['url'])}")
        
        result.image_urls = saved_image_paths
        result.link_urls = media_result.get('link_urls', [])
        
        # 본문을 txt 파일로 저장
        txt_path = crawler.save_blog_to_txt(
            blog_info['url'],
            title=blog_info['title'],
            output_dir=top_dir
        )
        result.txt_path = txt_path
        
        # 키워드 분석
        if analyze:
            try:
                analyzer = MorphemeAnalyzer(use_konlpy=True)
                
                # 키워드 통계 가져오기
                keyword_stats = analyzer.get_keyword_ranking(
                    body_text,
                    top_n=top_n,
                    min_length=min_length,
                    min_count=min_count
                )
                
                # 키워드 리스트 생성
                keywords = [
                    KeywordStat(keyword=k, count=v['count'], rank=v['rank'])
                    for k, v in keyword_stats.items()
                ]
                result.keywords = keywords
                
                # 엑셀 파일로 저장
                if txt_path:
                    base_name = os.path.splitext(os.path.basename(txt_path))[0]
                    excel_path = os.path.join(top_dir, f"{base_name}_keyword_analysis.xlsx")
                else:
                    excel_filename = f"blog_{int(datetime.now().timestamp())}_keyword_analysis.xlsx"
                    excel_path = os.path.join(top_dir, excel_filename)
                
                excel_path = analyzer.export_to_excel(
                    body_text,
                    output_path=excel_path,
                    top_n=top_n,
                    min_length=min_length,
                    min_count=min_count
                )
                result.excel_path = excel_path
                
            except Exception as e:
                result.error = f"형태소 분석 오류: {str(e)}"
        
        result.success = True
        
    except Exception as e:
        result.error = str(e)
    
    return result


# ===== API 엔드포인트 =====

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "네이버 블로그 크롤링 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}


@app.post("/api/search", response_model=SearchResponse)
async def search_blogs(request: SearchRequest):
    """
    키워드로 네이버 블로그 검색
    
    - **keyword**: 검색할 키워드
    - **n**: 가져올 블로그 개수 (1-10)
    """
    try:
        crawler = NaverCrawler()
        blog_list = crawler.get_top_n_blog_info(request.keyword, n=request.n)
        
        if not blog_list or len(blog_list) == 0:
            raise HTTPException(status_code=404, detail="블로그 글을 찾을 수 없습니다.")
        
        blogs = [BlogInfo(title=blog['title'], url=blog['url']) for blog in blog_list]
        
        return SearchResponse(
            keyword=request.keyword,
            count=len(blogs),
            blogs=blogs
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"검색 중 오류 발생: {str(e)}")


@app.post("/api/crawl", response_model=CrawlResponse)
async def crawl_blog(request: CrawlRequest):
    """
    블로그 본문 크롤링 (단일)
    
    - **url**: 크롤링할 블로그 URL
    - **title**: 블로그 제목 (선택사항)
    """
    try:
        crawler = NaverCrawler()
        result = crawler.extract_blog_body_with_media(request.url)
        
        if not result or not result.get('body_text'):
            return CrawlResponse(
                success=False,
                url=request.url,
                error="본문 텍스트를 추출할 수 없습니다."
            )
        
        body_text = result['body_text']
        image_urls = result.get('image_urls', [])
        link_urls = result.get('link_urls', [])
        
        # txt 파일 저장 (선택사항)
        txt_path = None
        if request.title:
            txt_path = crawler.save_blog_to_txt(request.url, title=request.title)
        
        return CrawlResponse(
            success=True,
            title=request.title,
            url=request.url,
            body_text=body_text,
            body_length=len(body_text),
            image_urls=image_urls if image_urls else None,
            link_urls=link_urls if link_urls else None,
            txt_path=txt_path
        )
    except Exception as e:
        return CrawlResponse(
            success=False,
            url=request.url,
            error=str(e)
        )


@app.post("/api/crawl/bulk", response_model=CrawlBulkResponse)
async def crawl_blogs_bulk(request: CrawlBulkRequest):
    """
    블로그 본문 크롤링 (리스트)
    
    - **urls**: 크롤링할 블로그 URL 리스트
    - **titles**: 블로그 제목 리스트 (선택사항, urls와 같은 길이)
    """
    try:
        # titles 길이 검증
        if request.titles and len(request.titles) != len(request.urls):
            raise HTTPException(
                status_code=400,
                detail="titles 리스트의 길이가 urls 리스트의 길이와 일치하지 않습니다."
            )
        
        crawler = NaverCrawler()
        results = []
        success_count = 0
        
        for i, url in enumerate(request.urls):
            title = request.titles[i] if request.titles else None
            
            try:
                media_result = crawler.extract_blog_body_with_media(url)
                
                if not media_result or not media_result.get('body_text'):
                    results.append(CrawlResponse(
                        success=False,
                        url=url,
                        title=title,
                        error="본문 텍스트를 추출할 수 없습니다."
                    ))
                    continue
                
                body_text = media_result['body_text']
                image_urls = media_result.get('image_urls', [])
                link_urls = media_result.get('link_urls', [])
                
                # txt 파일 저장 (선택사항)
                txt_path = None
                if title:
                    txt_path = crawler.save_blog_to_txt(url, title=title)
                
                results.append(CrawlResponse(
                    success=True,
                    title=title,
                    url=url,
                    body_text=body_text,
                    body_length=len(body_text),
                    image_urls=image_urls if image_urls else None,
                    link_urls=link_urls if link_urls else None,
                    txt_path=txt_path
                ))
                success_count += 1
                
            except Exception as e:
                results.append(CrawlResponse(
                    success=False,
                    url=url,
                    title=title,
                    error=str(e)
                ))
        
        return CrawlBulkResponse(
            total_count=len(results),
            success_count=success_count,
            results=results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"처리 중 오류 발생: {str(e)}")


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_keywords(request: AnalyzeRequest):
    """
    텍스트에서 키워드 분석
    
    - **text**: 분석할 텍스트
    - **top_n**: 상위 N개 키워드
    - **min_length**: 최소 키워드 길이
    - **min_count**: 최소 출현 횟수
    """
    try:
        analyzer = MorphemeAnalyzer(use_konlpy=True)
        
        # 키워드 통계 가져오기
        keyword_stats = analyzer.get_keyword_ranking(
            request.text,
            top_n=request.top_n,
            min_length=request.min_length,
            min_count=request.min_count
        )
        
        keywords = [
            KeywordStat(keyword=k, count=v['count'], rank=v['rank'])
            for k, v in keyword_stats.items()
        ]
        
        return AnalyzeResponse(
            success=True,
            total_keywords=len(keywords),
            keywords=keywords
        )
    except Exception as e:
        return AnalyzeResponse(
            success=False,
            total_keywords=0,
            keywords=[],
            error=str(e)
        )


@app.post("/api/process", response_model=ProcessResponse)
async def process_blogs(request: ProcessRequest):
    """
    전체 처리 (검색 + 크롤링 + 분석)
    
    - **keyword**: 검색 키워드
    - **n**: 처리할 블로그 개수
    - **analyze**: 키워드 분석 수행 여부
    - **top_n**: 상위 N개 키워드
    - **min_length**: 최소 키워드 길이
    - **min_count**: 최소 출현 횟수
    """
    try:
        # 1. 블로그 검색
        crawler = NaverCrawler()
        blog_list = crawler.get_top_n_blog_info(request.keyword, n=request.n)
        
        if not blog_list or len(blog_list) == 0:
            raise HTTPException(status_code=404, detail="블로그 글을 찾을 수 없습니다.")
        
        # 2. 출력 디렉토리 생성 (요청한 개수만큼만)
        output_dir = get_output_directory(count=request.n)
        
        # 3. 병렬 처리
        results = []
        with ThreadPoolExecutor(max_workers=min(request.n, 3)) as executor:
            futures = []
            for i, blog_info in enumerate(blog_list, 1):
                crawler_instance = NaverCrawler()
                future = executor.submit(
                    process_single_blog,
                    crawler_instance,
                    blog_info,
                    i,
                    output_dir,
                    request.analyze,
                    request.top_n,
                    request.min_length,
                    request.min_count
                )
                futures.append((i, future))
            
            for rank, future in futures:
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    results.append(ProcessResult(
                        rank=rank,
                        title=blog_list[rank-1]['title'] if rank <= len(blog_list) else "알 수 없음",
                        url=blog_list[rank-1]['url'] if rank <= len(blog_list) else "",
                        success=False,
                        error=str(e)
                    ))
        
        # 결과 정렬
        results.sort(key=lambda x: x.rank)
        
        success_count = sum(1 for r in results if r.success)
        
        return ProcessResponse(
            keyword=request.keyword,
            output_dir=output_dir,
            total_count=len(results),
            success_count=success_count,
            results=results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"처리 중 오류 발생: {str(e)}")


def download_and_save_image(image_url: str, output_dir: Optional[str] = None, image_index: Optional[int] = None, referer_url: Optional[str] = None, session: Optional[requests.Session] = None) -> str:
    """
    이미지를 다운로드하여 서버에 저장하고, 저장된 파일 경로를 반환합니다.
    
    Args:
        image_url: 다운로드할 이미지 URL
        output_dir: 저장할 디렉토리 경로 (예: naver_crawler/20251205_1/TOP1)
                    None이면 기본 위치에 저장
        image_index: 이미지 인덱스 (마커 순서와 일치, 예: 1, 2, 3...)
                    None이면 MD5 해시 사용
        referer_url: Referer 헤더로 사용할 블로그 URL (원본 이미지 다운로드를 위해 필요)
        session: requests.Session 객체 (쿠키와 헤더 유지를 위해 사용)
        
    Returns:
        저장된 이미지 파일의 상대 경로 (예: /static/naver_crawler/.../이미지삽입1.jpg)
    """
    try:
        # URL에서 파일 확장자 추출
        parsed_url = urlparse(image_url)
        path = parsed_url.path
        ext = os.path.splitext(path)[1] or '.jpg'
        
        # 파일명 생성: image_index가 있으면 마커 순서와 일치하게, 없으면 MD5 해시 사용
        if image_index is not None:
            filename = f"이미지삽입{image_index}{ext}"
        else:
            url_hash = hashlib.md5(image_url.encode()).hexdigest()
            filename = f"{url_hash}{ext}"
        
        # 저장 디렉토리 결정
        if output_dir:
            # output_dir이 제공되면 해당 TOP 디렉토리 하위에 images 폴더 생성
            images_dir = Path(output_dir) / "images"
            images_dir.mkdir(parents=True, exist_ok=True)
            filepath = images_dir / filename
            # 정적 파일 경로는 naver_crawler 기준 상대 경로
            relative_path = filepath.relative_to(NAVER_CRAWLER_DIR)
            static_path = f"/static/naver_crawler/{relative_path.as_posix()}"
        else:
            # 기본 위치 (naver_crawler/images)
            images_dir = NAVER_CRAWLER_DIR / "images"
            images_dir.mkdir(parents=True, exist_ok=True)
            filepath = images_dir / filename
            static_path = f"/static/naver_crawler/images/{filename}"
        
        # 이미 파일이 존재하면 저장된 경로 반환
        if filepath.exists():
            return static_path
        
        # 수집된 URL을 그대로 사용 (w966이 있으면 고화질, 없으면 저화질)
        # 크롤러에서 이미 올바른 URL을 수집했으므로 변환하지 않음
        original_image_url = image_url
        
        # 이미지 다운로드 (Referer 헤더 포함 - 실제 블로그 URL 사용)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': referer_url if referer_url else 'https://blog.naver.com/',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'identity',  # 압축 해제를 위해 identity 사용
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'no-cache'
        }
        
        # 세션이 제공되면 사용 (쿠키와 헤더 유지)
        if session:
            # 세션의 기본 헤더를 복사하고 추가 헤더 업데이트
            session_headers = dict(session.headers)
            session_headers.update(headers)
            response = session.get(original_image_url, headers=session_headers, timeout=10, stream=True)
        else:
            response = requests.get(original_image_url, headers=headers, timeout=10, stream=True)
        
        response.raise_for_status()
        
        # 이미지 데이터 저장
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return static_path
        
    except Exception as e:
        print(f"[ERROR] 이미지 다운로드 실패 ({image_url}): {e}")
        # 다운로드 실패 시 원본 URL 반환 (프록시 방식으로 폴백)
        return None


@app.get("/api/image-proxy")
async def proxy_image(url: str, output_dir: Optional[str] = None, image_index: Optional[int] = None, referer: Optional[str] = None):
    """
    이미지를 다운로드하여 서버에 저장한 후 제공합니다.
    네이버 포스트파일 서버의 Referer 제한을 우회하기 위해 사용합니다.
    
    - **url**: 다운로드할 이미지 URL (URL 인코딩 필요)
    - **output_dir**: 저장할 디렉토리 경로 (선택사항, 예: naver_crawler/20251205_1/TOP1)
    - **image_index**: 이미지 인덱스 (선택사항, 마커 순서와 일치, 예: 1, 2, 3...)
    - **referer**: Referer 헤더로 사용할 블로그 URL (선택사항, 원본 이미지 다운로드를 위해 필요)
    """
    try:
        # URL 디코딩
        image_url = unquote(url)
        
        # URL 유효성 검사
        if not image_url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="유효하지 않은 URL입니다.")
        
        # 네이버 포스트파일 서버만 허용 (보안)
        allowed_domains = ['postfiles.pstatic.net', 'blogpf.pstatic.net', 'blogfiles.pstatic.net']
        if not any(domain in image_url for domain in allowed_domains):
            raise HTTPException(status_code=403, detail="허용되지 않은 도메인입니다.")
        
        # output_dir이 제공되면 절대 경로로 변환
        if output_dir:
            if not os.path.isabs(output_dir):
                # 상대 경로면 naver_crawler 기준으로 변환
                output_dir = str(NAVER_CRAWLER_DIR / output_dir.replace('naver_crawler/', ''))
        
        # 이미지 다운로드 및 저장 (image_index 및 referer 전달)
        referer_url = unquote(referer) if referer else None
        saved_path = download_and_save_image(image_url, output_dir, image_index=image_index, referer_url=referer_url)
        
        if saved_path:
            # 저장된 파일 경로 파싱
            # /static/naver_crawler/20251205_1/TOP1/images/xxx.jpg 형식
            relative_path = saved_path.replace('/static/naver_crawler/', '')
            filepath = NAVER_CRAWLER_DIR / relative_path
            
            if filepath.exists():
                return FileResponse(
                    path=str(filepath),
                    headers={
                        'Cache-Control': 'public, max-age=86400',  # 24시간 캐시
                        'Access-Control-Allow-Origin': '*'
                    }
                )
        
        # 저장 실패 시 스트리밍 방식으로 폴백
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': referer_url if referer_url else 'https://blog.naver.com/',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site'
        }
        
        response = requests.get(image_url, headers=headers, timeout=10, stream=True)
        response.raise_for_status()
        
        content_type = response.headers.get('Content-Type', 'image/jpeg')
        
        return Response(
            content=response.content,
            media_type=content_type,
            headers={
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"이미지를 가져올 수 없습니다: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 프록시 중 오류 발생: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

