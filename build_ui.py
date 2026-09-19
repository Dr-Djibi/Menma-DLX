import os
import re

design_dir = "/home/menma/downloader-api/design_assets/stitch_omnidl_universal_media_downloader"

def read_html(folder):
    path = os.path.join(design_dir, folder, "code.html")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

t_html = read_html("omnidl_t_l_chargeur_pur")
h_html = read_html("omnidl_historique_pur")
f_html = read_html("omnidl_fichiers_pur")
p_html = read_html("omnidl_param_tres_pur")

def extract_main(html):
    match = re.search(r'<main[^>]*>(.*?)</main>', html, re.DOTALL)
    return match.group(0) if match else ""

t_main = extract_main(t_html)
h_main = extract_main(h_html).replace('<main ', '<main id="page-historique" class="hidden flex-1 w-full bg-surface pt-16 pb-24 px-margin" ')
f_main = extract_main(f_html).replace('<main ', '<main id="page-fichiers" class="hidden flex-1 w-full bg-surface pt-16 pb-24 px-margin" ')
p_main = extract_main(p_html).replace('<main ', '<main id="page-parametres" class="hidden flex-1 w-full bg-surface pt-16 pb-24 px-margin" ')

t_main = t_main.replace('<main class="flex-1', '<main id="page-telechargeur" class="flex-1')

# Replace the main of t_html with all mains
combined_mains = t_main + "\n" + h_main + "\n" + f_main + "\n" + p_main
final_html = re.sub(r'<main[^>]*>.*?</main>', combined_mains, t_html, flags=re.DOTALL)

with open("/home/menma/downloader-api/public/index.html", "w", encoding="utf-8") as f:
    f.write(final_html)

