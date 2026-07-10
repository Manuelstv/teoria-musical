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
    [7, 5, 4, 3, 2, 1, 6, 8, 9, 10, 11, 12], // tier 3: todos os semitons até a oitava
  ];

  /**
   * Cria o engine de áudio. O contexto de áudio do navegador só é criado/retomado
   * dentro de resume(), sob gesto do usuário — nunca na importação do módulo.
   */
  function createEngine() {
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

    // Terceiro report de volume baixo (0.2 -> 0.45 -> 0.8, todos insuficientes):
    // subir só o número de novo não ataca a causa real. Investigação:
    // 1) Envelope já sustenta no pico (attack 10ms, sustain constante, só decai nos
    //    últimos 50ms) — não é o formato do envelope.
    // 2) Duração das notas (600-700ms) já está acima do limiar de ~300-400ms em que
    //    o ouvido registra "sustentado"; alongar mais não muda percepção de volume.
    // 3) A causa real: onda senoidal pura não tem harmônicos (só a fundamental) — o
    //    ouvido humano percebe timbres com mais conteúdo harmônico como
    //    significativamente mais "cheios"/altos, mesmo em amplitude de pico igual
    //    (efeito psicoacústico bem documentado, curvas de loudness equal não são
    //    lineares em amplitude simples). Onda triangular tem harmônicos ímpares com
    //    queda 1/n² — soma energia perceptível sem soar áspera (ao contrário de
    //    square/sawtooth), permitida no CLAUDE.md do projeto.
    // Fix combinado: triangle em vez de sine (ataca a causa raiz) + teto de gain
    // subido para 0.95 (headroom real, pico continua < 1.0, sem overlap entre notas
    // -> sem risco de clipping).
    function playTone(freq, durationMs, when = 0, gain = 0.95) {
      const ctx = getContext();
      const startTime = ctx.currentTime + when;
      const durationSec = durationMs / 1000;

      const oscillator = ctx.createOscillator();
      oscillator.type = 'triangle';
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

    // `gain` exposto no nível de playTonalReference/playInterval (não só playTone)
    // pra permitir controle de volume pelo usuário (slider no widget) em vez de
    // depender só do default fixo do engine — ver interval-drill.html #volume-slider.
    function playTonalReference(tonicMidi, gain = 0.95) {
      const ctx = getContext();
      const freq = midiToFreq(tonicMidi);
      return playTone(freq, 700, 0, gain) - ctx.currentTime;
    }

    function playInterval(tonicMidi, semitones, gain = 0.95) {
      const referenceDurationSec = playTonalReference(tonicMidi, gain);
      const gapAfterReference = 0.15;
      const noteDurationMs = 600;
      const noteGap = 0.1;

      const firstNoteWhen = referenceDurationSec + gapAfterReference;
      playTone(midiToFreq(tonicMidi), noteDurationMs, firstNoteWhen, gain);

      const secondNoteWhen = firstNoteWhen + noteDurationMs / 1000 + noteGap;
      playTone(midiToFreq(degreeToMidi(tonicMidi, semitones)), noteDurationMs, secondNoteWhen, gain);
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

  return {
    midiToFreq,
    degreeToMidi,
    DIFFICULTY_TIERS,
    createEngine,
  };
});
