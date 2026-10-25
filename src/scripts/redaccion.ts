// Redacción guiada (components/Redaccion.astro).

import {
  estaHecho,
  marcarHecho,
  pintarSello,
  guardarCodigo,
  leerCodigo,
  borrarCodigo,
  actualizarResumen,
} from './progreso';
import { revisarTexto, conectoresUsados } from './revisar-texto';
import { hablar } from './hablar';

interface Regla {
  re: string;
  msg: string;
}

function b64(s: string): unknown {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))));
}

/** Detalles de forma: mayúscula al empezar y punto al terminar. */
function forma(t: string): string[] {
  const m: string[] = [];
  if (/^[a-z]/.test(t.trim())) m.push('Empezá con <b>mayúscula</b>.');
  if (!/[.!?]$/.test(t.trim())) m.push('Terminá la oración con un <b>punto</b>.');
  return m;
}

function initRedaccion(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const reglas = b64(el.dataset.reglas || '') as Regla[][];
  const minCon = Number(el.dataset.minConectores) || 0;
  const rep = el.dataset.repasar ? (JSON.parse(el.dataset.repasar) as { texto: string; href: string }) : null;
  const salida = el.querySelector<HTMLElement>('[data-salida]')!;
  const final = el.querySelector<HTMLElement>('[data-final]')!;
  const partes = Array.from(el.querySelectorAll<HTMLElement>('.redaccion__parte'));
  const textos = partes.map((p) => p.querySelector<HTMLTextAreaElement>('textarea')!);
  pintarSello(el, estaHecho(titulo));

  try {
    const g = JSON.parse(leerCodigo(titulo) || '[]') as string[];
    textos.forEach((t, k) => (t.value = g[k] || ''));
  } catch {
    /* nada */
  }
  const guardar = () => guardarCodigo(titulo, JSON.stringify(textos.map((t) => t.value)));
  // El cuadro crece con lo que se escribe (en la tablet no hay que scrollear adentro).
  const crecer = (t: HTMLTextAreaElement) => {
    t.style.height = 'auto';
    t.style.height = `${t.scrollHeight + 2}px`;
  };
  textos.forEach((t, k) => {
    crecer(t);
    t.addEventListener('input', () => {
      crecer(t);
      partes[k].classList.remove('is-bien', 'is-mal');
      partes[k].querySelector<HTMLElement>('.completar__expl')!.hidden = true;
      salida.hidden = true;
      final.hidden = true;
      guardar();
    });
  });

  const revisarParte = (k: number): boolean => {
    const t = textos[k].value;
    const msgs: string[] = [];
    if (!t.trim()) msgs.push('Falta escribir esta parte.');
    else {
      for (const r of reglas[k] || []) if (!new RegExp(r.re, 'i').test(t)) msgs.push(r.msg);
      msgs.push(...revisarTexto(t), ...forma(t));
    }
    const ok = msgs.length === 0;
    partes[k].classList.toggle('is-bien', ok);
    partes[k].classList.toggle('is-mal', !ok);
    const expl = partes[k].querySelector<HTMLElement>('.completar__expl')!;
    const lineas = msgs.map((m) => `🔎 ${m}`);
    if (!ok && rep && t.trim()) lineas.push(`📖 Repasá: <a href="${rep.href}">${rep.texto}</a>`);
    expl.innerHTML = lineas.map((l) => `<p>${l}</p>`).join('');
    expl.hidden = ok;
    return ok;
  };

  el.querySelector('[data-verify]')!.addEventListener('click', () => {
    const bien = partes.filter((_, k) => revisarParte(k)).length;
    const todo = textos.map((t) => t.value.trim()).filter(Boolean).join(' ');
    const usados = conectoresUsados(todo);
    const faltanCon = Math.max(0, minCon - usados.length);
    salida.hidden = false;

    const lineaCon = usados.length
      ? `🔗 Conectores que usaste: <b lang="en">${usados.join(', ')}</b>.`
      : '🔗 Todavía no usaste ningún conector.';
    if (bien === partes.length && !faltanCon) {
      salida.className = 'ejercicio__salida is-ok';
      salida.innerHTML = `✅ ¡Muy bien! No encontré errores. ${lineaCon}`;
      marcarHecho(titulo);
      pintarSello(el, true);
      el.querySelector<HTMLElement>('[data-texto]')!.textContent = todo;
      final.hidden = false;
    } else {
      salida.className = 'ejercicio__salida is-error';
      salida.innerHTML =
        (bien < partes.length
          ? `Van ${bien} de ${partes.length} partes sin errores. Debajo de las que están en rojo tenés qué revisar.<br>`
          : '') +
        lineaCon +
        (faltanCon
          ? ` Sumá ${faltanCon === 1 ? 'uno más' : `${faltanCon} más`} para que el texto quede unido (abrí la 🧰 ayuda de arriba).`
          : '');
    }
  });

  el.querySelector('[data-escuchar]')!.addEventListener('click', () =>
    hablar(el.querySelector('[data-texto]')!.textContent || ''),
  );
  el.querySelector('[data-copiar]')!.addEventListener('click', async (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    try {
      await navigator.clipboard.writeText(el.querySelector('[data-texto]')!.textContent || '');
      b.textContent = '✓ Copiado';
    } catch {
      b.textContent = 'No se pudo copiar';
    }
    setTimeout(() => (b.textContent = '📋 Copiar'), 1800);
  });

  el.querySelector('[data-reset]')!.addEventListener('click', () => {
    if (textos.some((t) => t.value.trim()) && !confirm('¿Borrar todo lo que escribiste en esta redacción?')) return;
    textos.forEach((t, k) => {
      t.value = '';
      crecer(t);
      partes[k].classList.remove('is-bien', 'is-mal');
      partes[k].querySelector<HTMLElement>('.completar__expl')!.hidden = true;
    });
    salida.hidden = true;
    final.hidden = true;
    borrarCodigo(titulo);
  });
}

function boot(): void {
  document.querySelectorAll<HTMLElement>('.redaccion').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    initRedaccion(el);
  });
  actualizarResumen();
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
