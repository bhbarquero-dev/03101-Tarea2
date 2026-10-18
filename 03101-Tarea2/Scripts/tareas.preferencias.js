var Preferencias = (function ($) {
    "use strict";

    var CLAVE = "tareas.preferencias";

    var PREDETERMINADAS = {
        ocultarDescripciones: false
    };

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
            return limpiar(null);
        }
    }

    function guardar(cambios) {
        var nuevas = limpiar($.extend({}, leer(), cambios));
        try {
            window.localStorage.setItem(CLAVE, JSON.stringify(nuevas));
        } catch (e) { }
        return nuevas;
    }

    return { leer: leer, guardar: guardar };
})(jQuery);
