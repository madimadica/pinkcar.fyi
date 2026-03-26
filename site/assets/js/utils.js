"use strict";
// https://github.com/madimadica/js-utils/blob/main/utils.js

/**
 * Dual-purpose escapeHTML function:
 * - Can be used as a normal function: escapeHTML(str)
 * - Can be used as a tagged template literal: escapeHTML`<div>${unsafe}</div>`
 */
function escapeHTML(strings, ...values) {
    // Tagged template usage escapeHTML`<div>${unsafeInput}</div>`
    if (Array.isArray(strings) && strings.raw !== undefined) {
        const result = new Array(strings.length * 2 - 1);
        for (let i = 0, j = 0; i < strings.length; i++, j += 2) {
            result[j] = strings[i];
            if (i < values.length) {
                result[j + 1] = values[i] != null ? escapeHTML(values[i]) : "";
            }
        }
        return result.join("");
    }

    // Normal usage
    const div = document.createElement("div");
    div.textContent = strings == null ? "" : strings;
    return div.innerHTML;
}

/**
 * Converts an HTML string into one or more DOM elements,
 * replacing <template> placeholders with elements/arrays/functions.
 *
 * If a given placeholder selector cannot be found, it will try searching for that as an ID,
 * and if still nothing is found, then it will continue with a warning
 *
 * @param {string} html - The HTML string with optional <template id="...">
 * @param {Record<string, HTMLElement|HTMLElement[]|function(): HTMLElement|function(): HTMLElement[]>} [map] - Placeholder replacements
 * @returns {HTMLElement|HTMLElement[]|null} - Element(s) created from HTML
 */
function stringToElement(html, map = {}) {
    const initialTemplate = document.createElement("template");
    initialTemplate.innerHTML = html.trim();
    const frag = initialTemplate.content.cloneNode(true);

    // Replace templates
    for (const [selector, replacement] of Object.entries(map)) {
        let placeholderNode = frag.querySelector(selector);
        if (placeholderNode === null) {
            // Try to resolve it by ID instead
            placeholderNode = frag.querySelector("#" + selector);
            if (placeholderNode === null) {
                console.warn("Unable to find template element my selector: ", selector)
                continue;
            }
        }
        let replacementNodes = [];

        if (typeof replacement === "function") {
            const result = replacement();
            replacementNodes = Array.isArray(result) ? result : [result];
        } else if (Array.isArray(replacement)) {
            replacementNodes = replacement;
        } else if (replacement instanceof HTMLElement) {
            replacementNodes = [replacement];
        } else {
            throw new Error(`Invalid replacement for selector ${selector}`);
        }

        for (const replacement of replacementNodes) {
            placeholderNode.parentNode.insertBefore(replacement, placeholderNode);
        }

        placeholderNode.remove();
    }

    // Return multiple roots as array, single root as element, null as fragment
    const children = Array.from(frag.childNodes);
    if (children.length === 0) {
        console.warn("Could not convert string to element", html);
        return null;
    }
    if (children.length === 1) return children[0];
    return children;
}