import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
TILE_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "SAMapExpander", "output", "MapExpander", "tiles", "vicecity")

TILES = 8
TILE_UNITS = 500
GRID_MIN_X = -2000
GRID_MAX_Y = 2000
ORIGIN_X = 5998.5
ORIGIN_Y = 1052.5

MAP_MIN_X = 3998
MAP_MAX_Y = 3053
MAP_SIZE = 4002
MINIMAP_SIZE = 200

TILE_PX = Image.open(os.path.join(TILE_DIR, "radar00.png")).width

stitched = Image.new("RGB", (TILES * TILE_PX, TILES * TILE_PX))
for row in range(TILES):
    for col in range(TILES):
        tile = Image.open(os.path.join(TILE_DIR, "radar%02d.png" % (row * TILES + col))).convert("RGBA")
        stitched.paste(tile, (col * TILE_PX, row * TILE_PX), tile)

water = stitched.getpixel((0, 0))
scale = TILE_PX / TILE_UNITS
left = (MAP_MIN_X - (ORIGIN_X + GRID_MIN_X)) * scale
top = ((ORIGIN_Y + GRID_MAX_Y) - MAP_MAX_Y) * scale

canvas = Image.new("RGB", (stitched.width + 2 * TILE_PX, stitched.height + 2 * TILE_PX), water)
canvas.paste(stitched, (TILE_PX, TILE_PX))
out = canvas.transform((MAP_SIZE, MAP_SIZE), Image.Transform.AFFINE, (scale, 0, left + TILE_PX, 0, scale, top + TILE_PX), Image.Resampling.BICUBIC)

img_dir = os.path.join(HERE, "img")
out.save(os.path.join(img_dir, "vc-map.jpg"), quality=88, optimize=True)
out.resize((MINIMAP_SIZE, MINIMAP_SIZE), Image.Resampling.LANCZOS).save(os.path.join(img_dir, "vc-map-200.jpg"), quality=90)
print("map: world X %d..%d, Y %d..%d" % (MAP_MIN_X, MAP_MIN_X + MAP_SIZE, MAP_MAX_Y - MAP_SIZE, MAP_MAX_Y))
