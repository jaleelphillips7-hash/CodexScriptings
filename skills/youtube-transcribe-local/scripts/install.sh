#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODELS_DIR="${BASE_DIR}/models"
THIRD_PARTY_DIR="${BASE_DIR}/third_party"
WHISPER_DIR="${THIRD_PARTY_DIR}/whisper.cpp"
DEFAULT_MODEL="${MODELS_DIR}/ggml-small.bin"

log() { printf '[install] %s\n' "$*"; }
fail() { printf '[install][error] %s\n' "$*" >&2; exit 1; }

if [[ "${EUID}" -ne 0 ]]; then
  fail "Run as root (or with sudo) because apt and /usr/local/bin writes are required."
fi

export DEBIAN_FRONTEND=noninteractive

log "Installing Ubuntu dependencies..."
apt-get update
apt-get install -y ffmpeg git build-essential python3 python3-pip ca-certificates curl

log "Installing yt-dlp via pip..."
python3 -m pip install -U --break-system-packages yt-dlp

mkdir -p "${THIRD_PARTY_DIR}" "${MODELS_DIR}"

if [[ ! -d "${WHISPER_DIR}/.git" ]]; then
  log "Cloning whisper.cpp..."
  git clone https://github.com/ggml-org/whisper.cpp "${WHISPER_DIR}"
else
  log "Updating whisper.cpp..."
  git -C "${WHISPER_DIR}" pull --ff-only || true
fi

log "Building whisper.cpp..."
cmake -S "${WHISPER_DIR}" -B "${WHISPER_DIR}/build"
cmake --build "${WHISPER_DIR}/build" -j"$(nproc)"

WHISPER_BIN=""
if [[ -x "${WHISPER_DIR}/build/bin/whisper-cli" ]]; then
  WHISPER_BIN="${WHISPER_DIR}/build/bin/whisper-cli"
elif [[ -x "${WHISPER_DIR}/build/whisper-cli" ]]; then
  WHISPER_BIN="${WHISPER_DIR}/build/whisper-cli"
else
  fail "whisper-cli binary not found after build."
fi

log "Linking whisper-cli to /usr/local/bin..."
ln -sf "${WHISPER_BIN}" /usr/local/bin/whisper-cli

if [[ ! -f "${DEFAULT_MODEL}" ]]; then
  log "Downloading default model (small)..."
  MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
  curl -L --fail --output "${DEFAULT_MODEL}" "${MODEL_URL}"
else
  log "Default model already exists: ${DEFAULT_MODEL}"
fi

command -v yt-dlp >/dev/null 2>&1 || fail "yt-dlp not found on PATH after install."
command -v ffmpeg >/dev/null 2>&1 || fail "ffmpeg not found on PATH after install."
command -v whisper-cli >/dev/null 2>&1 || fail "whisper-cli not found on PATH after install."

log "Install complete."
log "Model: ${DEFAULT_MODEL}"
