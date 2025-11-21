"""
Standalone version of the Kestra worker script for local testing.
Usage: set environment variables `MONGODB_URI`, `MAIL_USER`, `MAIL_PASS` then run `python kestra/main.py`.
"""
import os
import time
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
import smtplib

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from pymongo import MongoClient
from dateutil import parser as date_parser
from dotenv import load_dotenv

# Config
load_dotenv()
MONGODB_URI = "mongodb+srv://anuraggoutam133:HWaJsQnsOoDOrTPV@CryptoNotify.veuu6yq.mongodb.net/"
MAIL_USER = "anuraggoutam133@gmail.com"
MAIL_PASS = "oyae mcuw domi gffb"
COINGECKO_API_URL = os.getenv("CG-gHKmA3efoGrfXBuVZ4LrmMyj", "https://api.coingecko.com/api/v3")
COOLDOWN_HOURS = int(os.getenv("ALERT_COOLDOWN_HOURS", "6"))
REQUEST_TIMEOUT = 10

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kestra-crypto-monitor")

def create_session():
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    session.mount("https://", HTTPAdapter(max_retries=retries))
    return session

def send_email(to_email: str, subject: str, body: str) -> bool:
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = MAIL_USER

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = to_email

        with smtplib.SMTP(smtp_server, smtp_port, timeout=REQUEST_TIMEOUT) as server:
            server.starttls()
            server.login(MAIL_USER, MAIL_PASS)
            server.sendmail(sender_email, [to_email], msg.as_string())
        return True
    except Exception as e:
        logger.exception("Error sending email to %s: %s", to_email, e)
        return False

def main():
    if not MONGODB_URI:
        logger.error("MONGODB_URI is not set")
        return

    client = MongoClient(MONGODB_URI)
    try:
        db = client.get_default_database()
    except Exception:
        # No default database in the connection string; fall back to named DB
        db = client['blockpulse']
    collection = db['thresholds']

    records = list(collection.find({"notifications": True}))
    if not records:
        logger.info("No records with notifications enabled")
        return

    unique_ids = sorted({r.get("blockchainId") for r in records if r.get("blockchainId")})
    if not unique_ids:
        logger.info("No blockchain ids found in records")
        return

    session = create_session()
    ids_param = ",".join(unique_ids)
    try:
        resp = session.get(f"{COINGECKO_API_URL}/simple/price",
                           params={"ids": ids_param, "vs_currencies": "usd"},
                           timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        price_data = resp.json()
    except Exception as e:
        logger.exception("Failed to fetch prices from CoinGecko: %s", e)
        return

    now = datetime.utcnow()
    cooldown_delta = timedelta(hours=COOLDOWN_HOURS)

    for record in records:
        try:
            blockchain_id = record.get("blockchainId")
            if not blockchain_id:
                continue

            user_email = record.get("userEmail")
            name = record.get("name", blockchain_id)
            symbol = record.get("symbol", "")
            try:
                low_threshold = float(record.get("lowThreshold", 0))
                high_threshold = float(record.get("highThreshold", 0))
            except Exception:
                logger.warning("Invalid thresholds for record %s", record.get("_id"))
                continue

            last_sent = record.get("lastAlertSent")
            if last_sent:
                try:
                    last_sent_dt = date_parser.parse(last_sent)
                except Exception:
                    last_sent_dt = None
            else:
                last_sent_dt = None

            if last_sent_dt and (now - last_sent_dt) < cooldown_delta:
                logger.info("Skipping %s, still in cooldown", blockchain_id)
                continue

            item = price_data.get(blockchain_id)
            if not item or "usd" not in item:
                logger.info("No price for %s", blockchain_id)
                continue

            current_price = float(item["usd"])
            if current_price < low_threshold or current_price > high_threshold:
                threshold_message = "below your low threshold" if current_price < low_threshold else "above your high threshold"
                subject = f"Crypto Price Alert: {name} ({symbol})"

                body_lines = [
                    f"Price Alert for {name} ({symbol})!",
                    "",
                    f"Current Price: ${current_price:,.2f} USD",
                    "Your Thresholds:",
                    f"- Low: ${low_threshold:,.2f}",
                    f"- High: ${high_threshold:,.2f}",
                    "",
                    "This alert was triggered because the current price is " + threshold_message + ".",
                    "",
                    "Best regards,",
                    "Your Crypto Monitor"
                ]

                body = "\n".join(body_lines)
                if send_email(user_email, subject, body):
                    logger.info("Alert sent to %s for %s", user_email, name)
                    collection.update_one({"_id": record.get("_id")}, {"$set": {"lastAlertSent": now.isoformat(), "lastAlertPrice": current_price}})
                else:
                    logger.warning("Failed to send alert to %s for %s", user_email, name)

        except Exception as e:
            logger.exception("Error processing record %s: %s", record.get("_id"), e)
            continue

    client.close()

if __name__ == "__main__":
    main()
