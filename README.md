# Vintage Story translocator navigator

A very barebones tool to aid searching path through translocators between remote locations on Vintage Story map.
This repo contains `translocators.geojson` file from the official public server's map and links will also send you there.

To run this, you can serve files from this repo and open the page in browser. For example, run `python3 -m http.server 8080` and open http://localhost:8080

## License
MIT license

## 3rd-party
* [JSNetworkX](https://github.com/fkling/JSNetworkX) (BSD license) for path finding
* translocators.json file from the official public server's map, repo's license doesn't apply to it