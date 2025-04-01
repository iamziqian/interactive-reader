chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "OFF",
    });
});

chrome.action.onClicked.addListener(async (tab) => {
    console.log("Extension icon clicked on tab:", tab.url); // Debug log

    // Check if the tab's URL is valid for scripting
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com/webstore")) {
        console.warn("This URL cannot be scripted:", tab.url);
        return;
    }

    // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // Next state will always be the opposite
    const nextState = prevState === "ON" ? "OFF" : "ON";

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
        tabId: tab.id,
        text: nextState,
    });
    console.log("Badge updated to:", nextState); // Debug log

    if (nextState === "ON") {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: addTimersToParagraphs, // Inject the function directly
        });
    } else if (nextState === "OFF") {
        console.log("Extension turned OFF. No further action needed.");
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: cleanupTimers, // Inject the cleanup function directly
        });
    }
});

function addTimersToParagraphs() {
    // Function to calculate word count
    function getWordCount(text) {
        const wordMatchRegExp = /[^\s]+/g;
        const words = text.match(wordMatchRegExp) || [];
        return words.length;
    }

    // Select all paragraph elements on the page
    const paragraphs = document.querySelectorAll("p");

    paragraphs.forEach((paragraph) => {
        // Skip the badge paragraph (identified by its class)
        if (paragraph.classList.contains("color-secondary-text") && paragraph.classList.contains("type--caption")) {
            return;
        }

        paragraph.setAttribute("data-original-content", paragraph.innerHTML); // Store the original content

        // Calculate the word count for the paragraph
        const wordCount = getWordCount(paragraph.textContent);
        if (wordCount === 0) return; // Skip empty paragraphs

        // Calculate recommended reading time (in seconds)
        const readingTime = Math.ceil(wordCount / (200 / 60)); // 200 words per minute

        // Create a wrapper div for the paragraph and timer
        const wrapper = document.createElement("div");
        wrapper.style.marginBottom = "20px";
        wrapper.style.border = "1px solid #ccc";
        wrapper.style.padding = "10px";
        wrapper.style.borderRadius = "5px";
        wrapper.setAttribute("data-original-content-wrapper", "true"); // Add attribute to identify the wrapper

        // Create a timer element
        const timer = document.createElement("div");
        timer.style.fontSize = "14px";
        timer.style.color = "#555";
        timer.style.marginBottom = "10px";
        timer.textContent = `Time left: ${readingTime} seconds`;

        // Append the timer and paragraph to the wrapper
        wrapper.appendChild(timer);

        // Create a new paragraph element to hold the splitting text
        const newParagraph = document.createElement("p");

        // Wrap each word in a <span> and append it back to the paragraph
        const text = paragraph.textContent;
        text.split(" ").forEach((word) => {
            const span = document.createElement("span");
            span.textContent = word + " "; // Add a space after each word
            span.style.display = "inline-block";
            span.style.transition = "opacity 0.5s ease";
            span.style.whiteSpace = "pre"; // Preserve the whitespace
            newParagraph.appendChild(span);
        });

        // Append the new paragraph to the wrapper
        wrapper.appendChild(newParagraph);

        // Replace the original paragraph with the wrapper
        paragraph.replaceWith(wrapper);

        // Add an event listener to fade out the word when hovered
        newParagraph.addEventListener("mouseover", (event) => {
            const target = event.target;
            if (target.tagName === "SPAN") {
                const fadeTimeout = setTimeout(() => {
                    target.style.opacity = "0"; // Fade out the word after 120ms
                }, 120);

                target.addEventListener(
                    "mouseleave",
                    () => {
                        clearTimeout(fadeTimeout); // Cancel the fade-out
                    },
                    { once: true }
                );
            }
        });

        // Add an event listener to start the timer when the user interacts with the paragraph
        let timeLeft = readingTime;
        let interval = null;

        wrapper.addEventListener("mouseenter", () => {
            if (!interval) {
                interval = setInterval(() => {
                    timeLeft -= 1;
                    timer.textContent = `Time left: ${timeLeft} seconds`;

                    if (timeLeft <= 0) {
                        clearInterval(interval);
                        timer.textContent = "Time's up!";
                    }
                }, 1000);
            }
        });

        // Stop the timer if the user leaves the paragraph
        wrapper.addEventListener("mouseleave", () => {
            if (timeLeft > 0) {
                clearInterval(interval);
                interval = null;
                timer.textContent = `Time left: ${timeLeft} seconds`;
            }
        });
    });
}

function cleanupTimers() {
    // Select all wrapper elements that contain modified paragraphs
    const wrappers = document.querySelectorAll("div[data-original-content-wrapper]");

    wrappers.forEach((wrapper) => {
        // Find the original paragraph inside the wrapper
        const originalParagraph = wrapper.querySelector("[data-original-content]");

        if (originalParagraph) {
            // Restore the original content
            originalParagraph.innerHTML = originalParagraph.getAttribute("data-original-content");

            // Remove the data-original-content attribute
            originalParagraph.removeAttribute("data-original-content");

            // Replace the wrapper with the restored paragraph
            wrapper.parentNode.replaceChild(originalParagraph);
        }
    });

    console.log("Timers and wrappers have been cleaned up.");
}

