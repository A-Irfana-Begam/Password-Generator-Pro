from flask import Flask, request, jsonify, send_from_directory
import os
import secrets
import string
import hashlib
import psycopg

app = Flask(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL")

UPPERCASE = string.ascii_uppercase
LOWERCASE = string.ascii_lowercase
NUMBERS = string.digits
SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/"


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is missing.")
    return psycopg.connect(DATABASE_URL)


def initialize_database():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS generated_passwords (
                id BIGSERIAL PRIMARY KEY,
                password_hash TEXT UNIQUE NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        """)


def generate_password(length, options):
    sets = []
    if options["uppercase"]:
        sets.append(UPPERCASE)
    if options["lowercase"]:
        sets.append(LOWERCASE)
    if options["numbers"]:
        sets.append(NUMBERS)
    if options["symbols"]:
        sets.append(SYMBOLS)

    if not sets:
        raise ValueError("Select at least one character type.")
    if length < 8 or length > 64:
        raise ValueError("Password length must be between 8 and 64.")
    if length < len(sets):
        raise ValueError("Password length is too short.")

    chars = [secrets.choice(s) for s in sets]
    pool = "".join(sets)

    while len(chars) < length:
        chars.append(secrets.choice(pool))

    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


def generate_unique_password(length, options):
    for _ in range(100):
        password = generate_password(length, options)
        password_hash = hashlib.sha256(password.encode()).hexdigest()

        with get_connection() as conn:
            result = conn.execute("""
                INSERT INTO generated_passwords (password_hash)
                VALUES (%s)
                ON CONFLICT (password_hash) DO NOTHING
                RETURNING id
            """, (password_hash,))

            if result.fetchone():
                return password

    raise RuntimeError("Could not generate a unique password.")


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/style.css")
def style():
    return send_from_directory(".", "style.css")


@app.route("/script.js")
def script():
    return send_from_directory(".", "script.js")


@app.route("/api/generate", methods=["POST"])
def generate():
    try:
        data = request.get_json(silent=True) or {}

        length = int(data.get("length", 16))
        count = int(data.get("count", 1))

        if count < 1 or count > 10:
            return jsonify(success=False, error="Count must be 1 to 10."), 400

        options = {
            "uppercase": data.get("uppercase", True) is True,
            "lowercase": data.get("lowercase", True) is True,
            "numbers": data.get("numbers", True) is True,
            "symbols": data.get("symbols", True) is True
        }

        initialize_database()

        passwords = [
            generate_unique_password(length, options)
            for _ in range(count)
        ]

        return jsonify(success=True, passwords=passwords, count=len(passwords))

    except (ValueError, TypeError) as error:
        return jsonify(success=False, error=str(error)), 400

    except Exception:
        app.logger.exception("Password generation failed")
        return jsonify(success=False, error="Password generation failed. Check database connection."), 500


@app.route("/health")
def health():
    return jsonify(status="running")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
