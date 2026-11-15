#!/bin/sh
# Renders the five PANTHERA episodes twice: vertical Short (1080x1920) and landscape long (1920x1080).
PROJ="C:/Users/Jamal/HHanimation"
SP="C:/Users/Jamal/HHanimation/tools"
FF="C:/Users/Jamal/AppData/Local/Temp/pr-ffmpeg/ffmpeg.exe"
mkdir -p "$SP/frames" "$PROJ/videos"
one() {   # $1 page, $2 slot, $3 w, $4 h, $5 output name
  k="$5"
  PAGE="$PROJ/$1.html" node "$SP/capf.js" video "$2" "$SP/frames/$k.mp4" --w=$3 --h=$4 > "$SP/frames/$k.log" 2>&1 || { echo "FAILED frames $k"; return; }
  "$FF" -v error -y -framerate 30 -i "$SP/frames/$k-frames/f%05d.jpg" -i "$SP/frames/$k.wav" \
    -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset medium -crf 18 -color_range tv \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -movflags +faststart -shortest \
    "$PROJ/videos/$k.mp4" && { echo "done $k"; rm -rf "$SP/frames/$k-frames"; } || echo "FAILED encode $k"
}
S() { one "$1" "$2" 1080 1920 "$3-SHORT-vertical-9x16"; }
L() { one "$1" "$2" 1920 1080 "$3-LONG-landscape-16x9"; }
E21=panthera-21-waterfall-splash; E22=panthera-22-crocodile-river-rescue; E23=panthera-23-avalanche-ice-mountain; E24=panthera-24-head-on-elephant-herd; E25=panthera-25-meet-the-panthers-pack
N21=PANTHERA-ep21-Waterfall-Splash-white-tiger-joins; N22=PANTHERA-ep22-Crocodile-River-Rescue-snow-leopard; N23=PANTHERA-ep23-Avalanche-2-Ice-Mountain
N24=PANTHERA-ep24-Head-On-Elephant-Herd; N25=PANTHERA-ep25-Meet-the-Panthers-Pack-cast
S $E21 81 $N21 & L $E21 82 $N21 & S $E22 83 $N22 & wait
L $E22 84 $N22 & S $E23 85 $N23 & L $E23 86 $N23 & wait
S $E24 87 $N24 & L $E24 88 $N24 & S $E25 89 $N25 & wait
L $E25 90 $N25 & wait
echo ALL FINISHED
