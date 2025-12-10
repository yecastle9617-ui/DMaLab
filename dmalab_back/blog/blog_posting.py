from playwright.sync_api import sync_playwright
import time
import os
import json
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any


# =======================
# 설정값
# =======================
BLOG_ID = "dmalab"

# export_blog 기본 디렉토리 (FastAPI와 동일 구조: data/blog/export_blog)
EXPORT_BLOG_BASE_DIR = Path(__file__).parent.parent / "data" / "blog" / "export_blog"

# 네이버 에디터 폰트 크기 코드 매핑 (fs11, fs13, ...)
NAVER_FONT_SIZE_CODES: Dict[int, str] = {
    11: "fs11",
    13: "fs13",
    15: "fs15",
    16: "fs16",
    19: "fs19",
    24: "fs24",
    28: "fs28",
    30: "fs30",
    34: "fs34",
    38: "fs38",
}


def get_naver_font_code(font_size: Optional[int]) -> Optional[str]:
    """
    JSON의 font_size를 네이버 에디터의 fs코드(fs11, fs13, ...)로 변환.
    가장 가까운 값으로 매핑합니다.
    """
    if not font_size:
        return None

    sizes = sorted(NAVER_FONT_SIZE_CODES.keys())
    closest = sizes[0]
    for s in sizes:
        if abs(s - font_size) < abs(closest - font_size):
            closest = s
    return NAVER_FONT_SIZE_CODES.get(closest)


def apply_text_style(page, style_type: str):
    """
    본문 / 소제목 / 인용구 스타일 드롭다운을 클릭해 스타일을 적용합니다.
    style_type: 'body' | 'subtitle' | 'quote'
    """
    try:
        # 스타일 드롭다운 열기
        style_btn = page.locator("button.se-text-format-toolbar-button")
        style_btn.click()
        time.sleep(0.1)

        if style_type == "subtitle":
            # 소제목
            option = page.locator(
                "button[data-name='text-format'][data-value='sectionTitle']"
            )
        elif style_type == "quote":
            # 인용구
            option = page.locator(
                "button[data-name='text-format'][data-value='quotation']"
            )
        else:
            # 본문
            option = page.locator(
                "button[data-name='text-format'][data-value='text']"
            )

        option.click()
        time.sleep(0.1)
    except Exception as e:
        print(f"[WARN] 텍스트 스타일 적용 실패 ({style_type}): {e}")


def apply_font_size(page, font_size: Optional[int]):
    """
    폰트 크기 드롭다운을 사용해 글자 크기를 설정합니다.
    """
    code = get_naver_font_code(font_size)
    if not code:
        return

    try:
        size_btn = page.locator("button.se-font-size-code-toolbar-button")
        size_btn.click()
        time.sleep(0.1)

        option = page.locator(
            f"button[data-name='font-size'][data-value='{code}']"
        )
        option.click()
        time.sleep(0.1)
    except Exception as e:
        print(f"[WARN] 폰트 크기 적용 실패 ({font_size}, {code}): {e}")


def ensure_bold(page, enabled: bool):
    """
    굵게 버튼 상태를 enabled에 맞게 맞춥니다.
    """
    try:
        bold_btn = page.locator("button.se-bold-toolbar-button[data-name='bold']")
        class_attr = bold_btn.get_attribute("class") or ""
        is_on = "se-is-selected" in class_attr

        if enabled and not is_on:
            bold_btn.click()
            time.sleep(0.05)
        elif not enabled and is_on:
            bold_btn.click()
            time.sleep(0.05)
    except Exception as e:
        print(f"[WARN] 굵게 토글 실패 (enabled={enabled}): {e}")


