// ==========================================
// Password Generator Pro
// ==========================================

// DOM Elements
const generatedPassword =
    document.getElementById("generatedPassword");

const passwordLength =
    document.getElementById("passwordLength");

const lengthValue =
    document.getElementById("lengthValue");

const uppercase =
    document.getElementById("uppercase");

const lowercase =
    document.getElementById("lowercase");

const numbers =
    document.getElementById("numbers");

const symbols =
    document.getElementById("symbols");

const generateButton =
    document.getElementById("generateButton");

const copyButton =
    document.getElementById("copyButton");

const copyMessage =
    document.getElementById("copyMessage");

const strengthText =
    document.getElementById("strengthText");

const strengthFill =
    document.getElementById("strengthFill");


// ==========================================
// Character Sets
// ==========================================

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/";

// ==========================================
// Secure Random Character
// ==========================================

function secureRandomCharacter(characters) {

    const randomArray = new Uint32Array(1);

    window.crypto.getRandomValues(randomArray);

    return characters[
        randomArray[0] % characters.length
    ];
}


// ==========================================
// Secure Shuffle
// ==========================================

function secureShuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const randomArray = new Uint32Array(1);

        window.crypto.getRandomValues(randomArray);

        const j =
            randomArray[0] % (i + 1);

        [array[i], array[j]] =
            [array[j], array[i]];
    }

    return array;
}


// ==========================================
// Local Password Generator
// ==========================================

function generateLocalPassword(
    length,
    useUppercase,
    useLowercase,
    useNumbers,
    useSymbols
) {

    const selectedSets = [];

    if (useUppercase) {
        selectedSets.push(UPPERCASE);
    }

    if (useLowercase) {
        selectedSets.push(LOWERCASE);
    }

    if (useNumbers) {
        selectedSets.push(NUMBERS);
    }

    if (useSymbols) {
        selectedSets.push(SYMBOLS);
    }


    if (selectedSets.length === 0) {

        throw new Error(
            "Please select at least one character type."
        );
    }


    const passwordCharacters = [];


    // At least one character from each type
    selectedSets.forEach(characterSet => {

        passwordCharacters.push(
            secureRandomCharacter(characterSet)
        );

    });


    const pool =
        selectedSets.join("");


    while (
        passwordCharacters.length < length
    ) {

        passwordCharacters.push(
            secureRandomCharacter(pool)
        );
    }


    secureShuffle(passwordCharacters);


    return passwordCharacters.join("");
}


// ==========================================
// Password Strength
// ==========================================

function calculateStrength(password) {

    let score = 0;

    const length = password.length;


    if (length >= 8) {
        score += 20;
    }

    if (length >= 12) {
        score += 20;
    }

    if (length >= 16) {
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
// Update Strength
// ==========================================

function updateStrength(password) {

    if (!password) {

        strengthText.textContent =
            "Not Generated";

        strengthFill.style.width =
            "0%";

        return;
    }


    const strength =
        calculateStrength(password);


    strengthText.textContent =
        strength.text;

    strengthFill.style.width =
        strength.percentage + "%";
}


// ==========================================
// Generate Password
// ==========================================

async function generatePassword() {

    const length =
        parseInt(passwordLength.value);


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
    generateButton.disabled = true;

    generateButton.textContent =
        "Generating...";

    copyMessage.textContent =
        "Generating a secure unique password...";


    try {

        // Send request to Flask backend
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

                        length: length,

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


        // Show password
        generatedPassword.value =
            data.password;


        // Update strength
        updateStrength(
            data.password
        );


        copyMessage.textContent =
            "New unique password generated.";


    } catch (error) {

        console.error(
            "Backend error:",
            error
        );


        // Local fallback
        try {

            const password =
                generateLocalPassword(

                    length,

                    useUppercase,

                    useLowercase,

                    useNumbers,

                    useSymbols

                );


            generatedPassword.value =
                password;


            updateStrength(
                password
            );


            copyMessage.textContent =
                "Password generated. Server duplicate protection is unavailable.";


        } catch (localError) {

            copyMessage.textContent =
                localError.message;
        }

    } finally {

        generateButton.disabled =
            false;

        generateButton.textContent =
            "✨ Generate Secure Password";
    }
}


// ==========================================
// Copy Password
// ==========================================

async function copyPassword() {

    const password =
        generatedPassword.value;


    if (!password) {

        copyMessage.textContent =
            "Generate a password first.";

        return;
    }


    try {

        await navigator.clipboard.writeText(
            password
        );


        copyMessage.textContent =
            "Password copied to clipboard!";


    } catch (error) {

        generatedPassword.select();

        document.execCommand("copy");


        copyMessage.textContent =
            "Password copied to clipboard!";
    }
}


// ==========================================
// Length Slider
// ==========================================

passwordLength.addEventListener(
    "input",
    function () {

        lengthValue.textContent =
            this.value;

    }
);


// ==========================================
// Generate Button
// ==========================================

generateButton.addEventListener(
    "click",
    generatePassword
);


// ==========================================
// Copy Button
// ==========================================

copyButton.addEventListener(
    "click",
    copyPassword
);


// ==========================================
// Initial State
// IMPORTANT:
// No password generated automatically.
// ==========================================

generatedPassword.value = "";

strengthText.textContent =
    "Not Generated";

strengthFill.style.width =
    "0%";

copyMessage.textContent =
    "Click Generate Secure Password to create a password.";