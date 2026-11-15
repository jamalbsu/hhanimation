#!/bin/sh
# Renders the five PANTHERA teasers twice: vertical Short (1080x1920) and landscape (1920x1080), into videos/teasers.
#   sh teasers/render-teasers.sh            (all five)      sh teasers/render-teasers.sh 2 4     (only teasers 2 and 4)
PROJ="C:/Users/Jamal/HHanimation"
CAP="$PROJ/tools/capf.js"
WORK="$PROJ/teasers/frames"
OUT="$PROJ/videos/teasers"
FF="${FFMPEG:-C:/Users/Jamal/AppData/Local/Temp/pr-ffmpeg/ffmpeg.exe}"
mkdir -p "$WORK" "$OUT"
node "$PROJ/teasers/build.js" > /dev/null || exit 1
one() {   # $1 page, $2 capture slot, $3 w, $4 h, $5 output name
  k="$5"
  PAGE="$PROJ/teasers/$1.html" node "$CAP" video "$2" "$WORK/$k.mp4" --w=$3 --h=$4 > "$WORK/$k.log" 2>&1 || { echo "FAILED frames $k"; return; }
  "$FF" -v error -y -framerate 30 -i "$WORK/$k-frames/f%05d.jpg" -i "$WORK/$k.wav" \
    -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset medium -crf 18 -color_range tv \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -movflags +faststart -shortest \
    "$OUT/$k.mp4" && { echo "done $k"; rm -rf "$WORK/$k-frames" "$WORK/$k.wav"; } || echo "FAILED encode $k"
}
PAGES="teaser-1-neon-prowl teaser-2-ink-and-thunder teaser-3-paper-jungle teaser-4-pixel-moon teaser-5-shadow-of-the-pharaohs teaser-6-stardust teaser-7-after-the-rain teaser-8-chalk-run teaser-9-every-angle"
NAMES="PANTHERA-teaser-1-Neon-Prowl PANTHERA-teaser-2-Ink-and-Thunder PANTHERA-teaser-3-The-Paper-Jungle PANTHERA-teaser-4-8-Bit-Odyssey PANTHERA-teaser-5-Shadow-of-the-Pharaohs PANTHERA-teaser-6-Stardust PANTHERA-teaser-7-After-the-Rain PANTHERA-teaser-8-Chalk-Run PANTHERA-teaser-9-Every-Angle"
ONLY="$*"; i=0
for p in $PAGES; do
  i=$((i+1)); n=$(echo $NAMES | cut -d' ' -f$i)
  if [ -n "$ONLY" ] && ! echo " $ONLY " | grep -q " $i "; then continue; fi
  one "$p" $((50+i*2)) 1080 1920 "$n-SHORT-vertical-9x16" &
  one "$p" $((51+i*2)) 1920 1080 "$n-LONG-landscape-16x9" &
  wait
done
echo ALL FINISHED
