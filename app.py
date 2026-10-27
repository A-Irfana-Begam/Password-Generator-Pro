from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import secrets
import string
import hashlib


app = Flask(__name__)

DATABASE = "database/passwords.db"

UPPERCASE = string.ascii_uppercase
LOWERCASE = string.ascii_lowercase
NUMBERS = string.digits
SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/"


def initialize_database():
    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS generated_passwords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            password_hash TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


def hash_password(password):
    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


def save_password(password):
    password_hash = hash_password(password)

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO generated_passwords
            (password_hash)
            VALUES (?)
            """,
            (password_hash,)
        )

        connection.commit()

        success = True

    except sqlite3.IntegrityError:
        success = False

    finally:
        connection.close()

    return success


def generate_password(
    length,
    use_uppercase,
    use_lowercase,
    use_numbers,
    use_symbols
):

    character_sets = []

    if use_uppercase:
        character_sets.append(UPPERCASE)

    if use_lowercase:
        character_sets.append(LOWERCASE)

    if use_numbers:
        character_sets.append(NUMBERS)

    if use_symbols:
        character_sets.append(SYMBOLS)

    if not character_sets:
        raise ValueError(
            "Select at least one character type."
        )

    if length < 8 or length > 64:
        raise ValueError(
            "Password length must be between 8 and 64."
        )

    password_characters = []

    for character_set in character_sets:
        password_characters.append(
            secrets.choice(character_set)
        )

    pool = "".join(character_sets)

    while len(password_characters) < length:
        password_characters.append(
            secrets.choice(pool)
        )

    secrets.SystemRandom().shuffle(
        password_characters
    )

    return "".join(password_characters)


def generate_unique_password(
    length,
    use_uppercase,
    use_lowercase,
    use_numbers,
    use_symbols
):

    for _ in range(100):

        password = generate_password(
            length,
            use_uppercase,
            use_lowercase,
            use_numbers,
            use_symbols
        )

        if save_password(password):
            return password

    raise RuntimeError(
        "Could not generate a unique password."
    )


@app.route("/")
def home():
    return send_from_directory(
        ".",
        "index.html"
    )


@app.route("/style.css")
def style():
    return send_from_directory(
        ".",
        "style.css"
    )


@app.route("/script.js")
def script():
    return send_from_directory(
        ".",
        "script.js"
    )


@app.route("/api/generate", methods=["POST"])
def generate():

    try:

        data = request.get_json()

        length = int(
            data.get("length", 16)
        )

        uppercase = bool(
            data.get("uppercase", True)
        )

        lowercase = bool(
            data.get("lowercase", True)
        )

        numbers = bool(
            data.get("numbers", True)
        )

        symbols = bool(
            data.get("symbols", True)
        )

        password = generate_unique_password(
            length,
            uppercase,
            lowercase,
            numbers,
            symbols
        )

        return jsonify({
            "success": True,
            "password": password
        })

    except ValueError as error:

        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:

        print("ERROR:", error)

        return jsonify({
            "success": False,
            "error": "Password generation failed."
        }), 500


@app.route("/health")
def health():
    return jsonify({
        "status": "running"
    })


if __name__ == "__main__":

    initialize_database()

    print()
    print("Password Generator Pro is running...")
    print("Open: http://127.0.0.1:5000")
    print()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )