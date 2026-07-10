// Engine Web Audio compartilhado (SYS-04). Funções de conversão/dados são puras e
// seguras para importar no node (sem browser). Todo o estado de áudio do navegador
// fica encapsulado dentro de createEngine() — nunca executa no top-level do módulo.

/**
 * Converte nota MIDI para frequência (afinação A440).
 * @param {number} midi
 * @returns {number} frequência em Hz
 */
export function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * Enquadra um grau (semitons a partir da tônica) em uma nota MIDI concreta (INT-01/D-07).
 * @param {number} tonicMidi - MIDI da tônica/centro tonal
 * @param {number} semitones - distância em semitons a partir da tônica
 * @returns {number} MIDI da nota resultante
 */
export function degreeToMidi(tonicMidi, semitones) {
  return tonicMidi + semitones;
}

// Progressão de dificuldade (D-06): poucos intervalos fáceis primeiro (5ª e 4ª justas),
// cada tier seguinte é superset do anterior (nunca remove o que já foi introduzido).
export const DIFFICULTY_TIERS = [
  [7, 5], // tier 0: 5ª justa, 4ª justa
  [7, 5, 4, 3], // tier 1: + 3ª maior, 3ª menor
  [7, 5, 4, 3, 2, 1], // tier 2: + 2ª maior, 2ª menor
  [7, 5, 4, 3, 2, 1, 6, 8, 9, 10, 11, 12], // tier 3: todos os semitons até a oitava
];

/**
 * Cria o engine de áudio. O contexto de áudio do navegador só é criado/retomado
 * dentro de resume(), sob gesto do usuário — nunca na importação do módulo.
 */
export function createEngine() {
  let audioContext = null;

  function getContext() {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    return audioContext;
  }

  function resume() {
    const ctx = getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function playTone(freq, durationMs, when = 0, gain = 0.2) {
    const ctx = getContext();
    const startTime = ctx.currentTime + when;
    const durationSec = durationMs / 1000;

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, startTime);

    const gainNode = ctx.createGain();
    // envelope ADSR curto para evitar clique (attack/release rápidos)
    const attack = 0.01;
    const release = 0.05;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + attack);
    gainNode.gain.setValueAtTime(gain, startTime + durationSec - release);
    gainNode.gain.linearRampToValueAtTime(0, startTime + durationSec);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + durationSec);

    return startTime + durationSec;
  }

  function playTonalReference(tonicMidi) {
    const ctx = getContext();
    const freq = midiToFreq(tonicMidi);
    return playTone(freq, 700, 0, 0.2) - ctx.currentTime;
  }

  function playInterval(tonicMidi, semitones) {
    const referenceDurationSec = playTonalReference(tonicMidi);
    const gapAfterReference = 0.15;
    const noteDurationMs = 600;
    const noteGap = 0.1;

    const firstNoteWhen = referenceDurationSec + gapAfterReference;
    playTone(midiToFreq(tonicMidi), noteDurationMs, firstNoteWhen);

    const secondNoteWhen = firstNoteWhen + noteDurationMs / 1000 + noteGap;
    playTone(midiToFreq(degreeToMidi(tonicMidi, semitones)), noteDurationMs, secondNoteWhen);
  }

  function playClick(when = 0, accent = false) {
    const ctx = getContext();
    const startTime = ctx.currentTime + when;
    const freq = accent ? 1500 : 1000;
    const durationSec = 0.03;

    const oscillator = ctx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, startTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(accent ? 0.3 : 0.15, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + durationSec);
  }

  return {
    resume,
    playTone,
    playTonalReference,
    playInterval,
    playClick,
  };
}
