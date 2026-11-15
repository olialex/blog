# Enlaces externos

El layout `src/layouts/Base.astro` carga `src/scripts/enlaces-externos.js` en todas las páginas.

El módulo detecta enlaces HTTP/HTTPS cuyo `origin` es distinto al del blog y les asigna:

- `target="_blank"`
- `rel="noopener noreferrer"` (conservando otros valores `rel` que ya existan)

Los enlaces internos conservan su comportamiento. También se ignoran protocolos como `mailto:`, `tel:` y `javascript:`. Un `MutationObserver` permite procesar enlaces que se agreguen después de cargar la página.

No es necesario modificar los artículos Markdown ni los componentes. Para comprobarlo, abre un artículo, inspecciona un enlace externo y verifica que tenga los atributos anteriores. Los enlaces internos deben seguir sin `target="_blank"` salvo que lo hayas establecido expresamente.
