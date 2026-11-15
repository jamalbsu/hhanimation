#!/bin/sh
# Renders the five adventure pages to vertical Shorts: frames + audio, then an MP4 per story.
PROJ="C:/Users/Jamal/HHanimation"
SP="C:/Users/Jamal/HHanimation/tools"
FF="C:/Users/Jamal/AppData/Local/Temp/pr-ffmpeg/ffmpeg.exe"
mkdir -p "$SP/short"
one() {   # $1 = page name, $2 = port slot
  n="$1"
  PAGE="$PROJ/$n.html" node "$SP/capf.js" video "$2" "$SP/short/$n.mp4" > "$SP/short/$n.log" 2>&1 || { echo "FAILED frames $n"; return; }
  "$FF" -v error -y -framerate 30 -i "$SP/short/$n-frames/f%05d.jpg" -i "$SP/short/$n.wav" \
    -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset medium -crf 18 -color_range tv \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -movflags +faststart -shortest \
    "$PROJ/videos/$n-short.mp4" && echo "done $n" || echo "FAILED encode $n"
}
one panther-adventure-1-golden-plains 61 &
one panther-adventure-2-snow-pass 62 &
one panther-adventure-3-desert-race 63 &
wait
one panther-adventure-4-tiger-land 64 &
one panther-adventure-5-blossom-lake 65 &
wait
echo ALL FINISHED
