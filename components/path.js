const template = document.createElement("template");
import { data } from "../data_model";

template.innerHTML = `
<link rel="stylesheet" href="main.css">
<div id="output"></div>`;

/**
 * @param {[number, number]} point
 * @returns
 */
function makeLink(point, mapLink) {
    const urlStr = mapLink;
    const url = urlStr ? new URL(urlStr) : null;
    if (!url) {
        return `<span>${point[0]},${point[1]}</span>`;
    }
    url.searchParams.append("x", String(point[0]));
    url.searchParams.append("y", String(point[1]));
    url.searchParams.append("zoom", "11");
    return `<a
        href="${url}"
        target="_blank">${point[0]},${point[1]}</a>`;
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
        const output = [];
        output.push("<ul>");
        output.push(`<li>Start at ${makeLink(path[0], mapLink)}</li>`);
        for (let i = 1; i < path.length - 1; i += 2) {
            output.push(`<li>Teleport from ${makeLink(path[i], mapLink)} to ${makeLink(path[i + 1], mapLink)}</li>`);
        }
        output.push(`<li>Go to ${makeLink(path[path.length - 1], mapLink)}</li>`);
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
