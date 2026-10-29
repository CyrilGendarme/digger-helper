import logging
import os
import re
import time
import unicodedata

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from app.models.record import MediaLink, Platform

from .chrome_helpers import get_or_attach_driver

logger = logging.getLogger(__name__)

# Delay between consecutive album-page loads, to avoid hammering Bandcamp.
PRICE_LOOKUP_DELAY_SECONDS = 2
# Don't start another album-page load with less time than this left in the budget.
PRICE_LOOKUP_MIN_SECONDS = 4
PROFILE_DIR = os.path.join(os.path.dirname(__file__), "selenium_chrome_profile")


def get_bandcamp_info(driver, name="", artist="", record_ref="") -> list[dict[str, str]]:

    query = f"{artist} {name} {record_ref}"
    query = unicodedata.normalize("NFKD", query)
    query = "".join(c for c in query if not unicodedata.combining(c))
    query = re.sub(r"[^A-Za-z0-9]+", " ", query).strip()
    query = " ".join(query.split())
    query = query.lower()
    query = query.replace(" ", "%20")
    search_url = f"https://bandcamp.com/search?q={query}&item_type="

    logger.info(
        "Bandcamp scrape start | name=%r artist=%r record_ref=%r query=%r",
        name,
        artist,
        record_ref,
        query,
    )

    driver.get(search_url)
    logger.debug("Bandcamp navigation complete | url=%s", search_url)

    #  Wait for page to be fully loaded (specifically the results list)
    wait = WebDriverWait(driver, 15)
    ul_element = wait.until(
        EC.presence_of_element_located((By.CLASS_NAME, "result-items"))
    )

    # Optional: ensure at least one <li> is present
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ul.result-items li")))

    # Get all <li> elements inside the <ul>
    li_elements = ul_element.find_elements(By.TAG_NAME, "li")
    logger.info("Bandcamp raw results container | li_count=%d", len(li_elements))

    results = []

    # Iterate through each <li>
    for li in li_elements:
        try:
            item_type_div = li.find_element(By.CLASS_NAME, "itemtype")
            item_type = item_type_div.text.strip().lower()
            if item_type != "album":
                continue

            heading_div = li.find_element(By.CLASS_NAME, "heading")
            title = heading_div.text.strip()
            heading_link = heading_div.find_element(By.XPATH, "a")
            href = (heading_link.get_attribute("href") or "").split("?from=search")[0]

            subhead_div = li.find_element(By.CLASS_NAME, "subhead")
            artist_info = subhead_div.text.strip()

            results.append(
                {"title": title, "artist": artist_info, "href": href, "price": ""}
            )

        except Exception as e:
            # Skip malformed entries (ads, missing fields, etc.)
            logger.debug("Bandcamp skipping malformed result item | error=%s", e)
            continue

    logger.info("Bandcamp parsed album results | count=%d", len(results))

    return results


def clean_record_list_result(bandcamp_info, name="", artist=""):

    filtered_bandcamp_info = []

    if artist.strip() != "":
        for item in bandcamp_info:
            if artist.lower() == item["artist"].lower():
                filtered_bandcamp_info.append(item)
    else:
        filtered_bandcamp_info = bandcamp_info

    super_filtered_bandcamp_info = []
    if name.strip() != "":
        for item in filtered_bandcamp_info:
            if name.lower() in item["title"].lower():
                super_filtered_bandcamp_info.append(item)
    else:
        super_filtered_bandcamp_info = filtered_bandcamp_info

    if len(super_filtered_bandcamp_info) != 0:
        return super_filtered_bandcamp_info
    elif len(filtered_bandcamp_info) != 0:
        return filtered_bandcamp_info
    else:
        return bandcamp_info


