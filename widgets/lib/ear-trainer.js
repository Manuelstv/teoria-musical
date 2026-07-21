// Engine Web Audio compartilhado (SYS-04).
//
// Formato UMD (Rule 1 fix, checkpoint 01-02): widgets abrem por duplo-clique como
// arquivo file:// — Chrome/Edge bloqueiam `<script type="module">` importando outro
// arquivo nesse contexto (CORS em origem file://), o que falha em silêncio e derruba
// o script inteiro (nenhum listener de clique chega a ser registrado). Script clássico
// `<script src="...">` não sofre essa restrição. Este arquivo funciona tanto via
// `require()` no Node (testes) quanto via `<script src>` clássico no navegador,
// expondo `globalThis.EarTrainer`.
(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    global.EarTrainer = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Converte nota MIDI para frequência (afinação A440).
   * @param {number} midi
   * @returns {number} frequência em Hz
   */
  function midiToFreq(midi) {
    return 440 * 2 ** ((midi - 69) / 12);
  }

  /**
   * Enquadra um grau (semitons a partir da tônica) em uma nota MIDI concreta (INT-01/D-07).
   * @param {number} tonicMidi - MIDI da tônica/centro tonal
   * @param {number} semitones - distância em semitons a partir da tônica
   * @returns {number} MIDI da nota resultante
   */
  function degreeToMidi(tonicMidi, semitones) {
    return tonicMidi + semitones;
  }

  // Progressão de dificuldade (D-06): poucos intervalos fáceis primeiro (5ª e 4ª justas),
  // cada tier seguinte é superset do anterior (nunca remove o que já foi introduzido).
  const DIFFICULTY_TIERS = [
    [7, 5], // tier 0: 5ª justa, 4ª justa
    [7, 5, 4, 3], // tier 1: + 3ª maior, 3ª menor
    [7, 5, 4, 3, 2, 1], // tier 2: + 2ª maior, 2ª menor
    [7, 5, 4, 3, 2, 1, 6, 8, 9], // tier 3: + trítono, 6ª menor, 6ª maior (9 intervalos)
    [7, 5, 4, 3, 2, 1, 6, 8, 9, 10, 11, 12], // tier 4: todos os semitons até a oitava
  ];

  /**
   * Cria o engine de áudio. O contexto de áudio do navegador só é criado/retomado
   * dentro de resume(), sob gesto do usuário — nunca na importação do módulo.
   */
  function createEngine() {
    let audioContext = null;
    let pianoPromise = null;

    function getContext() {
      if (!audioContext) {
        audioContext = new AudioContext();
      }
      return audioContext;
    }

    // Timbre de piano real via soundfont-player (global `Soundfont`, carregado por
    // <script> no HTML antes deste arquivo) em vez de oscilador. Só é viável fora do
    // sandbox de Artifact — aqui é um site de verdade com rede, então o sample é só
    // um fetch, não MBs embutidos. Promise memoizada: o fetch do instrumento só
    // acontece uma vez por sessão.
    function getPiano() {
      if (!pianoPromise) {
        pianoPromise = Soundfont.instrument(getContext(), 'acoustic_grand_piano');
      }
      return pianoPromise;
    }

    function resume() {
      const ctx = getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      getPiano(); // dispara o fetch do sample o quanto antes, sob o mesmo gesto do usuário
      return ctx;
    }

    function midiToNoteName(midi) {
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const octave = Math.floor(midi / 12) - 1;
      return `${names[midi % 12]}${octave}`;
    }

    function scheduleNote(piano, ctx, midi, durationMs, when, gain) {
      const startTime = ctx.currentTime + when;
      const durationSec = durationMs / 1000;
      piano.play(midiToNoteName(midi), startTime, { duration: durationSec, gain });
      return startTime + durationSec;
    }

    // `gain` exposto no nível de playTonalReference/playInterval pra permitir controle
    // de volume pelo usuário (slider no widget) em vez de depender só de um default
    // fixo — ver interval-drill.html #volume-slider.
    async function playTonalReference(tonicMidi, gain = 0.95) {
      const ctx = getContext();
      const piano = await getPiano();
      return scheduleNote(piano, ctx, tonicMidi, 700, 0, gain) - ctx.currentTime;
    }

    async function playInterval(tonicMidi, semitones, gain = 0.95) {
      const ctx = getContext();
      const piano = await getPiano();
      const referenceDurationSec = scheduleNote(piano, ctx, tonicMidi, 700, 0, gain) - ctx.currentTime;

      const gapAfterReference = 0.15;
      const noteDurationMs = 1200; // 2ª nota (o intervalo) soa o dobro da duração anterior (600ms) — pedido do usuário

      const noteWhen = referenceDurationSec + gapAfterReference;
      scheduleNote(piano, ctx, degreeToMidi(tonicMidi, semitones), noteDurationMs, noteWhen, gain);
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
      playTonalReference,
      playInterval,
      playClick,
    };
  }

  return {
    midiToFreq,
    degreeToMidi,
    DIFFICULTY_TIERS,
    createEngine,
  };
});
