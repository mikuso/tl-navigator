const template = document.createElement("template");
import { data } from "../data_model";

template.innerHTML = `
<link rel="stylesheet" href="main.css">
<a id="link" target="_blank">Copy link/open in a new tab</a>`;

export class TLNavigatorPathLink extends HTMLElement {
    static observedAttributes = [ "data-path" ];
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(template.content.cloneNode(true));
        this.linkElement = shadowRoot.getElementById("link");
        this.linkElement.classList.add("hidden");

        this.addEventListener(
            "update-path",
            function(event) {
                this.linkElement.classList.remove("hidden");
                let url = new URL("path.html", window.location.href);
                url.searchParams.append("path", JSON.stringify(event.detail.path));
                let mapUrl = data.getServerInfo(data.getCurrentServer()).url;
                if (mapUrl instanceof URL) {
                    mapUrl = mapUrl.toString();
                }
                if (mapUrl) {
                    url.searchParams.append("map-link", mapUrl);
                }
                this.linkElement.setAttribute("href", url.toString());
            }
        );

        this.addEventListener(
            "update-error",
            function(event) {
                this.linkElement.classList.add("hidden");
            }
        );

        data.addErrorSubscriber(this);
        data.addPathSubscriber(this);
    }
}

customElements.define("tl-navigator-path-link", TLNavigatorPathLink);
