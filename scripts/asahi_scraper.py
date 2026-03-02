#!/usr/bin/env python3
"""
Asahi Shimbun xSearch – Selenium automation script
====================================================
Flow:
  1. Open top page  →  wait for manual login (auto-detect)
  2. Enter KEYWORD  →  click search
  3. Iterate results pages (pagination: 次の20件 >)
     For each article: click → scrape → back
  4. Save results to CSV  (columns: url, title, body)

Requirements:
  pip install undetected-chromedriver selenium
  Chrome 145 must be installed.
"""

import csv
import random
import time
import traceback
from pathlib import Path

import undetected_chromedriver as uc
from selenium.common.exceptions import (
    ElementNotInteractableException,
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

# ── Configuration ──────────────────────────────────────────────────────────────
KEYWORD        = "AI"
TOP_URL        = "https://xsearch.asahi.com/"
OUTPUT_CSV     = "asahi_articles.csv"
CHROME_VERSION = 145
LOGIN_TIMEOUT  = 300   # seconds to wait for manual login
PAGE_TIMEOUT   = 30    # seconds for explicit waits
# ──────────────────────────────────────────────────────────────────────────────


# ── Helpers ───────────────────────────────────────────────────────────────────

def random_delay(lo: float = 5.0, hi: float = 15.0) -> None:
    """Sleep a random amount between lo and hi seconds."""
    t = random.uniform(lo, hi)
    print(f"    [sleep] {t:.1f}s …")
    time.sleep(t)


def scroll_to_bottom(driver: uc.Chrome) -> None:
    """Scroll to the very bottom of the page via JavaScript."""
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1.5)  # allow lazy-loaded content to render


# ── Driver factory ────────────────────────────────────────────────────────────

def build_driver() -> uc.Chrome:
    """Create an undetected-chromedriver instance (visible window for manual login)."""
    opts = uc.ChromeOptions()
    opts.add_argument("--start-maximized")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    driver = uc.Chrome(options=opts, version_main=CHROME_VERSION)
    driver.set_page_load_timeout(60)
    return driver


# ── Login ─────────────────────────────────────────────────────────────────────

def wait_for_login(driver: uc.Chrome) -> None:
    """
    Open the top page and block until the user completes manual login.

    Login is detected when EITHER:
      - The search input  <input id="xKeyword">  becomes visible, OR
      - The URL has changed from the initial URL (post-login redirect).
    """
    print("Opening top page …")
    driver.get(TOP_URL)
    time.sleep(3)  # let any immediate redirects settle

    initial_url = driver.current_url.rstrip("/")
    print(f"Initial URL : {initial_url}")
    print(f"Please log in manually in the browser window.")
    print(f"Waiting up to {LOGIN_TIMEOUT}s for login to complete …\n")

    def logged_in(d: uc.Chrome) -> bool:
        # Primary signal: search input is present and visible
        try:
            el = d.find_element(By.ID, "xKeyword")
            if el.is_displayed():
                return True
        except NoSuchElementException:
            pass
        # Fallback: URL changed from starting URL (post-login redirect)
        cur = d.current_url.rstrip("/")
        return cur != initial_url and "xsearch.asahi.com" in cur

    WebDriverWait(driver, LOGIN_TIMEOUT, poll_frequency=2).until(logged_in)
    print(f"\nLogin confirmed. Current URL: {driver.current_url}")
    time.sleep(1)


# ── Search ────────────────────────────────────────────────────────────────────

def do_search(driver: uc.Chrome) -> None:
    """Enter KEYWORD into the search input and click the search button."""
    wait = WebDriverWait(driver, PAGE_TIMEOUT)

    kw_input = wait.until(EC.element_to_be_clickable((By.ID, "xKeyword")))
    kw_input.clear()
    kw_input.send_keys(KEYWORD)
    print(f"Keyword entered: {KEYWORD!r}")

    search_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button.md-button.is-round"))
    )
    search_btn.click()
    print("Search button clicked.")
    random_delay(3, 6)


# ── Results helpers ───────────────────────────────────────────────────────────

def wait_for_results(driver: uc.Chrome) -> None:
    """Wait until at least one result card is visible (handles SPA rendering)."""
    WebDriverWait(driver, PAGE_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "div.md-topic-card"))
    )
    time.sleep(1)  # extra settle time for SPA paint


def collect_article_ids(driver: uc.Chrome) -> list:
    """
    Snapshot the article IDs from the current results page.
    Always called with a fresh DOM read to avoid stale references.
    """
    wait_for_results(driver)
    cards = driver.find_elements(By.CSS_SELECTOR, "div.md-topic-card")
    ids = []
    for card in cards:
        try:
            a_tag = card.find_element(By.CSS_SELECTOR, "a[id]")
            art_id = a_tag.get_attribute("id")
            if art_id:
                ids.append(art_id)
        except NoSuchElementException:
            continue
    return ids


# ── Article scraping ──────────────────────────────────────────────────────────

