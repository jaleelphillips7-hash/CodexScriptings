#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage: $0 <url> [--model <path>] [--lang <code|auto>] [--outdir <dir>]
USAGE
}

log() { printf '[yt-transcribe] %s\n' "$*"; }
fail() { printf '[yt-transcribe][error] %s\n' "$*" >&2; exit 1; }

require_bin() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing binary '$1'. Run install: bash $(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/scripts/install.sh"
}

safe_name() {
  local raw="$1"
  local cleaned
  cleaned="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/_/g' | sed 's/__*/_/g' | sed 's/^_//;s/_$//')"
  if [[ -z "$cleaned" ]]; then cleaned="item"; fi
  printf '%s' "$cleaned"
}

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODEL_PATH="${BASE_DIR}/models/ggml-small.bin"
LANG="auto"
OUTDIR="${BASE_DIR}/outputs"

URL="${1:-}"
[[ -n "$URL" ]] || { usage; fail "Missing URL."; }
shift || true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model)
      MODEL_PATH="${2:-}"; shift 2;;
    --lang)
      LANG="${2:-}"; shift 2;;
    --outdir)
      OUTDIR="${2:-}"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      fail "Unknown argument: $1";;
  esac
done

require_bin yt-dlp
require_bin ffmpeg
require_bin ffprobe
require_bin whisper-cli
[[ -f "$MODEL_PATH" ]] || fail "Model file not found: $MODEL_PATH"

mkdir -p "$OUTDIR"

meta_json_tmp="$(mktemp)"
trap 'rm -f "$meta_json_tmp"' EXIT
if ! yt-dlp --no-playlist --dump-single-json "$URL" > "$meta_json_tmp" 2>/dev/null; then
  log "Could not fetch metadata ahead of download; continuing."
  printf '{}' > "$meta_json_tmp"
fi

TITLE="$(python3 - "$meta_json_tmp" <<'PY'
import json,sys
p=sys.argv[1]
try:
    d=json.load(open(p))
except Exception:
    d={}
print((d.get('title') or '').strip())
PY
)"
REMOTE_DURATION="$(python3 - "$meta_json_tmp" <<'PY'
import json,sys
p=sys.argv[1]
try:
    d=json.load(open(p))
except Exception:
    d={}
val=d.get('duration')
print('' if val is None else str(val))
PY
)"

if [[ -z "$TITLE" ]]; then
  TITLE="youtube_audio"
fi

SAFE_TITLE="$(safe_name "$TITLE")"
HASH="$(printf '%s' "$URL" | sha256sum | awk '{print substr($1,1,12)}')"
RUN_DIR="${OUTDIR}/${SAFE_TITLE}_${HASH}"
mkdir -p "$RUN_DIR"

AUDIO_PATH="${RUN_DIR}/source_audio.%(ext)s"
WAV_PATH="${RUN_DIR}/audio_16k_mono.wav"
TXT_PATH="${RUN_DIR}/transcript.txt"
SRT_PATH="${RUN_DIR}/subtitles.srt"
JSON_PATH="${RUN_DIR}/metadata.json"
EXCERPT_PATH="${RUN_DIR}/excerpt.txt"

log "Downloading audio with yt-dlp..."
yt-dlp --no-playlist -f 'bestaudio[ext=m4a]/bestaudio/best' -o "$AUDIO_PATH" "$URL"
DOWNLOADED_AUDIO="$(find "$RUN_DIR" -maxdepth 1 -type f \( -name 'source_audio.*' -o -name 'source_audio' \) | head -n1)"
[[ -n "$DOWNLOADED_AUDIO" ]] || fail "Audio download failed."

log "Converting audio to 16kHz mono WAV..."
ffmpeg -y -i "$DOWNLOADED_AUDIO" -ar 16000 -ac 1 "$WAV_PATH" >/dev/null 2>&1

log "Transcribing with whisper-cli..."
WHISPER_ARGS=( -m "$MODEL_PATH" -f "$WAV_PATH" -of "${RUN_DIR}/output" -osrt -otxt )
if [[ "$LANG" != "auto" ]]; then
  WHISPER_ARGS+=( -l "$LANG" )
fi
whisper-cli "${WHISPER_ARGS[@]}" >/dev/null

[[ -f "${RUN_DIR}/output.txt" ]] || fail "whisper-cli did not generate TXT output."
[[ -f "${RUN_DIR}/output.srt" ]] || fail "whisper-cli did not generate SRT output."
mv -f "${RUN_DIR}/output.txt" "$TXT_PATH"
mv -f "${RUN_DIR}/output.srt" "$SRT_PATH"

ACTUAL_DURATION="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$WAV_PATH" | awk '{printf("%.2f", $1)}')"
WORD_COUNT="$(wc -w < "$TXT_PATH" | tr -d ' ')"
head -n 20 "$TXT_PATH" > "$EXCERPT_PATH"

python3 - "$JSON_PATH" "$URL" "$TITLE" "$REMOTE_DURATION" "$ACTUAL_DURATION" "$MODEL_PATH" "$TXT_PATH" "$SRT_PATH" "$WAV_PATH" "$WORD_COUNT" "$LANG" <<'PY'
import json,sys
(
  out,url,title,remote_duration,actual_duration,model,txt,srt,wav,words,lang
)=sys.argv[1:]
rd = float(remote_duration) if remote_duration else None
obj={
  "source_type":"youtube",
  "url":url,
  "title":title or None,
  "duration_seconds": rd if rd is not None else float(actual_duration),
  "model":model,
  "language": lang,
  "outputs": {
    "transcript_txt":txt,
    "subtitles_srt":srt,
    "wav_16khz_mono":wav,
  },
  "stats": {
    "word_count": int(words),
    "duration_seconds_actual": float(actual_duration)
  }
}
with open(out,'w',encoding='utf-8') as f:
  json.dump(obj,f,indent=2,ensure_ascii=False)
PY

log "Done."
printf 'TRANSCRIPT=%s\n' "$TXT_PATH"
printf 'SRT=%s\n' "$SRT_PATH"
printf 'METADATA=%s\n' "$JSON_PATH"
printf 'WORDS=%s\n' "$WORD_COUNT"
printf 'DURATION_SECONDS=%s\n' "$ACTUAL_DURATION"
printf 'EXCERPT_BEGIN\n'
cat "$EXCERPT_PATH"
printf 'EXCERPT_END\n'
