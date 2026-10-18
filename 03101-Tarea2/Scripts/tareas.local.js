/*
 * Almacén LOCALSTORAGE: las tareas viven en el navegador (window.localStorage).
 * No hace ninguna petición al servidor: lee y escribe directamente en el cliente,
 * por lo que aquí también hay que aplicar las reglas de validación.
 *
 * Contrato común de los almacenes (ver también tareas.session.js):
 *   listar()                    -> promesa que resuelve con un arreglo de tareas
 *   crear(titulo, descripcion)  -> promesa que resuelve con la tarea creada
 * Si algo falla, la promesa se rechaza con un texto para mostrar al usuario.
 */
var AlmacenLocal = (function ($) {
    "use strict";

    var CLAVE = "tareas.lista";
    var MAX_TITULO = 100;
    var MAX_DESCRIPCION = 500;

    // Mismas reglas que valida el servidor en TareasController.Crear.
    function validar(titulo, descripcion) {
        if (titulo.length === 0) { return "El título es obligatorio."; }
        if (titulo.length > MAX_TITULO) { return "El título no puede superar " + MAX_TITULO + " caracteres."; }
        if (descripcion.length > MAX_DESCRIPCION) { return "La descripción no puede superar " + MAX_DESCRIPCION + " caracteres."; }
        return null;
    }

    function leer() {
        var texto = window.localStorage.getItem(CLAVE);
        return texto ? JSON.parse(texto) : [];
    }

    function guardar(lista) {
        window.localStorage.setItem(CLAVE, JSON.stringify(lista));
    }

    function crear() {
        return {
            nombre: "local",

            listar: function () {
                var d = $.Deferred();
                try {
                    d.resolve(leer());
                } catch (e) {
                    d.reject("No se pudo leer LocalStorage.");
                }
                return d.promise();
            },

            crear: function (titulo, descripcion) {
                var d = $.Deferred();
                titulo = $.trim(titulo);
                descripcion = $.trim(descripcion);

                var error = validar(titulo, descripcion);
                if (error) { return d.reject(error).promise(); }

                try {
                    var lista = leer();
                    var maxId = 0;
                    $.each(lista, function (_, t) { if (t.id > maxId) { maxId = t.id; } });

                    var nueva = { id: maxId + 1, titulo: titulo, descripcion: descripcion, completada: false };
                    lista.push(nueva);
                    guardar(lista);
                    d.resolve(nueva);
                } catch (e) {
                    d.reject("No se pudo guardar en LocalStorage (almacenamiento lleno o bloqueado).");
                }
                return d.promise();
            }
        };
    }

    return { crear: crear };
})(jQuery);