def scrape_article(driver: uc.Chrome) -> dict:
    """
    Extract title and body from the currently open article detail page.
    Scrolls to bottom first to trigger any lazy-loaded content.
    """
    wait = WebDriverWait(driver, PAGE_TIMEOUT)
    scroll_to_bottom(driver)

    # Title: <div class="md-article-card-title"><h2>…</h2></div>
    title = ""
    try:
        h2 = wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "div.md-article-card-title h2")
            )
        )
        title = h2.text.strip()
    except TimeoutException:
        print("    [warn] Title element not found on article page.")

    # Body: <div class="md-article-card-detail__text">…</div>
    body = ""
    try:
        body_el = wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "div.md-article-card-detail__text")
            )
        )
        body = body_el.text.strip()
    except TimeoutException:
        print("    [warn] Body element not found on article page.")

    return {"url": driver.current_url, "title": title, "body": body}


# ── Pagination ────────────────────────────────────────────────────────────────

def click_next_page(driver: uc.Chrome) -> bool:
    """
    Click the '次の20件 >' pagination button if it exists.
    Returns True if navigation occurred, False if the button was absent.
    """
    try:
        btn = WebDriverWait(driver, 6).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//a[normalize-space(text())='次の20件 >']")
            )
        )
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
        time.sleep(0.5)
        btn.click()
        print("  Clicked '次の20件 >'")
        random_delay()          # 5–15 s between page transitions
        wait_for_results(driver)
        return True
    except TimeoutException:
        return False


# ── Main scraping loop ────────────────────────────────────────────────────────

def scrape_all(driver: uc.Chrome) -> list:
    """
    Walk every results page, visit each article once, and collect rows.

    Key safety measures:
      - Article IDs are re-fetched from a fresh DOM after every back-navigation
        to avoid stale element references.
      - Each article element is looked up by ID immediately before clicking.
      - seen_ids guards against duplicate processing across pages.
    """
    rows      = []
    seen_ids  = set()
    page      = 1

    while True:
        print(f"\n══ Results page {page} ═══════════════════════════════════════════")

        # Snapshot article IDs with a fresh DOM read
        article_ids = collect_article_ids(driver)
        new_ids     = [aid for aid in article_ids if aid not in seen_ids]
        print(f"  Articles on page: {len(article_ids)}  |  New: {len(new_ids)}")

        # Remember the results-page URL for emergency reload
        results_url = driver.current_url

        for art_id in new_ids:
            seen_ids.add(art_id)
            print(f"\n  → article id={art_id!r}")

            pre_nav_url = driver.current_url

            try:
                # ── Re-fetch results so the DOM is fresh before every click ──
                wait_for_results(driver)

                # Locate the <a> by id just before clicking (no stale ref risk)
                a_el = WebDriverWait(driver, PAGE_TIMEOUT).until(
                    EC.element_to_be_clickable((By.ID, art_id))
                )
                driver.execute_script(
                    "arguments[0].scrollIntoView({block:'center'});", a_el
                )
                time.sleep(0.5)

                # Click (must use click(), NOT driver.get())
                a_el.click()

                # Wait for the browser to navigate away from the results page
                WebDriverWait(driver, PAGE_TIMEOUT).until(
                    lambda d, _prev=pre_nav_url: d.current_url != _prev
                )
                random_delay()  # 5–15 s after page transition

                # Scrape article detail
                data = scrape_article(driver)
                rows.append(data)
                print(f"     title : {data['title'][:70]!r}")
                print(f"     url   : {data['url']}")

            except (
                TimeoutException,
                ElementNotInteractableException,
                StaleElementReferenceException,
                NoSuchElementException,
            ) as exc:
                print(f"    [error] {type(exc).__name__}: {exc}")

            finally:
                # ── Always navigate back to the results page ──────────────
                if driver.current_url != pre_nav_url:
                    driver.back()
                    random_delay(3, 7)  # 3–7 s after back-navigation

                # Verify results page is usable; reload from URL if not
                try:
                    wait_for_results(driver)
                except TimeoutException:
                    print("    [warn] back() did not restore results. Reloading …")
                    driver.get(results_url)
                    wait_for_results(driver)

                # Small additional settle before next article
                random_delay(2, 5)

        # ── Pagination ────────────────────────────────────────────────────
        print("\n  Checking for next page …")
        if not click_next_page(driver):
            print("  '次の20件 >' not found – all pages processed.")
            break
        page += 1

    return rows


# ── CSV output ────────────────────────────────────────────────────────────────

def save_csv(rows: list, path: str) -> None:
    out = Path(path)
    with out.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["url", "title", "body"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nSaved {len(rows)} rows  →  {out.resolve()}")


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    driver = build_driver()
    try:
        wait_for_login(driver)
        do_search(driver)
        rows = scrape_all(driver)
        save_csv(rows, OUTPUT_CSV)
    except Exception:
        traceback.print_exc()
    finally:
        driver.quit()
        print("Browser closed.")


if __name__ == "__main__":
    main()
