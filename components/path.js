const template = document.createElement("template");
import { data } from "../data_model";

template.innerHTML = `
<style>
@media (prefers-color-scheme: dark) {
    :root {
        background-color: #0F0F0F;
        color: white;
    }
    a {
        color: aqua;
    }
    a:visited {
        color: chocolate;
    }
    .footer {
        background-color: #0F0F0F;
    }
}
@media (prefers-color-scheme: light) {
    :root {
        background-color: white;
        color: black;
    }
    .footer {
        background-color: white;
    }
}
</style>
<div id="output"></div>`;

/**
 * @param {[number, number]} point
 * @returns
 */
function makeLink(point) {
    const urlStr = data.getServerInfo(data.getCurrentServer())?.url;
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

                this.#updatePath(path);
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

    #updatePath(path) {
        const output = [];
        output.push("<ul>");
        output.push(`<li>Start at ${makeLink(path[0])}</li>`);
        for (let i = 1; i < path.length - 1; i += 2) {
            output.push(`<li>Teleport from ${makeLink(path[i])} to ${makeLink(path[i + 1])}</li>`);
        }
        output.push(`<li>Go to ${makeLink(path[path.length - 1])}</li>`);
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
