/*
 * Lista de tareas - jQuery + AJAX.
 * Partes 2 y 7: listar y crear tareas, con selector de modo de almacenamiento
 * (Session en el servidor o LocalStorage en el navegador).
 *
 * Este archivo solo maneja la pantalla. El acceso a los datos está separado:
 *   - tareas.session.js : almacén en el servidor (Session, vía AJAX)
 *   - tareas.local.js   : almacén en el navegador (LocalStorage)
 * Ambos deben cargarse antes que este archivo y ofrecen el mismo contrato.
 */
$(function () {
    "use strict";

    var $app = $("#app-tareas");
    var $lista = $("#lista-tareas");
    var $sinTareas = $("#sin-tareas");
    var $mensajes = $("#mensajes");
    var $descripcionModo = $("#modo-descripcion");

    var CLAVE_MODO = "tareas.modo";

    var almacenes = {
        session: AlmacenSession.crear({
            urlListar: $app.data("url-listar"),
            urlCrear: $app.data("url-crear"),
            obtenerToken: function () { return $("#form-tarea input[name='__RequestVerificationToken']").val(); }
        }),
        local: AlmacenLocal.crear()
    };

    var nombresModo = { session: "Session (servidor)", local: "LocalStorage (cliente)" };
    var descripcionesModo = {
        session: "Las tareas viven en el servidor (Session). El navegador solo guarda la cookie de sesión.",
        local: "Las tareas viven en este navegador (LocalStorage). No se envían al servidor."
    };

    // Copia en memoria de las tareas del modo activo (solo para dibujar la lista).
    var tareas = [];

    /* ---------- Modo activo (se recuerda entre recargas) ---------- */
    function leerModoGuardado() {
        try {
            var m = window.localStorage.getItem(CLAVE_MODO);
            return (m === "session" || m === "local") ? m : "session";
        } catch (e) {
            return "session";
        }
    }

    function guardarModo(m) {
        try { window.localStorage.setItem(CLAVE_MODO, m); } catch (e) { /* sin almacenamiento: se ignora */ }
    }

    var modo = leerModoGuardado();

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
    // Importante también con LocalStorage: cualquiera puede editar esos datos desde las herramientas del navegador.
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

    /* ---------- Cargar tareas del modo activo ---------- */
    function cargarTareas() {
        var modoSolicitado = modo;
        almacenes[modoSolicitado].listar().done(function (lista) {
            if (modoSolicitado !== modo) { return; }   // el usuario cambió de modo mientras se esperaba
            tareas = lista;
            renderizar();
        }).fail(function (mensaje) {
            if (modoSolicitado !== modo) { return; }
            tareas = [];
            renderizar();
            mostrarMensaje("danger", mensaje);
        });
    }

    /* ---------- Selector de modo ---------- */
    function aplicarModoEnPantalla() {
        $("#modo-" + modo).prop("checked", true);
        $descripcionModo.text(descripcionesModo[modo]);
    }

    $("input[name='modo']").on("change", function () {
        modo = this.value;
        guardarModo(modo);
        aplicarModoEnPantalla();
        mostrarMensaje("info", "Modo activo: " + nombresModo[modo] + ". Cada modo tiene su propia lista.");
        cargarTareas();
    });

    /* ---------- Crear tarea ---------- */
    $("#form-tarea").on("submit", function (e) {
        e.preventDefault();

        var $form = $(this);
        var $titulo = $("#titulo");

        // Validación rápida en el cliente (el servidor y el almacén local la repiten).
        if ($.trim($titulo.val()) === "") {
            $titulo.addClass("is-invalid").trigger("focus");
            return;
        }
        $titulo.removeClass("is-invalid");

        almacenes[modo].crear($titulo.val(), $("#descripcion").val()).done(function (tarea) {
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

    aplicarModoEnPantalla();
    cargarTareas();
});
