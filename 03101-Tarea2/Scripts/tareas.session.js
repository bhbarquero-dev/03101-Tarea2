var AlmacenSession = (function ($) {
    "use strict";

    function crear(config) {
        return {
            nombre: "session",

            listar: function (filtro) {
                var d = $.Deferred();
                $.ajax({ url: config.urlListar, type: "GET", dataType: "json", cache: false, data: { filtro: filtro } })
                    .done(function (resp) { d.resolve({ tareas: resp.tareas || [], conteos: resp.conteos }); })
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
            },

            cambiarEstado: function (id, completada) {
                var d = $.Deferred();
                $.ajax({
                    url: config.urlEstado,
                    type: "POST",
                    dataType: "json",
                    data: { __RequestVerificationToken: config.obtenerToken(), id: id, completada: completada }
                }).done(function (resp) {
                    if (resp.ok) { d.resolve(resp.tarea); } else { d.reject(resp.mensaje); }
                }).fail(function () {
                    d.reject("No se pudo actualizar la tarea.");
                });
                return d.promise();
            },

            eliminar: function (id) {
                var d = $.Deferred();
                $.ajax({
                    url: config.urlEliminar,
                    type: "POST",
                    dataType: "json",
                    data: { __RequestVerificationToken: config.obtenerToken(), id: id }
                }).done(function (resp) {
                    if (resp.ok) { d.resolve(resp.id); } else { d.reject(resp.mensaje); }
                }).fail(function () {
                    d.reject("No se pudo eliminar la tarea.");
                });
                return d.promise();
            }
        };
    }

    return { crear: crear };
})(jQuery);
