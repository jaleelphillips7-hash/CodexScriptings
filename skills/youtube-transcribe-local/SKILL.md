---
name: youtube-transcribe-local
description: Transcribe YouTube URLs or local media files fully offline using yt-dlp + ffmpeg + whisper.cpp to produce timestamped TXT, SRT subtitles, and metadata JSON with no cloud API keys.
requires.bins: ["yt-dlp","ffmpeg","whisper-cli"]
command-dispatch: tool
command-tool: system-command
---

# YouTube Transcribe Local

Use this skill when the user wants local transcription (no cloud APIs) from a YouTube URL or local media file.

## Tooling assumptions

Use the existing system command execution tool configured in this OpenClaw install.

## Base directory

Assume `{baseDir}` points to this skill folder (`.../skills/youtube-transcribe-local`).

## Slash command

- `/yt_transcribe <url-or-path>`

## Workflow

1. **Validate input**
   - Require one argument.
   - If input starts with `http://` or `https://`, treat as URL.
   - Otherwise treat as local path and verify file exists/readable.

2. **Validate dependencies**
   - Ensure `yt-dlp`, `ffmpeg`, and `whisper-cli` are available.
   - If any are missing, run:
     - `bash {baseDir}/scripts/install.sh`

3. **Run transcription pipeline**
   - For URL input:
     - `bash {baseDir}/scripts/transcribe_youtube.sh "<url>"`
   - For local file input:
     - `bash {baseDir}/scripts/transcribe_file.sh "<path>"`
   - Optional flags for either script:
     - `--model <path>` (defaults to `{baseDir}/models/ggml-small.bin`)
     - `--lang <code|auto>` (defaults to `auto`)
     - `--outdir <dir>` (defaults to `{baseDir}/outputs`)

4. **Return concise response**
   - Return:
     - transcript path (`.txt`)
     - subtitle path (`.srt`)
     - metadata path (`.json`)
     - word count and duration (seconds)
     - first 20 lines excerpt from transcript

## Expected outputs

Outputs are written under:
- `{baseDir}/outputs/<safe_title_or_hash>/`

Each run produces:
- `transcript.txt`
- `subtitles.srt`
- `metadata.json`

## Notes

- No API keys required.
- Always quote URL/path arguments to preserve `&` and `?`.
- Scripts emit clear fatal errors and non-zero exits on failure.
