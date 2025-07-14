# Vintage Story Translocator Navigator

Or just tl-navigator, a very barebones tool to aid searching path through translocators between remote locations on Vintage Story map.
This repo contains `translocators.geojson` file from the official public server's map and links will also send you there,
but you can configure it to use a custom geojson file and map website. If the TOPS's geojson is outdated, you can also just configure server
and provide a new geojson file. All the information is stored in browser's local storage.

App is [hosted on Github Pages](https://mikuso.github.io/tl-navigator) where you can use it.

Alternatively, you can clone/download repo and serve files from directory.
For example, to serve with Python's built-in server, run `python3 -m http.server 8080` inside project's directory and open http://localhost:8080

## Usage
* Enter origin location coordinates and target location coordinates.
    Note that z coordinate is same as in online map and is <b>reversed</b> compared to the game. In-game 1000,2000 becomes 1000,-2000 here.
* Tweak algorithm parameters if you need:
    * Max walk distance is roughly "the longest path between translocators you're willing to walk", but in fact it's more of a "closest path points scan distance".
        The longer this distance is, the slower the algorithm is, but also the better result you can possibly get in some cases.
        Usually on TOPS you don't need it to be more than 4000, unless you go very far where there aren't a lot of translocators around.
    * Translocator link weight of `x` makes it so teleportation is treated equally as running `x` blocks.
        This can make algorithm prefer longer paths with less translocators.

### Custom server configuration
Repo contains The Official Public Server's `translocators.geojson` file, but if it (inevitably) gets outdated,
or if you just play on another server, you can add server information:
* Server name: mandatory, used just for your convenience
* Server's web map address: not mandatory, but if you provide it, results will have links to locations on map
* Server's `translocators.geojson` file: mandatory, contains all the translocators information.
    If you don't know where to download this file, enter web map address, and the app will give you a link.

## License
MIT license

Forked from https://github.com/herrscher-of-sleeping/tl-navigator

## 3rd-party
* [JSNetworkX](https://github.com/fkling/JSNetworkX) (BSD license) for path finding
* translocators.json file from the official public server's map, repo's license doesn't apply to it
