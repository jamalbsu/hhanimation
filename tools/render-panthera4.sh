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
E16=panthera-16-sunrise-friends; E17=panthera-17-splash-day; E18=panthera-18-blossom-valley; E19=panthera-19-snow-day; E20=panthera-20-firefly-night
N16=PANTHERA-ep16-Sunrise-Friends-happy-run; N17=PANTHERA-ep17-Splash-Day-river-and-rainbow; N18=PANTHERA-ep18-Blossom-Valley-spring-run
N19=PANTHERA-ep19-Snow-Day-winter-fun; N20=PANTHERA-ep20-Firefly-Night-moonlight-run
S $E16 81 $N16 & L $E16 82 $N16 & S $E17 83 $N17 & wait
L $E17 84 $N17 & S $E18 85 $N18 & L $E18 86 $N18 & wait
S $E19 87 $N19 & L $E19 88 $N19 & S $E20 89 $N20 & wait
L $E20 90 $N20 & wait
echo ALL FINISHED
