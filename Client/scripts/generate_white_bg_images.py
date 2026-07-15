import os
from PIL import Image

assets_dir = r"e:\Saas\Client\src\assets"

images_to_process = {
    "autoniv-full-logo.webp": "autoniv-full-logo-white-bg.webp",
    "autoniv-symbol-logo.webp": "autoniv-symbol-logo-white-bg.webp",
    "autoniv-text-logo.webp": "autoniv-text-logo-white-bg.webp"
}

for src_name, dest_name in images_to_process.items():
    src_path = os.path.join(assets_dir, src_name)
    dest_path = os.path.join(assets_dir, dest_name)
    
    if os.path.exists(src_path):
        try:
            with Image.open(src_path) as img:
                width, height = img.size
                # Create a solid white background
                white_bg = Image.new("RGBA", (width, height), (255, 255, 255, 255))
                
                # Paste the transparent image onto the white background using itself as the mask
                if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                    white_bg.paste(img, (0, 0), img)
                else:
                    white_bg.paste(img, (0, 0))
                
                # Convert back to RGB/RGBA and save as WebP
                final_img = white_bg.convert("RGB")
                final_img.save(dest_path, "WEBP", quality=95)
                print(f"Generated white bg image: {dest_name}")
        except Exception as e:
            print(f"Error processing {src_name}: {e}")
    else:
        print(f"Source not found: {src_path}")
