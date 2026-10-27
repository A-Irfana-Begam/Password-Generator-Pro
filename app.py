from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import secrets
import string
import hashlib
import os


app = Flask(__name__)


# ==========================================
# Database
# ==========================================

DATABASE = "database/passwords.db"


# ==========================================
# Character Sets
# ==========================================

UPPERCASE = string.ascii_uppercase

LOWERCASE = string.ascii_lowercase

NUMBERS = string.digits

SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/"


# ==========================================
# Initialize Database
# ==========================================

def initialize_database():

    os.makedirs(
        "database",
        exist_ok=True
    )

    connection = sqlite3.connect(
        DATABASE
    )

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS generated_passwords (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            password_hash TEXT UNIQUE NOT NULL,

            created_at TIMESTAMP
            DEFAULT CURRENT_TIMESTAMP

        )
    """)

    connection.commit()

    connection.close()


# ==========================================
# Hash Password
# ==========================================

def hash_password(password):

    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


# ==========================================
# Save Password
# ==========================================

def save_password(password):

    password_hash = hash_password(
        password
    )

    connection = sqlite3.connect(
        DATABASE
    )

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


# ==========================================
# Generate Password
# ==========================================

def generate_password(
    length,
    use_uppercase,
    use_lowercase,
    use_numbers,
    use_symbols
):

    character_sets = []


    if use_uppercase:

        character_sets.append(
            UPPERCASE
        )


    if use_lowercase:

        character_sets.append(
            LOWERCASE
        )


    if use_numbers:

        character_sets.append(
            NUMBERS
        )


    if use_symbols:

        character_sets.append(
            SYMBOLS
        )


    if not character_sets:

        raise ValueError(
            "Select at least one character type."
        )


    if length < 8 or length > 64:

        raise ValueError(
            "Password length must be between 8 and 64."
        )


    if length < len(character_sets):

        raise ValueError(
            "Password length is too short for the selected character types."
        )


    password_characters = []


    # At least one character
    # from every selected type

    for character_set in character_sets:

        password_characters.append(
            secrets.choice(character_set)
        )


    pool = "".join(
        character_sets
    )


    # Fill remaining characters

    while len(password_characters) < length:

        password_characters.append(
            secrets.choice(pool)
        )


    # Secure shuffle

    secrets.SystemRandom().shuffle(
        password_characters
    )


    return "".join(
        password_characters
    )


# ==========================================
# Generate Globally Unique Password
# ==========================================

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


        # Database UNIQUE constraint
        # guarantees no duplicate hash

        if save_password(password):

            return password


    raise RuntimeError(
        "Could not generate a unique password."
    )


# ==========================================
# Home Page
# ==========================================

@app.route("/")
def home():

    return send_from_directory(
        ".",
        "index.html"
    )


# ==========================================
# CSS
# ==========================================

@app.route("/style.css")
def style():

    return send_from_directory(
        ".",
        "style.css"
    )


# ==========================================
# JavaScript
# ==========================================

@app.route("/script.js")
def script():

    return send_from_directory(
        ".",
        "script.js"
    )


# ==========================================
# Generate Passwords API
# ==========================================

@app.route(
    "/api/generate",
    methods=["POST"]
)
def generate():

    try:

        data = request.get_json()


        # Password length

        length = int(
            data.get(
                "length",
                16
            )
        )


        # Number of passwords

        count = int(
            data.get(
                "count",
                1
            )
        )


        # Security limits

        if count < 1 or count > 10:

            return jsonify({

                "success": False,

                "error":
                    "Password count must be between 1 and 10."

            }), 400


        uppercase = bool(
            data.get(
                "uppercase",
                True
            )
        )


        lowercase = bool(
            data.get(
                "lowercase",
                True
            )
        )


        numbers = bool(
            data.get(
                "numbers",
                True
            )
        )


        symbols = bool(
            data.get(
                "symbols",
                True
            )
        )


        passwords = []


        # Generate each password
        # and store immediately

        for _ in range(count):

            password = generate_unique_password(

                length,

                uppercase,

                lowercase,

                numbers,

                symbols

            )

            passwords.append(
                password
            )


        return jsonify({

            "success": True,

            "passwords": passwords,

            "count": len(passwords)

        })


    except ValueError as error:

        return jsonify({

            "success": False,

            "error": str(error)

        }), 400


    except Exception as error:

        print(
            "ERROR:",
            error
        )


        return jsonify({

            "success": False,

            "error":
                "Password generation failed."

        }), 500


# ==========================================
# Health Check
# ==========================================

@app.route("/health")
def health():

    return jsonify({

        "status":
            "running"

    })


# ==========================================
# Start Application
# ==========================================

if __name__ == "__main__":

    initialize_database()


    print()

    print(
        "Password Generator Pro is running..."
    )

    print(
        "Open: http://127.0.0.1:5000"
    )

    print()


    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True

    )
