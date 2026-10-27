// ==========================================
// Password Generator Pro
// ==========================================


// ==========================================
// DOM Elements
// ==========================================

const passwordResults =
    document.getElementById(
        "passwordResults"
    );

const passwordLength =
    document.getElementById(
        "passwordLength"
    );

const lengthValue =
    document.getElementById(
        "lengthValue"
    );

const passwordCount =
    document.getElementById(
        "passwordCount"
    );

const countValue =
    document.getElementById(
        "countValue"
    );

const uppercase =
    document.getElementById(
        "uppercase"
    );

const lowercase =
    document.getElementById(
        "lowercase"
    );

const numbers =
    document.getElementById(
        "numbers"
    );

const symbols =
    document.getElementById(
        "symbols"
    );

const generateButton =
    document.getElementById(
        "generateButton"
    );

const copyMessage =
    document.getElementById(
        "copyMessage"
    );


// ==========================================
// Password Strength
// ==========================================

function calculateStrength(password) {

    let score = 0;


    if (password.length >= 8) {

        score += 20;

    }


    if (password.length >= 12) {

        score += 20;

    }


    if (password.length >= 16) {

        score += 20;

    }


    if (/[A-Z]/.test(password)) {

        score += 10;

    }


    if (/[a-z]/.test(password)) {

        score += 10;

    }


    if (/[0-9]/.test(password)) {

        score += 10;

    }


    if (/[^A-Za-z0-9]/.test(password)) {

        score += 10;

    }


    if (score >= 80) {

        return {
            text: "Strong",
            percentage: 100
        };

    }


    if (score >= 60) {

        return {
            text: "Good",
            percentage: 75
        };

    }


    if (score >= 40) {

        return {
            text: "Medium",
            percentage: 50
        };

    }


    return {

        text: "Weak",

        percentage: 25

    };
}


// ==========================================
// Create Password Card
// ==========================================

function createPasswordCard(
    password,
    index
) {

    const strength =
        calculateStrength(
            password
        );


    const card =
        document.createElement(
            "div"
        );

    card.className =
        "password-card";


    card.innerHTML = `

        <div class="password-number">
            ${index + 1}
        </div>

        <div class="password-content">

            <input
                type="text"
                class="generated-password"
                value="${password}"
                readonly
            >

            <div class="password-meta">

                <span class="strength-badge">
                    ${strength.text}
                </span>

                <span class="password-length">
                    ${password.length} characters
                </span>

            </div>

        </div>

        <button
            type="button"
            class="copy-password-button"
            data-password="${encodeURIComponent(password)}"
        >
            Copy
        </button>

    `;


    return card;
}


// ==========================================
// Display Passwords
// ==========================================

function displayPasswords(
    passwords
) {

    passwordResults.innerHTML = "";


    passwords.forEach(
        (password, index) => {

            const card =
                createPasswordCard(
                    password,
                    index
                );

            passwordResults.appendChild(
                card
            );

        }
    );
}


// ==========================================
// Generate Passwords
// ==========================================

async function generatePasswords() {

    const length =
        parseInt(
            passwordLength.value
        );


    const count =
        parseInt(
            passwordCount.value
        );


    const useUppercase =
        uppercase.checked;


    const useLowercase =
        lowercase.checked;


    const useNumbers =
        numbers.checked;


    const useSymbols =
        symbols.checked;


    // Check character selection

    if (
        !useUppercase &&
        !useLowercase &&
        !useNumbers &&
        !useSymbols
    ) {

        copyMessage.textContent =
            "Please select at least one character type.";

        return;
    }


    // Loading state

    generateButton.disabled =
        true;


    generateButton.innerHTML =
        "⏳ Generating Secure Passwords...";


    copyMessage.textContent =
        `Generating ${count} unique password${count > 1 ? "s" : ""}...`;


    try {

        const response =
            await fetch(
                "/api/generate",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        length:
                            length,

                        count:
                            count,

                        uppercase:
                            useUppercase,

                        lowercase:
                            useLowercase,

                        numbers:
                            useNumbers,

                        symbols:
                            useSymbols

                    })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Password generation failed."
            );

        }


        // Display passwords

        displayPasswords(
            data.passwords
        );


        copyMessage.textContent =
            `${data.count} unique password${data.count > 1 ? "s" : ""} generated successfully.`;


    } catch (error) {

        console.error(
            "Generation error:",
            error
        );


        copyMessage.textContent =
            error.message ||
            "Unable to generate passwords. Please try again.";


    } finally {

        generateButton.disabled =
            false;


        generateButton.innerHTML =
            "✨ Generate Secure Passwords";

    }
}


// ==========================================
// Copy Individual Password
// ==========================================

async function copyPassword(
    password,
    button
) {

    try {

        await navigator.clipboard.writeText(
            password
        );


        const originalText =
            button.textContent;


        button.textContent =
            "Copied!";


        copyMessage.textContent =
            "Password copied to clipboard!";


        setTimeout(
            () => {

                button.textContent =
                    originalText;

            },
            1500
        );


    } catch (error) {

        copyMessage.textContent =
            "Unable to copy password.";

    }
}


// ==========================================
// Copy Button Event Handling
// ==========================================

passwordResults.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                ".copy-password-button"
            );


        if (!button) {

            return;

        }


        const password =
            decodeURIComponent(
                button.dataset.password
            );


        copyPassword(
            password,
            button
        );

    }
);


// ==========================================
// Password Length Slider
// ==========================================

passwordLength.addEventListener(
    "input",
    function () {

        lengthValue.textContent =
            this.value;

    }
);


// ==========================================
// Password Count Slider
// ==========================================

passwordCount.addEventListener(
    "input",
    function () {

        countValue.textContent =
            this.value;

    }
);


// ==========================================
// Generate Button
// ==========================================

generateButton.addEventListener(
    "click",
    generatePasswords
);


// ==========================================
// Initial State
// IMPORTANT:
// No password generated automatically.
// ==========================================

passwordResults.innerHTML = "";

copyMessage.textContent =
    "Click Generate Secure Passwords to create passwords.";
