// ==========================================
// Password Generator Pro - Fixed JavaScript
// ==========================================

// DOM Elements
const passwordResults = document.getElementById("passwordResults");
const passwordLength = document.getElementById("passwordLength");
const lengthValue = document.getElementById("lengthValue");
const passwordCount = document.getElementById("passwordCount");
const countValue = document.getElementById("countValue");

const uppercase = document.getElementById("uppercase");
const lowercase = document.getElementById("lowercase");
const numbers = document.getElementById("numbers");
const symbols = document.getElementById("symbols");

const generateButton = document.getElementById("generateButton");
const copyMessage = document.getElementById("copyMessage");

// Check required elements
if (
    !passwordResults ||
    !passwordLength ||
    !passwordCount ||
    !generateButton ||
    !copyMessage
) {
    console.error("Required HTML elements are missing.");
}


// ==========================================
// Password Strength
// ==========================================

function calculateStrength(password) {
    let score = 0;

    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 20;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;

    if (score >= 80) {
        return { text: "Strong", percentage: 100 };
    }

    if (score >= 60) {
        return { text: "Good", percentage: 75 };
    }

    if (score >= 40) {
        return { text: "Medium", percentage: 50 };
    }

    return { text: "Weak", percentage: 25 };
}


// ==========================================
// Create Password Card
// ==========================================

function createPasswordCard(password, index) {
    const strength = calculateStrength(password);

    const card = document.createElement("div");
    card.className = "password-card";

    const number = document.createElement("div");
    number.className = "password-number";
    number.textContent = index + 1;

    const content = document.createElement("div");
    content.className = "password-content";

    const passwordInput = document.createElement("input");
    passwordInput.type = "text";
    passwordInput.className = "generated-password";
    passwordInput.value = password;
    passwordInput.readOnly = true;
    passwordInput.setAttribute("aria-label", `Generated password ${index + 1}`);

    const meta = document.createElement("div");
    meta.className = "password-meta";

    const strengthBadge = document.createElement("span");
    strengthBadge.className = "strength-badge";
    strengthBadge.textContent = strength.text;

    const passwordLengthLabel = document.createElement("span");
    passwordLengthLabel.className = "password-length";
    passwordLengthLabel.textContent = `${password.length} characters`;

    meta.append(strengthBadge, passwordLengthLabel);
    content.append(passwordInput, meta);

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "copy-password-button";
    copyButton.textContent = "Copy";
    copyButton.dataset.password = password;

    card.append(number, content, copyButton);

    return card;
}


// ==========================================
// Display Passwords
// ==========================================

function displayPasswords(passwords) {
    passwordResults.replaceChildren();

    passwords.forEach((password, index) => {
        passwordResults.appendChild(
            createPasswordCard(password, index)
        );
    });
}


// ==========================================
// Generate Passwords
// ==========================================

async function generatePasswords() {
    const length = Number(passwordLength.value);
    const count = Number(passwordCount.value);

    const useUppercase = uppercase.checked;
    const useLowercase = lowercase.checked;
    const useNumbers = numbers.checked;
    const useSymbols = symbols.checked;

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

    if (length < 8 || length > 64) {
        copyMessage.textContent =
            "Password length must be between 8 and 64.";
        return;
    }

    if (count < 1 || count > 10) {
        copyMessage.textContent =
            "Password count must be between 1 and 10.";
        return;
    }

    generateButton.disabled = true;
    generateButton.textContent = "Generating...";
    copyMessage.textContent = `Generating ${count} unique passwords...`;

    try {
        const response = await fetch("/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                length,
                count,
                uppercase: useUppercase,
                lowercase: useLowercase,
                numbers: useNumbers,
                symbols: useSymbols
            })
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error(
                "Server response error. Please check your deployment."
            );
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Password generation failed."
            );
        }

        if (
            !Array.isArray(data.passwords) ||
            data.passwords.length === 0
        ) {
            throw new Error("No passwords were returned by the server.");
        }

        displayPasswords(data.passwords);

        copyMessage.textContent =
            `${data.passwords.length} unique passwords generated successfully!`;

    } catch (error) {
        console.error("Generation error:", error);

        copyMessage.textContent =
            error.message || "Unable to generate passwords. Try again.";

    } finally {
        generateButton.disabled = false;
        generateButton.textContent = "✨ Generate Secure Passwords";
    }
}


// ==========================================
// Copy Password
// ==========================================

async function copyPassword(password, button) {
    try {
        await navigator.clipboard.writeText(password);

        const originalText = button.textContent;
        button.textContent = "Copied!";

        copyMessage.textContent =
            "Password copied successfully!";

        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);

    } catch (error) {
        console.error("Copy error:", error);
        copyMessage.textContent =
            "Copy failed. Please select and copy manually.";
    }
}


// ==========================================
// Copy Button Event
// ==========================================

passwordResults.addEventListener("click", (event) => {
    const button = event.target.closest(".copy-password-button");

    if (!button) return;

    copyPassword(button.dataset.password, button);
});


// ==========================================
// Slider Updates
// ==========================================

passwordLength.addEventListener("input", () => {
    lengthValue.textContent = passwordLength.value;
});

passwordCount.addEventListener("input", () => {
    countValue.textContent = passwordCount.value;
});


// ==========================================
// Generate Button
// ==========================================

generateButton.addEventListener("click", generatePasswords);


// ==========================================
// Initial State
// ==========================================

passwordResults.replaceChildren();

copyMessage.textContent =
    "Click Generate Secure Passwords to create passwords.";

lengthValue.textContent = passwordLength.value;
countValue.textContent = passwordCount.value;
