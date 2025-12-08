from playwright.sync_api import sync_playwright
import time
import os
import json
from pathlib import Path
from typing import List, Tuple, Optional


# =======================
# 설정값
# =======================
BLOG_ID = "dmalab"

# export_blog 기본 디렉토리 (FastAPI와 동일 구조: blog/export_blog)
EXPORT_BLOG_BASE_DIR = Path(__file__).parent / "export_blog"


def post_blog(title: Optional[str] = None, tags: Optional[List[str]] = None, images: Optional[List[str]] = None):
    """
    네이버 블로그에 글을 발행하는 함수
    
    Args:
        title: 블로그 제목
        tags: 태그 리스트
        images: 이미지 파일 리스트 (절대 경로 또는 현재 작업 디렉토리 기준 경로)
    """
    if not title:
        raise ValueError("title은 필수입니다.")
    tags = tags or []
    images = images or []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(storage_state="naver_state.json")
        page = context.new_page()

        # 1) 상위 글쓰기 페이지 로드
        page.goto(f"https://blog.naver.com/{BLOG_ID}?Redirect=Write")
        page.wait_for_load_state("domcontentloaded")
        time.sleep(1)

        # 2) iframe src 추출
        iframe_el = page.locator("iframe#mainFrame")
        iframe_src = iframe_el.get_attribute("src")

        editor_url = "https://blog.naver.com" + iframe_src
        print("에디터 iframe URL:", editor_url)

        # 3) iframe 페이지로 직접 이동 (여기가 진짜 작업 공간)
        page.goto(editor_url)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        print("✔ iframe 내부 페이지 직접 접속 완료")

        # ===============================================================
        # 제목 입력
        # ===============================================================
        title_box = page.locator("div.se-title-text")
        title_box.click()
        page.keyboard.type(title, delay=20)
        print("제목 입력 완료")

        # ===============================================================
        # 여러 이미지 업로드
        # ===============================================================
        try:
            with page.expect_file_chooser() as fc_info:
                page.locator("button.se-image-toolbar-button").click()

            chooser = fc_info.value
            abs_files = [os.path.abspath(file) for file in images]
            chooser.set_files(abs_files)

            print(f"{len(images)}개의 이미지 업로드 완료")
        except Exception as e:
            print("이미지 업로드 실패:", e)

        time.sleep(1)

        # ===============================================================
        # 발행 모달 열기
        # ===============================================================
        publish_btn = page.locator("button.publish_btn__m9KHH")
        publish_btn.click()
        print("발행 모달 열림")

        time.sleep(1)

        # ===============================================================
        # 태그 입력
        # ===============================================================
        for tag in tags:
            tag_input = page.locator("input#tag-input")
            tag_input.click()
            tag_input.fill(tag)
            page.keyboard.press("Enter")
            time.sleep(0.2)

        print("태그 입력 완료")

        # ===============================================================
        # 최종 발행
        # ===============================================================
        final_btn = page.locator("button.confirm_btn__WEaBq[data-testid='seOnePublishBtn']")
        final_btn.click()
        print("🎉 블로그 발행 완료!")

        input("브라우저 종료하려면 엔터 → ")


def load_export_item(json_path: Path) -> Tuple[str, List[str], List[str]]:
    """
    export_blog 디렉토리에 있는 blog_export_*.json 하나를 읽어
    제목, 태그, 이미지 파일 리스트를 반환합니다.
    """
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # export-blog에서는 blog_content 그대로를 저장하므로 data가 곧 blog_content
    blog_content = data

    # 제목
    title_obj = blog_content.get("title") or {}
    title = title_obj.get("content") or ""
    if not title:
        raise ValueError(f"{json_path} 에 title.content가 없습니다.")

    # 태그
    tags = blog_content.get("tags") or []
    if not isinstance(tags, list):
        tags = []

    # 이미지
    images_meta = blog_content.get("generated_images") or []
    images_dir = json_path.parent / "images"
    image_files: List[str] = []
    for img in images_meta:
        image_path = img.get("image_path")
        if not image_path:
            continue
        # image_path는 export-blog에서 EXPORT_BLOG_DIR 기준 상대 경로였으므로
        # 파일명만 사용해서 images/ 하위 파일을 찾는다.
        filename = Path(image_path).name
        file_path = images_dir / filename
        if file_path.exists():
            image_files.append(str(file_path.resolve()))
        else:
            print(f"[WARN] 이미지 파일을 찾을 수 없습니다: {file_path}")

    return title, tags, image_files


def find_latest_export_dir(base_dir: Path) -> Optional[Path]:
    """
    export_blog/yyyymmdd_N 형식 디렉토리 중 가장 최근 디렉토리를 찾습니다.
    """
    if not base_dir.exists():
        return None

    candidates = [d for d in base_dir.iterdir() if d.is_dir()]
    if not candidates:
        return None

    # 이름 기준 정렬 (yyyymmdd_N 이므로 문자열 정렬로도 최근 순서가 어느 정도 보장됨)
    latest = sorted(candidates, key=lambda p: p.name)[-1]
    return latest


def post_blog_dir(export_dir: Path):
    """
    지정된 export_blog 하위 디렉토리(예: blog/export_blog/20251209_1)를 순회하며
    blog_export_*.json 파일들 각각을 네이버 블로그에 발행합니다.
    """
    json_files = sorted(export_dir.glob("blog_export_*.json"))
    if not json_files:
        print(f"[INFO] {export_dir} 안에 blog_export_*.json 파일이 없습니다.")
        return

    print(f"[INFO] {export_dir} 안의 {len(json_files)}개 JSON을 순차 발행합니다.")

    for json_path in json_files:
        print(f"\n[POST] 처리 중: {json_path.name}")
        try:
            title, tags, images = load_export_item(json_path)
            print(f"[POST] 제목: {title}")
            print(f"[POST] 태그: {', '.join(tags) if tags else '(없음)'}")
            print(f"[POST] 이미지 개수: {len(images)}")

            post_blog(title=title, tags=tags, images=images)
        except Exception as e:
            print(f"[ERROR] {json_path.name} 발행 중 오류: {e}")
            continue


if __name__ == "__main__":
    import sys

    # 사용법:
    #   python blog_posting.py             -> export_blog 디렉토리에서 최신 디렉토리 자동 선택
    #   python blog_posting.py <경로>      -> 지정한 디렉토리 사용 (예: blog/export_blog/20251209_1)

    if len(sys.argv) > 1:
        target_dir = Path(sys.argv[1])
        if not target_dir.is_dir():
            print(f"[ERROR] 지정한 디렉토리가 존재하지 않습니다: {target_dir}")
            sys.exit(1)
        post_blog_dir(target_dir)
    else:
        latest_dir = find_latest_export_dir(EXPORT_BLOG_BASE_DIR)
        if not latest_dir:
            print(f"[INFO] {EXPORT_BLOG_BASE_DIR} 안에 export 디렉토리가 없습니다.")
            sys.exit(0)
        print(f"[INFO] 최신 export 디렉토리 자동 선택: {latest_dir}")
        post_blog_dir(latest_dir)
