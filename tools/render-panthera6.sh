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
E26=panthera-26-the-falling-star; E27=panthera-27-the-river-toll; E28=panthera-28-canyon-of-echoes; E29=panthera-29-the-storm-giraffes; E30=panthera-30-the-mountain-of-stars
N26=PANTHERA-ep26-Star-Run-1-The-Falling-Star; N27=PANTHERA-ep27-Star-Run-2-The-River-Toll; N28=PANTHERA-ep28-Star-Run-3-Canyon-of-Echoes
N29=PANTHERA-ep29-Star-Run-4-The-Storm-Giraffes; N30=PANTHERA-ep30-Star-Run-5-The-Mountain-of-Stars
S $E26 81 $N26 & L $E26 82 $N26 & S $E27 83 $N27 & wait
L $E27 84 $N27 & S $E28 85 $N28 & L $E28 86 $N28 & wait
S $E29 87 $N29 & L $E29 88 $N29 & S $E30 89 $N30 & wait
L $E30 90 $N30 & wait
echo ALL FINISHED