def build_body_lines(blog_content: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    export_blog JSON의 blog_content를 네이버 에디터에 타이핑할
    한 줄(line) 목록으로 변환합니다.

    각 line: { text, style_type('body'|'subtitle'|'quote'), font_size:int, bold:bool }
    """
    lines: List[Dict[str, Any]] = []

    def add_text_block(
        text: str,
        style_obj: Optional[Dict[str, Any]] = None,
        style_type: str = "body",
    ):
        if not text:
            return

        style_obj = style_obj or {}
        font_size = style_obj.get("font_size") or 16
        bold = bool(style_obj.get("bold"))

        # 여러 줄(\n)이 있으면 실제 타이핑은 라인별로 쪼갬
        for part in str(text).split("\n"):
            if not part.strip():
                continue
            lines.append(
                {
                    "text": part.strip(),
                    "style_type": style_type,
                    "font_size": font_size,
                    "bold": bold,
                }
            )

    # 1) 서론
    intro = blog_content.get("introduction") or {}
    if intro.get("content"):
        add_text_block(intro.get("content"), intro.get("style") or {}, "body")

    # 2) 본문 섹션들
    body_sections = blog_content.get("body") or []
    for section in body_sections:
        if not isinstance(section, dict):
            continue

        # 섹션 소제목
        subtitle = section.get("subtitle") or {}
        if subtitle.get("content"):
            # 소제목은 항상 bold 적용
            style = dict(subtitle.get("style") or {})
            style["bold"] = True
            add_text_block(subtitle.get("content"), style, "subtitle")

        # 섹션 내 블록들
        blocks = section.get("blocks") or []
        for block in blocks:
            if not isinstance(block, dict):
                continue

            btype = block.get("type") or "paragraph"

            if btype == "paragraph":
                style = dict(block.get("style") or {})
                # 스타일에 quote 플래그가 있으면 인용구로 처리
                is_quote = bool(style.get("quote"))
                if is_quote:
                    add_text_block(block.get("content") or "", style, "quote")
                else:
                    add_text_block(block.get("content") or "", style, "body")

            elif btype == "quote":
                style = dict(block.get("style") or {})
                style["quote"] = True
                add_text_block(block.get("content") or "", style, "quote")

            elif btype == "list":
                items = block.get("items") or []
                style = dict(block.get("style") or {})
                for item in items:
                    add_text_block(f"• {item}", style, "body")

            # image_placeholder, hr 등은 현재 단계에서는 무시

    # 3) 결론
    conclusion = blog_content.get("conclusion") or {}
    if conclusion.get("content"):
        add_text_block(conclusion.get("content"), conclusion.get("style") or {}, "body")

    # 4) FAQ (선택)
    faq_list = blog_content.get("faq") or []
    if faq_list:
        # FAQ 제목
        add_text_block("자주 묻는 질문", {"font_size": 19, "bold": True}, "subtitle")

        for faq in faq_list:
            if not isinstance(faq, dict):
                continue
            q = faq.get("q") or {}
            a = faq.get("a") or {}

            if q.get("content"):
                add_text_block(
                    "Q. " + str(q.get("content")),
                    q.get("style") or {"bold": True},
                    "body",
                )
            if a.get("content"):
                add_text_block("A. " + str(a.get("content")), a.get("style") or {}, "body")

    return lines


def insert_horizontal_rule_style2(page):
    """
    네이버 에디터에서 '구분선 2'를 삽입합니다.
    """
    try:
        # 구분선 드롭다운 열기
        dropdown_btn = page.locator(
            "div[data-name='insert-horizontal-line'] "
            "button.se-document-toolbar-select-option-button"
        ).first
        dropdown_btn.click()
        time.sleep(0.2)

        # 구분선 스타일2 선택
        option_btn = page.locator(
            "button.se-toolbar-option-insert-horizontal-line-line1-button"
        ).first
        option_btn.click()
        time.sleep(0.2)
        print("[INFO] 구분선 2 삽입")
    except Exception as e:
        print(f"[WARN] 구분선 2 삽입 실패: {e}")


def build_body_actions(blog_content: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    blog_content를 네이버 에디터에서 순차 실행할 액션 리스트로 변환합니다.

    액션 종류:
      - {'kind': 'hr'}
      - {'kind': 'text', 'text': str, 'style_type': 'body'|'subtitle'|'quote', 'style': {...}}
      - {'kind': 'image', 'index': int, 'placeholder': str}
      - {'kind': 'list', 'items': [...], 'style': {...}, 'ordered': bool}
    """
    actions: List[Dict[str, Any]] = []

    def add_text_actions(
        text: str,
        style_obj: Optional[Dict[str, Any]] = None,
        style_type: str = "body",
    ):
        if not text:
            return

        style_obj = style_obj or {}

        for part in str(text).split("\n"):
            if not part.strip():
                continue
            actions.append(
                {
                    "kind": "text",
                    "text": part.strip(),
                    "style_type": style_type,
                    "style": dict(style_obj),
                }
            )

    # 1) 서론
    intro = blog_content.get("introduction") or {}
    if intro.get("content"):
        add_text_actions(intro.get("content"), intro.get("style") or {}, "body")

    # 2) 본문 섹션들
    body_sections = blog_content.get("body") or []
    for section in body_sections:
        if not isinstance(section, dict):
            continue

        # 섹션 소제목
        subtitle = section.get("subtitle") or {}
        if subtitle.get("content"):
            # 소제목 앞에는 구분선 2 삽입
            actions.append({"kind": "hr"})

            style = dict(subtitle.get("style") or {})
            style["bold"] = True
            add_text_actions(subtitle.get("content"), style, "subtitle")

        # 섹션 내 블록들
        blocks = section.get("blocks") or []
        for block in blocks:
            if not isinstance(block, dict):
                continue

            btype = block.get("type") or "paragraph"

            if btype == "paragraph":
                style = dict(block.get("style") or {})
                is_quote = bool(style.get("quote"))
                style_type = "quote" if is_quote else "body"
                add_text_actions(block.get("content") or "", style, style_type)

            elif btype == "quote":
                style = dict(block.get("style") or {})
                style["quote"] = True
                add_text_actions(block.get("content") or "", style, "quote")

            elif btype == "list":
                # 리스트 블록은 별도 액션으로 처리 (리스트 스타일 유지)
                items = block.get("items") or []
                style = dict(block.get("style") or {})
                actions.append(
                    {
                        "kind": "list",
                        "items": [str(it) for it in items if str(it).strip()],
                        "style": style,
                        "ordered": bool(block.get("ordered")),
                    }
                )

            elif btype == "image_placeholder":
                actions.append(
                    {
                        "kind": "image",
                        "index": block.get("index"),
                        "placeholder": block.get("placeholder") or "",
                    }
                )

            elif btype == "hr":
                actions.append({"kind": "hr"})

    # 3) 결론
    conclusion = blog_content.get("conclusion") or {}
    if conclusion.get("content"):
        add_text_actions(conclusion.get("content"), conclusion.get("style") or {}, "body")

    # 4) FAQ
    faq_list = blog_content.get("faq") or []
    if faq_list:
        # FAQ 제목
        add_text_actions("자주 묻는 질문", {"font_size": 19, "bold": True}, "subtitle")

        for faq in faq_list:
            if not isinstance(faq, dict):
                continue
            q = faq.get("q") or {}
            a = faq.get("a") or {}

            if q.get("content"):
                add_text_actions(
                    "Q. " + str(q.get("content")),
                    q.get("style") or {"bold": True},
                    "body",
                )
            if a.get("content"):
                add_text_actions("A. " + str(a.get("content")), a.get("style") or {}, "body")

    return actions


def insert_image_at_cursor(page, image_meta: Dict[str, Any]):
    """
    현재 커서 위치에 단일 이미지를 업로드하여 삽입합니다.
    """
    local_path = (
        image_meta.get("local_path")
        or image_meta.get("full_path")
        or image_meta.get("path")
    )
    if not local_path:
        print(f"[WARN] 이미지 경로(local_path/full_path)를 찾을 수 없습니다: {image_meta}")
        return

    local_path = str(local_path)
    if not os.path.isabs(local_path):
        local_path = os.path.abspath(local_path)

    if not os.path.exists(local_path):
        print(f"[WARN] 이미지 파일이 존재하지 않습니다: {local_path}")
        return

    try:
        with page.expect_file_chooser() as fc_info:
            page.locator("button.se-image-toolbar-button").click()

        chooser = fc_info.value
        chooser.set_files([local_path])
        print(f"[INFO] 단일 이미지 업로드 완료: {local_path}")
        time.sleep(0.5)
    except Exception as e:
        print(f"[WARN] 단일 이미지 업로드 실패: {local_path}, error={e}")


def type_body_content(page, blog_content: Optional[Dict[str, Any]]):
    """
    네이버 에디터 본문 영역에 blog_content 내용을 실제로 타이핑합니다.
    - 텍스트는 '복사-붙여넣기'에 가까운 insert_text로 입력
    - 이미지 플레이스홀더 위치에 이미지를 즉시 삽입
    - 소제목 앞에는 구분선 2 삽입
    """
    if not blog_content:
        return

    actions = build_body_actions(blog_content)
    if not actions:
        print("[INFO] blog_content에 입력할 본문이 없습니다.")
        return

    # 본문 입력 영역 클릭 (첫 번째 텍스트 컴포넌트 기준)
    try:
        body_module = page.locator(
            "div.se-component.se-text.se-l-default div.se-module.se-module-text"
        ).first
        body_module.click()
        time.sleep(0.3)
    except Exception as e:
        print(f"[WARN] 본문 입력 영역을 찾지 못했습니다: {e}")
        return

    print(f"[INFO] 본문 액션 {len(actions)}개를 네이버 에디터에 실행합니다.")

    # 이미지 메타데이터 맵핑 (index 기준)
    images_meta = blog_content.get("generated_images") or []
    images_by_index: Dict[int, Dict[str, Any]] = {}
    for img in images_meta:
        idx = img.get("index")
        if isinstance(idx, int):
            images_by_index[idx] = img

    for i, action in enumerate(actions, start=1):
        kind = action.get("kind")

        if kind == "hr":
            insert_horizontal_rule_style2(page)
            continue

        if kind == "image":
            img_idx = action.get("index")
            img_meta = images_by_index.get(img_idx)
            if not img_meta:
                print(f"[WARN] index={img_idx} 에 해당하는 이미지 메타를 찾지 못했습니다.")
                continue
            insert_image_at_cursor(page, img_meta)
            continue

        if kind == "list":
            # 리스트 항목들 처리
            items = action.get("items") or []
            style = action.get("style") or {}
            ordered = bool(action.get("ordered"))

            # 리스트 드롭다운 열고 스타일 선택 (기호목록 또는 숫자목록)
            try:
                # 목록 드롭다운 버튼 (툴바 상단)
                dropdown_btn = page.locator(
                    "div[data-name='list'] button.se-list-bullet-toolbar-button"
                ).first
                dropdown_btn.click()
                time.sleep(0.1)

                if ordered:
                    # 숫자목록 버튼
                    option_btn = page.locator(
                        "button.se-toolbar-option-list-decimal-button"
                    ).first
                else:
                    # 기호목록 버튼
                    option_btn = page.locator(
                        "button.se-toolbar-option-list-bullet-button"
                    ).first

                option_btn.click()
                time.sleep(0.1)
            except Exception as e:
                print(f"[WARN] 리스트 스타일 설정 실패: {e}")

            # 각 항목을 한 줄씩 입력
            for item in items:
                text = item or ""
                if not text.strip():
                    continue

                # 텍스트 스타일 적용 (폰트 크기, 굵기 등)
                font_size = style.get("font_size") or 16
                bold = bool(style.get("bold"))

                apply_text_style(page, "body")
                apply_font_size(page, font_size)
                ensure_bold(page, bold)

                try:
                    page.keyboard.insert_text(str(text))
                    page.keyboard.press("Enter")
                except Exception as e:
                    print(f"[WARN] 리스트 항목 입력 중 오류 (action {i}): {e}")
                time.sleep(0.05)

            # 리스트 종료를 위해 목록해제 버튼 클릭 (가능한 경우)
            try:
                dropdown_btn = page.locator(
                    "div[data-name='list'] button.se-list-bullet-toolbar-button"
                ).first
                dropdown_btn.click()
                time.sleep(0.1)
                reset_btn = page.locator(
                    "button.se-toolbar-option-list-reset-button"
                ).first
                reset_btn.click()
                time.sleep(0.1)
            except Exception as e:
                print(f"[WARN] 리스트 해제 실패: {e}")

            continue

        if kind == "text":
            text = action.get("text") or ""
            style_type = action.get("style_type") or "body"
            style = action.get("style") or {}

            # 스타일/폰트/굵기 적용
            font_size = style.get("font_size") or 16
            bold = bool(style.get("bold"))

            apply_text_style(page, style_type)
            apply_font_size(page, font_size)
            ensure_bold(page, bold)

            # 텍스트 입력: 타이핑 대신 insert_text 사용 (복붙 느낌)
            try:
                page.keyboard.insert_text(str(text))
                page.keyboard.press("Enter")
            except Exception as e:
                print(f"[WARN] 본문 입력 중 오류 (action {i}): {e}")
            time.sleep(0.05)


def apply_image_styles_and_captions(page, blog_content: Optional[Dict[str, Any]], default_width: int = 600):
    """
    업로드된 이미지에 대해:
      - generated_images[].style 이 'ai'이면 AI 활용 설정 토글 버튼 클릭
      - 'thumbnail'이면 대표 이미지(썸네일) 설정 클릭
      - placeholder 값을 캡션에 입력 (대괄호 제거)
      - 이미지 크기: 각 이미지별로 W=default_width 입력 후 Enter
    """
    if not blog_content:
        return

    images_meta = blog_content.get("generated_images") or []
    if not images_meta:
        return

    # 이미지 섹션 DOM이 모두 생성될 때까지 잠시 대기
    try:
        page.wait_for_timeout(1000)
    except Exception:
        pass

    sections = page.locator("div.se-section.se-section-image")
    count = sections.count()
    if count == 0:
        print("[INFO] 에디터에서 이미지 섹션을 찾지 못했습니다.")
        return

    num = min(count, len(images_meta))
    print(f"[INFO] 이미지 스타일/캡션 적용 대상: {num}개 (에디터:{count}, 메타:{len(images_meta)})")

    for idx in range(num):
        meta = images_meta[idx]
        style = (meta.get("style") or "").lower()
        is_thumbnail = bool(meta.get("is_thumbnail"))
        # placeholder에서 불필요한 대괄호 제거
        raw_placeholder = meta.get("placeholder") or ""
        placeholder = raw_placeholder.replace("[", "").replace("]", "").strip()

        section = sections.nth(idx)

        # 섹션 클릭해서 컨텍스트 툴바/캡션 활성화
        try:
            section.click()
            time.sleep(0.3)
        except Exception as e:
            print(f"[WARN] 이미지 섹션 클릭 실패 (index={idx}): {e}")
            continue

        # 캡션 입력 (placeholder 사용)
        if placeholder:
            try:
                caption_module = section.locator(
                    "div.se-module.se-module-text.se-caption"
                )
                caption_p = caption_module.locator("p.se-text-paragraph").first
                caption_p.click()
                time.sleep(0.1)

                # 기존 내용 전체 삭제 후 입력
                page.keyboard.press("Control+A")
                page.keyboard.press("Backspace")
                page.keyboard.type(str(placeholder), delay=10)
            except Exception as e:
                print(f"[WARN] 이미지 캡션 입력 실패 (index={idx}): {e}")

        # AI 활용 설정 (토글 버튼 클릭)
        if style == "ai":
            try:
                # 섹션을 화면 안으로 스크롤
                try:
                    section.scroll_into_view_if_needed()
                    time.sleep(0.2)
                except Exception:
                    pass

                ai_toggle_btn = section.locator("button.se-set-ai-mark-button-toggle").first

                # 화면 상에서 포인터가 가로막히더라도 DOM 상에서 직접 click() 호출
                ai_toggle_btn.evaluate("el => el.click()")
                click_path = "toggle_evaluate_click"

                time.sleep(0.1)
                print(f"[INFO] 이미지 {idx+1}: AI 활용 설정 적용 (path={click_path})")
            except Exception as e:
                print(f"[WARN] AI 활용 설정 클릭 실패 (index={idx}): {e}")

        # 썸네일(대표 이미지) 설정
        if is_thumbnail:
            try:
                rep_btn = section.locator("button.se-set-rep-image-button")
                rep_btn.click()
                time.sleep(0.1)
                print(f"[INFO] 이미지 {idx+1}: 대표 이미지(썸네일) 설정")
            except Exception as e:
                print(f"[WARN] 대표 이미지 설정 클릭 실패 (index={idx}): {e}")

        # 각 이미지별 크기 설정: W=default_width 입력 후 Enter
        try:
            resize_btn = page.locator("button.se-resizing-toolbar-button").first
            resize_btn.click()
            time.sleep(0.2)

            width_input = page.locator("input#resizing-input-width")
            width_input.click()
            time.sleep(0.1)
            width_input.fill(str(default_width))
            # Enter 로 크기 적용
            page.keyboard.press("Enter")
            time.sleep(0.2)
            print(f"[INFO] 이미지 {idx+1}: 너비 {default_width}px 적용")
        except Exception as e:
            print(f"[WARN] 이미지 크기 설정 실패 (index={idx}): {e}")

        # 이미지 설정 후 한 줄 내려가기 (이미지 뒤에 여백 생성)
        try:
            page.keyboard.press("Enter")
            time.sleep(0.1)
        except Exception:
            pass

    # 마지막으로 다시 본문 영역에 포커스를 돌려줌 (사용자가 바로 본문을 이어서 입력할 수 있도록)
    try:
        body_first_p = page.locator(
            "div.se-component.se-text.se-l-default p.se-text-paragraph"
        ).first
        body_first_p.click()
        time.sleep(0.2)
    except Exception as e:
        print(f"[WARN] 본문 포커스 복원 실패: {e}")


def post_blog(
    title: Optional[str] = None,
    tags: Optional[List[str]] = None,
    images: Optional[List[str]] = None,
    blog_content: Optional[Dict[str, Any]] = None,
):
    """
    네이버 블로그에 글을 발행하는 함수
    
    Args:
        title: 블로그 제목
        tags: 태그 리스트
        images: 이미지 파일 리스트 (절대 경로 또는 현재 작업 디렉토리 기준 경로)
        blog_content: export_blog JSON의 blog_content 전체
    """
    if not title:
        raise ValueError("title은 필수입니다.")
    tags = tags or []
    images = images or []
    
    with sync_playwright() as p:
        # 실제 설치된 크롬 브라우저 사용 (chromium 대신)
        browser = p.chromium.launch(
            channel="chrome",
            headless=False,
        )
        # naver_state.json 경로 (data/ 하위)
        data_dir = Path(__file__).parent.parent / "data"
        naver_state_path = data_dir / "naver_state.json"

        # viewport를 지정하지 않으면 Playwright 기본값(1280x720) 사용
        context = browser.new_context(
            storage_state=str(naver_state_path) if naver_state_path.exists() else None,
        )
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
        # 본문 입력 (JSON 기반)
        # ===============================================================
        try:
            type_body_content(page, blog_content)
        except Exception as e:
            print(f"[WARN] 본문 자동 입력 중 오류: {e}")

        # (이미지는 본문 중간에서 개별 삽입하므로 여기서는 추가 업로드를 수행하지 않음)

        # ===============================================================
        # 이미지 메타데이터 기반 스타일/캡션/크기 설정
        # ===============================================================
        try:
            apply_image_styles_and_captions(page, blog_content, default_width=600)
        except Exception as e:
            print(f"[WARN] 이미지 스타일/캡션/크기 설정 중 오류: {e}")

        # ===============================================================
        # 발행 모달 열기
        # ===============================================================
        publish_btn = page.locator("button.publish_btn__m9KHH")
        publish_btn.click()
        print("발행 모달 열림")

        time.sleep(1)

        # ===============================================================
        # 태그 입력
        #   - 매 태그마다 활성 tag-input을 다시 찾아 포커스
        #   - 입력 → Enter 패턴 반복
        #   - DOM 교체에도 대응하기 위해 매번 locator로 새 input을 찾음
        # ===============================================================
        for tag in tags:
            tag_text = (tag or "").strip()
            if not tag_text:
                continue
            
            # 공백 제거 (중간 띄어쓰기 포함)
            tag_text = tag_text.replace(" ", "")
            
            try:
                # 항상 최신 태그 입력 input을 다시 찾는다
                tag_input = page.locator("input#tag-input.tag_input__rvUB5").last
                tag_input.click()
                # 명시적으로 focus 호출 (fake-input 포커스 이슈 방지)
                try:
                    tag_input.evaluate("el => el.focus()")
                except Exception:
                    pass
                time.sleep(0.1)

                # 기존 값 제거 (혹시 남아있을 수 있는 텍스트 초기화)
                try:
                    tag_input.fill("")
                    time.sleep(0.05)
                except Exception:
                    pass

                # 한국어 입력 등을 고려해 type + delay 로 실제 타이핑처럼 입력
                page.keyboard.type(str(tag_text), delay=30)
                time.sleep(0.3)

                # Enter로 태그 확정
                page.keyboard.press("Enter")
                time.sleep(0.5)  # 태그 칩이 생성될 시간을 조금 더 줌

                print(f"[INFO] 태그 입력: {tag_text}")
            except Exception as e:
                print(f"[WARN] 태그 입력 실패: {tag_text}, error={e}")

        print("태그 입력 완료")

        # ===============================================================
        # 최종 발행
        # ===============================================================
        final_btn = page.locator("button.confirm_btn__WEaBq[data-testid='seOnePublishBtn']")
        final_btn.click()
        print("🎉 블로그 발행 완료!")

        input("브라우저 종료하려면 엔터 → ")


def load_export_item(json_path: Path) -> Tuple[Dict[str, Any], str, List[str], List[str]]:
    """
    export_blog 디렉토리에 있는 blog_export_*.json 하나를 읽어
    제목, 태그, 이미지 파일 리스트를 반환합니다.
    """
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # export-blog에서는 blog_content 그대로를 저장하므로 data가 곧 blog_content
    blog_content: Dict[str, Any] = data

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
            resolved = str(file_path.resolve())
            image_files.append(resolved)
            # 본문 입력/이미지 삽입 시 사용할 로컬 경로를 메타데이터에 추가
            img["local_path"] = resolved
        else:
            print(f"[WARN] 이미지 파일을 찾을 수 없습니다: {file_path}")

    return blog_content, title, tags, image_files


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
            blog_content, title, tags, images = load_export_item(json_path)
            print(f"[POST] 제목: {title}")
            print(f"[POST] 태그: {', '.join(tags) if tags else '(없음)'}")
            print(f"[POST] 이미지 개수: {len(images)}")

            post_blog(title=title, tags=tags, images=images, blog_content=blog_content)
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
