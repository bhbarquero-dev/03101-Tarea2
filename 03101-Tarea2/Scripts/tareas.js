/*
 * Lista de tareas - jQuery + AJAX.
 *
 * Estrategia HÍBRIDA de estado:
 *   - DATOS (las tareas)        -> Session, en el servidor, vía AJAX  (tareas.session.js)
 *   - PREFERENCIAS de la vista  -> LocalStorage, en el navegador      (tareas.preferencias.js)
 *
 * Este archivo solo maneja la pantalla. Ambos archivos deben cargarse antes.
 */
$(function () {
    "use strict";

    var $app = $("#app-tareas");
    var $lista = $("#lista-tareas");
    var $sinTareas = $("#sin-tareas");
    var $mensajes = $("#mensajes");
    var $prefOcultarDescripciones = $("#pref-ocultar-descripciones");

    // Acceso a los datos (servidor).
    var api = AlmacenSession.crear({
        urlListar: $app.data("url-listar"),
        urlCrear: $app.data("url-crear"),
        obtenerToken: function () { return $("#form-tarea input[name='__RequestVerificationToken']").val(); }
    });

    // Preferencias (navegador).
    var preferencias = Preferencias.leer();

    // Copia en memoria de las tareas del servidor (solo para dibujar la lista).
    var tareas = [];

    /* ---------- Mensajes ---------- */
    function mostrarMensaje(tipo, texto) {
        var $alerta = $('<div class="alert alert-dismissible fade show" role="alert"></div>')
            .addClass("alert-" + tipo)
            .text(texto)
            .append('<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>');
        $mensajes.empty().append($alerta);
    }

    /* ---------- Dibujar la lista ---------- */
    // Se usa .text() (no concatenar HTML) para que el texto del usuario nunca se interprete como código.
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

    function actualizarContadores() {
        var completadas = tareas.filter(function (t) { return t.completada; }).length;
        $("#cont-todas").text(tareas.length);
        $("#cont-pendientes").text(tareas.length - completadas);
        $("#cont-completadas").text(completadas);
    }

    function renderizar() {
        $lista.empty();
        $.each(tareas, function (_, t) {
            $lista.append(crearItem(t));
        });
        $sinTareas.toggleClass("d-none", tareas.length > 0);
        actualizarContadores();
    }

    /* ---------- Preferencias (LocalStorage) ---------- */
    function aplicarPreferencias() {
        $lista.toggleClass("ocultar-descripciones", preferencias.ocultarDescripciones);
        $prefOcultarDescripciones.prop("checked", preferencias.ocultarDescripciones);
    }

    $prefOcultarDescripciones.on("change", function () {
        preferencias = Preferencias.guardar({ ocultarDescripciones: this.checked });
        aplicarPreferencias();
    });

    /* ---------- Datos (Session, vía AJAX) ---------- */
    function cargarTareas() {
        api.listar().done(function (lista) {
            tareas = lista;
            renderizar();
        }).fail(function (mensaje) {
            mostrarMensaje("danger", mensaje);
        });
    }

    $("#form-tarea").on("submit", function (e) {
        e.preventDefault();

        var $form = $(this);
        var $titulo = $("#titulo");

        // Validación rápida en el cliente (el servidor la repite).
        if ($.trim($titulo.val()) === "") {
            $titulo.addClass("is-invalid").trigger("focus");
            return;
        }
        $titulo.removeClass("is-invalid");

        api.crear($titulo.val(), $("#descripcion").val()).done(function (tarea) {
            tareas.push(tarea);
            renderizar();
            $form[0].reset();
            $titulo.trigger("focus");
            mostrarMensaje("success", "Tarea creada.");
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
