# VC Gangzone Editor

Browser-based gangzone editor for a Vice City map running inside SA-MP, built on the [Prineside GTA SA gangzone editor](https://dev.prineside.com/en/gtasa_gangzone_editor/).

Vice City is placed in San Andreas world space by MapExpander with its local (0,0) at (5998.5, 1052.5), so the editor covers X 3998..8000, Y -949..3053. Exported coordinates are SA world coordinates, ready for `GangZoneCreate`.

## Usage

Open `index.html` in a browser. No server needed.

- Right mouse drag: pan
- Ctrl + wheel / pinch: zoom at pointer
- `+` / `-` / `0`: zoom in / out / reset
- `A`: add zone under pointer, `D`: clone, `Del`: delete, `F`: focus, `V`: minimap
- Arrows: move zone (Shift x10), Ctrl + arrows: resize

Zones autosave to the browser's localStorage.

## Rebuilding the map

```
python build_map.py [path\to\radar\tiles]
```

Stitches the 64 VC radar tiles (`radar00.png`..`radar63.png`, 500 units each, default `..\SAMapExpander\output\MapExpander\tiles\vicecity`) into `img/vc-map.jpg` (1px = 1 unit) and `img/vc-map-200.jpg`. Requires Pillow. Change `ORIGIN_X`/`ORIGIN_Y` and `GZE.mapOrigin` in `gze.js` if the map placement changes.

## Credits

- Original editor: Prineside DevTools (dev.prineside.com)
- Radar tiles: SAMapExpander (VC radar)
