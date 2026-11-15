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
E6=panthera-6-crossfire; E7=panthera-7-elephant-charge; E8=panthera-8-sandstorm; E9=panthera-9-avalanche; E10=panthera-10-the-great-migration
N6=PANTHERA-ep6-Crossfire-head-on-buffalo-herd; N7=PANTHERA-ep7-Elephant-Charge-escape-from-elephant
N8=PANTHERA-ep8-Sandstorm-rhinos-and-wildebeest; N9=PANTHERA-ep9-Avalanche-outrun-the-snow; N10=PANTHERA-ep10-The-Great-Migration-season-finale
S $E6 81 $N6 & L $E6 82 $N6 & S $E7 83 $N7 & wait
L $E7 84 $N7 & S $E8 85 $N8 & L $E8 86 $N8 & wait
S $E9 87 $N9 & L $E9 88 $N9 & S $E10 89 $N10 & wait
L $E10 90 $N10 & wait
echo ALL FINISHED
