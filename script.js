
// Password Generator Pro

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

function calculateStrength(password) {
    let score = 0;

    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 20;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;

    if (score >= 80) return { text: "Strong" };
    if (score >= 60) return { text: "Good" };
    if (score >= 40) return { text: "Medium" };
    return { text: "Weak" };
}

function createPasswordCard(password, index) {
    const strength = calculateStrength(password);
    const card = document.createElement("div");
    card.className = "password-card";

    const number = document.createElement("div");
    number.className = "password-number";
    number.textContent = index + 1;

    const content = document.createElement("div");
    content.className = "password-content";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "generated-password";
    input.value = password;
    input.readOnly = true;

    const meta = document.createElement("div");
    meta.className = "password-meta";

    const badge = document.createElement("span");
    badge.className = "strength-badge";
    badge.textContent = strength.text;

    const length = document.createElement("span");
    length.className = "password-length";
    length.textContent = `${password.length} characters`;

    meta.append(badge, length);
    content.append(input, meta);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-password-button";
    button.textContent = "Copy";
    button.dataset.password = encodeURIComponent(password);

    card.append(number, content, button);
    return card;
}

function displayPasswords(passwords) {
    passwordResults.replaceChildren();

    passwords.forEach((password, index) => {
        passwordResults.appendChild(
            createPasswordCard(password, index)
        );
    });
}

async function generatePasswords() {
    const length = Number(passwordLength.value);
    const count = Number(passwordCount.value);

    const options = {
        uppercase: uppercase.checked,
        lowercase: lowercase.checked,
        numbers: numbers.checked,
        symbols: symbols.checked
    };

    if (!Object.values(options).some(Boolean)) {
        copyMessage.textContent =
            "Please select at least one character type.";
        return;
    }

    generateButton.disabled = true;
    generateButton.textContent = "Generating...";
    copyMessage.textContent = "Generating secure passwords...";

    try {
        const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                length,
                count,
                ...options
            })
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error("Server response error. Please redeploy and try again.");
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Password generation failed.");
        }

        if (!Array.isArray(data.passwords) || data.passwords.length === 0) {
            throw new Error("No passwords received from server.");
        }

        displayPasswords(data.passwords);

        copyMessage.textContent =
            `${data.count} unique password(s) generated successfully.`;

    } catch (error) {
        console.error("Generation error:", error);
        copyMessage.textContent = error.message;

    } finally {
        generateButton.disabled = false;
        generateButton.textContent = "✨ Generate Secure Passwords";
    }
}

async function copyPassword(password, button) {
    try {
        await navigator.clipboard.writeText(password);

        const originalText = button.textContent;
        button.textContent = "Copied!";
        copyMessage.textContent = "Password copied successfully!";

        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);

    } catch (error) {
        copyMessage.textContent = "Unable to copy password.";
    }
}

passwordResults.addEventListener("click", event => {
    const button = event.target.closest(".copy-password-button");

    if (!button) return;

    copyPassword(
        decodeURIComponent(button.dataset.password),
        button
    );
});

passwordLength.addEventListener("input", () => {
    lengthValue.textContent = passwordLength.value;
});

passwordCount.addEventListener("input", () => {
    countValue.textContent = passwordCount.value;
});

generateButton.addEventListener("click", generatePasswords);

passwordResults.replaceChildren();
copyMessage.textContent =
    "Click Generate Secure Passwords to create passwords.";
