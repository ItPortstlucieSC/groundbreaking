#!/bin/bash
# Uso: bash flare.sh <in.mp4> <out.mp4> <t_inicio> [dur=2.4] [intensidad=0.85]
set -e
cd /private/tmp/claude-501/-Users-marianonoceti-Desktop-Antigravity-PSLSC-Website-portstlucie/33259494-3588-484c-b820-797b3beb50cc/scratchpad/gen
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
IN="$1"; OUT="$2"; T0="$3"; D="${4:-2.4}"; K="${5:-0.85}"
HALF=$(python3 -c "print($D/2)")
"$FF" -hide_banner -loglevel error -y -i "$IN" -loop 1 -t "$D" -i flare.png -filter_complex \
 "[1:v]format=rgba,colorchannelmixer=aa=$K,fade=t=in:st=0:d=$HALF:alpha=1,fade=t=out:st=$HALF:d=$HALF:alpha=1,setpts=PTS+$T0/TB[fl];[0:v][fl]overlay=eof_action=pass:format=auto,format=yuv420p[out]" \
 -map '[out]' -r 24 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -an "$OUT"
echo "flare ok -> $OUT"
