/*
 * Almacén SESSION: las tareas viven en el servidor (Session de ASP.NET).
 * Este archivo no guarda nada: solo hace peticiones AJAX a TareasController.
 * Las reglas de validación las aplica el servidor.
 *
 * Contrato común de los almacenes (ver también tareas.local.js):
 *   listar()                    -> promesa que resuelve con un arreglo de tareas
 *   crear(titulo, descripcion)  -> promesa que resuelve con la tarea creada
 * Si algo falla, la promesa se rechaza con un texto para mostrar al usuario.
 */
var AlmacenSession = (function ($) {
    "use strict";

    // config: { urlListar, urlCrear, obtenerToken }
    function crear(config) {
        return {
            nombre: "session",

            listar: function () {
                var d = $.Deferred();
                $.ajax({ url: config.urlListar, type: "GET", dataType: "json", cache: false })
                    .done(function (resp) { d.resolve(resp.tareas || []); })
                    .fail(function () { d.reject("No se pudieron cargar las tareas."); });
                return d.promise();
            },

            crear: function (titulo, descripcion) {
                var d = $.Deferred();
                $.ajax({
                    url: config.urlCrear,
                    type: "POST",
                    dataType: "json",
                    data: { __RequestVerificationToken: config.obtenerToken(), titulo: titulo, descripcion: descripcion }
                }).done(function (resp) {
                    if (resp.ok) { d.resolve(resp.tarea); } else { d.reject(resp.mensaje); }
                }).fail(function () {
                    d.reject("No se pudo crear la tarea.");
                });
                return d.promise();
            }
        };
    }

    return { crear: crear };
})(jQuery);
