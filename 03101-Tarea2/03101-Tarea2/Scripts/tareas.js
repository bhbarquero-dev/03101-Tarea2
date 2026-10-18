/*
 * Lista de tareas - jQuery + AJAX.
 * Parte 2: listar y crear tareas (estado en Session, en el servidor).
 */
$(function () {
    "use strict";

    var $app = $("#app-tareas");
    var urlListar = $app.data("url-listar");
    var urlCrear = $app.data("url-crear");

    var $lista = $("#lista-tareas");
    var $sinTareas = $("#sin-tareas");
    var $mensajes = $("#mensajes");

    // Copia local de las tareas que devolvió el servidor (solo para dibujar la lista).
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

    /* ---------- AJAX: listar ---------- */
    function cargarTareas() {
        $.ajax({
            url: urlListar,
            type: "GET",
            dataType: "json",
            cache: false
        }).done(function (resp) {
            tareas = resp.tareas || [];
            renderizar();
        }).fail(function () {
            mostrarMensaje("danger", "No se pudieron cargar las tareas.");
        });
    }

    /* ---------- AJAX: crear ---------- */
    $("#form-tarea").on("submit", function (e) {
        e.preventDefault();

        var $form = $(this);
        var $titulo = $("#titulo");

        // Validación en el cliente (el servidor la repite).
        if ($.trim($titulo.val()) === "") {
            $titulo.addClass("is-invalid").trigger("focus");
            return;
        }
        $titulo.removeClass("is-invalid");

        $.ajax({
            url: urlCrear,
            type: "POST",
            data: $form.serialize(),   // incluye el token antiforgery
            dataType: "json"
        }).done(function (resp) {
            if (resp.ok) {
                tareas.push(resp.tarea);
                renderizar();
                $form[0].reset();
                $titulo.trigger("focus");
                mostrarMensaje("success", "Tarea creada.");
            } else {
                mostrarMensaje("danger", resp.mensaje);
            }
        }).fail(function () {
            mostrarMensaje("danger", "No se pudo crear la tarea.");
        });
    });

    $("#titulo").on("input", function () {
        $(this).removeClass("is-invalid");
    });

    cargarTareas();
});
