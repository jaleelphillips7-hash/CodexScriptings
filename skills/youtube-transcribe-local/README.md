# youtube-transcribe-local

Local YouTube/file transcription skill for OpenClaw using:
- `yt-dlp` (download audio from URL)
- `ffmpeg` (convert to 16kHz mono WAV)
- `whisper.cpp` / `whisper-cli` (local transcription)

No cloud transcription API keys are required.

## Install

```bash
cd /workspace/CodexScriptings/skills/youtube-transcribe-local
sudo bash scripts/install.sh
```

## CLI Usage

### 1) Transcribe YouTube URL

```bash
bash scripts/transcribe_youtube.sh "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

Optional flags:

```bash
bash scripts/transcribe_youtube.sh "https://www.youtube.com/watch?v=VIDEO_ID&list=SOMELIST" \
  --model "$(pwd)/models/ggml-small.bin" \
  --lang auto \
  --outdir "$(pwd)/outputs"
```

### 2) Transcribe local file

```bash
bash scripts/transcribe_file.sh "/path/to/audio_or_video.mp4"
```

Optional flags:

```bash
bash scripts/transcribe_file.sh "/path/to/audio.wav" \
  --model "$(pwd)/models/ggml-small.bin" \
  --lang en \
  --outdir "$(pwd)/outputs"
```

## Output layout

Each run writes to:

```text
outputs/<safe_title_or_hash>/
  ├── transcript.txt
  ├── subtitles.srt
  ├── metadata.json
  ├── excerpt.txt
  └── audio_16k_mono.wav
```

## Metadata JSON fields

- `url` (YouTube runs)
- `input_file` (file runs)
- `title`
- `duration_seconds`
- `model`
- `language`
- `outputs.transcript_txt`
- `outputs.subtitles_srt`
- `stats.word_count`

## Troubleshooting

- `Missing binary ...`: run `sudo bash scripts/install.sh`.
- `Model file not found`: ensure `models/ggml-small.bin` exists or pass `--model`.
- URL with `&`/`?` fails: wrap URL in quotes.
- Slow transcription: use smaller model (`small`) or faster CPU/GPU settings for whisper.cpp.
- Permission denied in Docker: run as a user with write access to the skill folder.
