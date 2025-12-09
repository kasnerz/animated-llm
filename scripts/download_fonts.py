import re
import os
import urllib.request

# The CSS content fetched from Google Fonts
css_content = """
/* cyrillic-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3GUBGEe.woff2) format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3iUBGEe.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3KUBGEe.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3GUBGEe.woff2) format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3iUBGEe.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3KUBGEe.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 600;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3GUBGEe.woff2) format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 600;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3iUBGEe.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 600;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3KUBGEe.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 600;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 700;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3GUBGEe.woff2) format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 700;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3iUBGEe.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 700;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3KUBGEe.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 700;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/roboto/v50/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* latin */
@font-face {
  font-family: 'Consolas';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/l/font?kit=X7nm4bA-A_-9jbjWaza9xMk&skey=3d1eb1871fcc58a1&v=v20) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* latin */
@font-face {
  font-family: 'Consolas';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/l/font?kit=X7nh4bA-A_-9jbjWaz4G4dzmOg0&skey=ed6f0b47e729851b&v=v20) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
"""

output_dir = "/data/Projekty/web/animated-llm/src/assets/fonts"
output_css_path = os.path.join(output_dir, "fonts.css")

# Regex to find font blocks
# We look for /* subset */ followed by @font-face block
pattern = re.compile(r'/\*\s*(.*?)\s*\*/\s*@font-face\s*\{(.*?)\}', re.DOTALL)

new_css_content = ""

matches = pattern.findall(css_content)

for subset, block in matches:
    # Extract details
    family_match = re.search(r"font-family:\s*'(.*?)'", block)
    weight_match = re.search(r"font-weight:\s*(\d+)", block)
    url_match = re.search(r"src:\s*url\((.*?)\)", block)
    
    if family_match and weight_match and url_match:
        family = family_match.group(1)
        weight = weight_match.group(1)
        url = url_match.group(1)
        
        # Create filename
        filename = f"{family}-{weight}-{subset}.woff2".replace(" ", "")
        filepath = os.path.join(output_dir, filename)
        
        print(f"Downloading {filename} from {url}...")
        try:
            urllib.request.urlretrieve(url, filepath)
            
            # Replace URL in block
            new_block = block.replace(url, f"./{filename}")
            new_css_content += f"/* {subset} */\n@font-face {{{new_block}}}\n"
        except Exception as e:
            print(f"Failed to download {filename}: {e}")
            # Keep original if failed? Or skip? Let's keep original for now but it won't help user.
            # Actually if it fails, we probably shouldn't write the broken CSS.
            pass

with open(output_css_path, "w") as f:
    f.write(new_css_content)

print(f"Generated {output_css_path}")
