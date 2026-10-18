/*
 * PREFERENCIAS de la vista, guardadas en LocalStorage (en el navegador).
 *
 * Aquí NO se guardan las tareas: esas viven en Session (servidor).
 * Las preferencias son datos de comodidad de cada usuario/navegador:
 * si se pierden, la aplicación sigue funcionando con los valores predeterminados.
 *
 * LocalStorage lo puede editar el usuario desde las herramientas del navegador,
 * por eso cada valor leído se valida antes de usarse.
 */
var Preferencias = (function ($) {
    "use strict";

    var CLAVE = "tareas.preferencias";

    var PREDETERMINADAS = {
        ocultarDescripciones: false
    };

    // Devuelve un objeto con solo los campos permitidos y con valores válidos.
    function limpiar(obj) {
        var limpio = $.extend({}, PREDETERMINADAS);
        if (obj && typeof obj === "object") {
            if (obj.ocultarDescripciones === true) { limpio.ocultarDescripciones = true; }
        }
        return limpio;
    }

    function leer() {
        try {
            var texto = window.localStorage.getItem(CLAVE);
            return limpiar(texto ? JSON.parse(texto) : null);
        } catch (e) {
            return limpiar(null);   // almacenamiento bloqueado o JSON dañado: valores predeterminados
        }
    }

    // Guarda los cambios indicados y devuelve las preferencias resultantes.
    function guardar(cambios) {
        var nuevas = limpiar($.extend({}, leer(), cambios));
        try {
            window.localStorage.setItem(CLAVE, JSON.stringify(nuevas));
        } catch (e) {
            /* sin almacenamiento: la preferencia vale solo mientras la página esté abierta */
        }
        return nuevas;
    }

    return { leer: leer, guardar: guardar };
})(jQuery);
