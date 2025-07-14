const template = document.createElement("template");
import { data } from "../data_model";

template.innerHTML = `
<link rel="stylesheet" href="main.css">
<div id="output"></div>`;


function waypointBtn(point, idx, total) {
    const clipboardEnabled = !!window.navigator.clipboard;
    return `<button ${clipboardEnabled ? '' : 'disabled'}
        onclick="copyWaypoint(${point[0]}, ${point[1]}, ${idx}, ${total})"
        >Copy /waypoint</button>`;
}


/**
 * @param {[number, number]} point
 * @returns
 */
function makeLink(point, mapLink, idx, total) {
    const urlStr = mapLink;
    const url = urlStr ? new URL(urlStr) : null;
    const visibleCoords = `${point[0]},${-point[1]}`;
    if (!url) {
        return `<span>${visibleCoords}</span>`;
    }
    url.searchParams.append("x", String(point[0]));
    url.searchParams.append("y", String(point[1]));
    url.searchParams.append("zoom", "11");
    return `<a
        href="${url}"
        target="_blank">${visibleCoords}</a> ${waypointBtn(point, idx, total)}`;
}


export class TlNavigatorPath extends HTMLElement {
    static observedAttributes = [ "data-path" ];
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(template.content.cloneNode(true));
        this.outputDiv = this.shadowRoot.getElementById("output");

        this.addEventListener(
            "update-path",
            function(event) {
                const path = event.detail.path;
                const mapLink = event.detail.url;

                this.#updatePath(path, mapLink);
            }
        );

        this.addEventListener(
            "update-error",
            function(event) {
                const error = event.detail.error;

                this.#displayError(error);
            }
        );

        data.addErrorSubscriber(this);
        data.addPathSubscriber(this);
    }

    #updatePath(path, mapLink) {
        const total = path.length;
        const output = [];
        output.push("<ul>");
        output.push(`<li>Start at ${makeLink(path[0], mapLink, 1, total)}</li>`);
        for (let i = 1; i < path.length - 1; i += 2) {
            output.push(`<li>Teleport from ${makeLink(path[i], mapLink, i + 1, total)} to ${makeLink(path[i + 1], mapLink, i + 2, total)}</li>`);
        }
        output.push(`<li>Go to ${makeLink(path[path.length - 1], mapLink, path.length, total)}</li>`);
        output.push("</ul>");
        const text = output.join("");
        this.outputDiv.innerHTML = text;
    }

    #displayError(e) {
        this.outputDiv.innerHTML = e;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            case "data-path":
                const path = JSON.parse(newValue);
                this.#updatePath(path);
                break;
            default:
                break;
        }
    }

}

customElements.define("tl-navigator-path", TlNavigatorPath);