def add_bandcamp_record_price(
    driver, bandcamp_info: list[dict[str, str]], deadline: float | None = None
) -> list[dict[str, str]]:
    """
    Fill in each item's digital price by loading its album page.

    Prices are optional extras: once `deadline` (a time.monotonic() value) gets
    close, the remaining items are returned without a price rather than late.
    """
    for i, item in enumerate(bandcamp_info):
        wait_seconds = 15.0
        if deadline is not None:
            remaining = deadline - time.monotonic() - (PRICE_LOOKUP_DELAY_SECONDS if i > 0 else 0)
            if remaining < PRICE_LOOKUP_MIN_SECONDS:
                logger.info(
                    "Bandcamp price lookup stopped by time budget | priced=%d of %d",
                    i,
                    len(bandcamp_info),
                )
                break
            wait_seconds = min(wait_seconds, remaining)

        if i > 0:
            time.sleep(PRICE_LOOKUP_DELAY_SECONDS)

        try:
            driver.set_page_load_timeout(wait_seconds)
            driver.get(item["href"])
            element = WebDriverWait(driver, wait_seconds).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".buyItem.digital"))
            )
            item["price"] = element.find_element(By.CSS_SELECTOR, "span.base-text-color").text.strip()
        except Exception as e:
            logger.debug(
                "Bandcamp price lookup failed | title=%r artist=%r url=%s error=%s",
                item.get("title", ""),
                item.get("artist", ""),
                item.get("href", ""),
                e,
            )

    return bandcamp_info


def _start_driver():
    """Start headless Chrome, falling back to a throwaway profile if the shared one is locked."""
    for use_profile in (True, False):
        try:
            driver, _ = get_or_attach_driver(
                width=1280,
                height=800,
                DEBUG_PORT=9223,  # use a different port from any interactive session
                CHROME_PROFILE_DIR=PROFILE_DIR,
                CHROME_DEV_CONSOLE=False,
                HEADLESS_MODE=True,
                HEADLESS_USE_PROFILE=use_profile,
                shall_include_process=True,
            )
            logger.debug("Bandcamp browser ready | use_profile=%s", use_profile)
            return driver
        except Exception:
            if not use_profile:
                raise
            logger.warning("Bandcamp browser startup failed with profile; retrying without profile")


def search_bandcamp(
    name="", artist="", record_ref="", limit: int = 5, budget_seconds: float | None = None
) -> list[MediaLink]:
    """
    Entry point called by the FastAPI route.

    Spins up a headless Chrome, scrapes Bandcamp search results, filters them,
    looks up digital prices for the top `limit` albums and returns MediaLinks.
    With `budget_seconds`, price lookups that would overrun it are skipped so the
    links still come back in time (without a price).
    """
    deadline = time.monotonic() + budget_seconds if budget_seconds is not None else None
    logger.info(
        "Bandcamp search | name=%r artist=%r record_ref=%r limit=%d", name, artist, record_ref, limit
    )
    driver = None
    try:
        driver = _start_driver()

        raw = get_bandcamp_info(driver, name=name, artist=artist, record_ref=record_ref)
        logger.info("Bandcamp scrape completed | raw_count=%d", len(raw))

        # Bandcamp subhead is "by Artist Name" — strip the prefix so that
        # clean_record_list_result's exact-match and the display title are clean.
        for item in raw:
            a = item.get("artist", "")
            if a.lower().startswith("by "):
                item["artist"] = a[3:].strip()

        results = clean_record_list_result(raw, name=name, artist=artist)
        logger.info("Bandcamp filtered results | count=%d", len(results))

        # Price lookup loads one page per item — apply only to the slice we return.
        sliced = results[:limit]
        add_bandcamp_record_price(driver, sliced, deadline=deadline)

        links: list[MediaLink] = []
        for item in sliced:
            title = item.get("title", "")
            artist_val = item.get("artist", "")
            links.append(
                MediaLink(
                    platform=Platform.bandcamp,
                    title=f"{title} — {artist_val}" if artist_val else title,
                    url=item["href"],
                    channel=artist_val or None,
                    price=item.get("price") or None,
                )
            )

        logger.info("Bandcamp search | found %d results", len(links))
        return links

    except Exception:
        logger.exception(
            "Bandcamp search failed | name=%r artist=%r record_ref=%r limit=%d",
            name,
            artist,
            record_ref,
            limit,
        )
        return []

    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
