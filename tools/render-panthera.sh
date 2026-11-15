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
E1=panthera-1-the-hunt; E2=panthera-2-white-silence; E3=panthera-3-tusk-and-fury; E4=panthera-4-stampede; E5=panthera-5-rhino-rage
N1=PANTHERA-ep1-The-Hunt-gazelle-chase; N2=PANTHERA-ep2-White-Silence-deer-chase-in-snow
N3=PANTHERA-ep3-Tusk-and-Fury-boar-chase-then-escape; N4=PANTHERA-ep4-Stampede-escape-from-buffalo; N5=PANTHERA-ep5-Rhino-Rage-escape-from-rhino
S $E1 81 $N1 & L $E1 82 $N1 & S $E2 83 $N2 & wait
L $E2 84 $N2 & S $E3 85 $N3 & L $E3 86 $N3 & wait
S $E4 87 $N4 & L $E4 88 $N4 & S $E5 89 $N5 & wait
L $E5 90 $N5 & wait
echo ALL FINISHED
