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
E11=panthera-11-wildfire; E12=panthera-12-flash-flood; E13=panthera-13-crocodile-crossing; E14=panthera-14-rockslide; E15=panthera-15-lightning-stampede
N11=PANTHERA-ep11-Wildfire-escape-the-flames; N12=PANTHERA-ep12-Flash-Flood-outrun-the-wave; N13=PANTHERA-ep13-Crocodile-Crossing-river-ambush
N14=PANTHERA-ep14-Rockslide-falling-boulders; N15=PANTHERA-ep15-Lightning-Stampede-night-storm
S $E11 81 $N11 & L $E11 82 $N11 & S $E12 83 $N12 & wait
L $E12 84 $N12 & S $E13 85 $N13 & L $E13 86 $N13 & wait
S $E14 87 $N14 & L $E14 88 $N14 & S $E15 89 $N15 & wait
L $E15 90 $N15 & wait
echo ALL FINISHED
