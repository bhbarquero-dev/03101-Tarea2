$(function () {
    "use strict";

    var $app = $("#app-tareas");
    var $lista = $("#lista-tareas");
    var $sinTareas = $("#sin-tareas");
    var $mensajes = $("#mensajes");
    var $filtros = $("input[name='filtro']");
    var $prefOcultarDescripciones = $("#pref-ocultar-descripciones");

    var api = AlmacenSession.crear({
        urlListar: $app.data("url-listar"),
        urlCrear: $app.data("url-crear"),
        urlEditar: $app.data("url-editar"),
        urlEstado: $app.data("url-estado"),
        urlEliminar: $app.data("url-eliminar"),
        obtenerToken: function () { return $("#form-tarea input[name='__RequestVerificationToken']").val(); }
    });

    var preferencias = Preferencias.leer();
    var ultimaPeticion = 0;

    function mostrarMensaje(tipo, texto) {
        var $alerta = $('<div class="alert alert-dismissible fade show" role="alert"></div>')
            .addClass("alert-" + tipo)
            .text(texto)
            .append('<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>');
        $mensajes.empty().append($alerta);
    }

    function crearItem(t) {
        var $check = $('<input class="form-check-input mt-1 tarea-check" type="checkbox">')
            .prop("checked", t.completada)
            .attr("aria-label", t.completada ? "Marcar como pendiente" : "Marcar como completada");

        var $titulo = $('<div class="tarea-titulo fw-semibold"></div>').text(t.titulo);
        var $descripcion = $('<div class="tarea-descripcion text-muted small"></div>').text(t.descripcion);

        var $acciones = $('<div class="btn-group btn-group-sm" role="group" aria-label="Acciones de la tarea"></div>')
            .append('<button type="button" class="btn btn-outline-primary btn-editar">Editar</button>')
            .append('<button type="button" class="btn btn-outline-danger btn-eliminar">Eliminar</button>');

        var $fila = $('<div class="d-flex align-items-start gap-3"></div>')
            .append($check)
            .append($('<div class="flex-grow-1"></div>').append($titulo).append($descripcion))
            .append($acciones);

        return $('<li class="list-group-item tarea-item"></li>')
            .attr("data-id", t.id)
            .attr("data-completada", t.completada)
            .toggleClass("tarea-completada", t.completada)
            .append($fila);
    }

    function renderizar(tareas, conteos) {
        $lista.empty();
        $.each(tareas, function (_, t) {
            $lista.append(crearItem(t));
        });
        $sinTareas.toggleClass("d-none", tareas.length > 0);
        $("#cont-todas").text(conteos.todas);
        $("#cont-pendientes").text(conteos.pendientes);
        $("#cont-completadas").text(conteos.completadas);
    }

    function cargarTareas() {
        var peticion = ++ultimaPeticion;
        api.listar(preferencias.filtro).done(function (resp) {
            if (peticion !== ultimaPeticion) { return; }
            renderizar(resp.tareas, resp.conteos);
        }).fail(function (mensaje) {
            if (peticion !== ultimaPeticion) { return; }
            mostrarMensaje("danger", mensaje);
        });
    }

    function aplicarPreferencias() {
        $lista.toggleClass("ocultar-descripciones", preferencias.ocultarDescripciones);
        $prefOcultarDescripciones.prop("checked", preferencias.ocultarDescripciones);
        $("#filtro-" + preferencias.filtro).prop("checked", true);
    }

    $prefOcultarDescripciones.on("change", function () {
        preferencias = Preferencias.guardar({ ocultarDescripciones: this.checked });
        aplicarPreferencias();
    });

    $filtros.on("change", function () {
        preferencias = Preferencias.guardar({ filtro: this.value });
        cargarTareas();
    });

    $lista.on("change", ".tarea-check", function () {
        var $check = $(this);
        var id = parseInt($check.closest(".tarea-item").attr("data-id"), 10);

        $check.prop("disabled", true);

        api.cambiarEstado(id, this.checked).done(function () {
            cargarTareas();
        }).fail(function (mensaje) {
            mostrarMensaje("danger", mensaje);
            $check.prop("disabled", false);
            cargarTareas();
        });
    });

    var modalEditar = bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-editar"));
    var $formEditar = $("#form-editar");
    var $editarTitulo = $("#editar-titulo");

    $lista.on("click", ".btn-editar", function () {
        var $item = $(this).closest(".tarea-item");
        $("#editar-id").val($item.attr("data-id"));
        $editarTitulo.removeClass("is-invalid").val($item.find(".tarea-titulo").text());
        $("#editar-descripcion").val($item.find(".tarea-descripcion").text());
        modalEditar.show();
    });

    $("#modal-editar").on("shown.bs.modal", function () {
        $editarTitulo.trigger("focus");
    });

    $editarTitulo.on("input", function () {
        $(this).removeClass("is-invalid");
    });

    $formEditar.on("submit", function (e) {
        e.preventDefault();

        if ($.trim($editarTitulo.val()) === "") {
            $editarTitulo.addClass("is-invalid").trigger("focus");
            return;
        }

        var id = parseInt($("#editar-id").val(), 10);
        var $btnGuardar = $formEditar.find("button[type='submit']");

        $btnGuardar.prop("disabled", true);

        api.editar(id, $editarTitulo.val(), $("#editar-descripcion").val()).done(function () {
            mostrarMensaje("success", "Tarea actualizada.");
            cargarTareas();
        }).fail(function (mensaje) {
            mostrarMensaje("danger", mensaje);
            cargarTareas();
        }).always(function () {
            $btnGuardar.prop("disabled", false);
            modalEditar.hide();
        });
    });

    var modalEliminar = bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-eliminar"));
    var $btnConfirmarEliminar = $("#btn-confirmar-eliminar");

    $lista.on("click", ".btn-eliminar", function () {
        var $item = $(this).closest(".tarea-item");
        $("#eliminar-id").val($item.attr("data-id"));
        $("#eliminar-nombre").text($item.find(".tarea-titulo").text());
        modalEliminar.show();
    });

    $btnConfirmarEliminar.on("click", function () {
        var id = parseInt($("#eliminar-id").val(), 10);

        $btnConfirmarEliminar.prop("disabled", true);

        api.eliminar(id).done(function () {
            mostrarMensaje("success", "Tarea eliminada.");
            cargarTareas();
        }).fail(function (mensaje) {
            mostrarMensaje("danger", mensaje);
            cargarTareas();
        }).always(function () {
            $btnConfirmarEliminar.prop("disabled", false);
            modalEliminar.hide();
        });
    });

    $("#form-tarea").on("submit", function (e) {
        e.preventDefault();

        var $form = $(this);
        var $titulo = $("#titulo");

        if ($.trim($titulo.val()) === "") {
            $titulo.addClass("is-invalid").trigger("focus");
            return;
        }
        $titulo.removeClass("is-invalid");

        api.crear($titulo.val(), $("#descripcion").val()).done(function () {
            $form[0].reset();
            $titulo.trigger("focus");
            mostrarMensaje("success", "Tarea creada.");
            cargarTareas();
        }).fail(function (mensaje) {
            mostrarMensaje("danger", mensaje);
        });
    });

    $("#titulo").on("input", function () {
        $(this).removeClass("is-invalid");
    });

    aplicarPreferencias();
    cargarTareas();
});
