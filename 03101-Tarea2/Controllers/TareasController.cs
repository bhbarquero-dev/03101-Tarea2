using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using _03101_Tarea2.Models;

namespace _03101_Tarea2.Controllers
{
    public class TareasController : Controller
    {
        private const string ClaveSession = "Tareas";
        private const int MaxTitulo = 100;
        private const int MaxDescripcion = 500;
        private static readonly string[] Filtros = { "todas", "pendientes", "completadas" };

        [HttpGet]
        public ActionResult Listar(string filtro)
        {
            filtro = (filtro ?? "").Trim().ToLowerInvariant();
            if (!Filtros.Contains(filtro))
                filtro = "todas";

            var todas = ObtenerTareas();
            IEnumerable<Tarea> visibles = todas;
            if (filtro == "pendientes")
                visibles = todas.Where(t => !t.Completada);
            else if (filtro == "completadas")
                visibles = todas.Where(t => t.Completada);

            return Json(new
            {
                ok = true,
                filtro = filtro,
                tareas = visibles.Select(t => Proyectar(t)).ToList(),
                conteos = new
                {
                    todas = todas.Count,
                    pendientes = todas.Count(t => !t.Completada),
                    completadas = todas.Count(t => t.Completada)
                }
            }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Crear(string titulo, string descripcion)
        {
            titulo = (titulo ?? "").Trim();
            descripcion = (descripcion ?? "").Trim();

            if (titulo.Length == 0)
                return Json(new { ok = false, mensaje = "El título es obligatorio." });
            if (titulo.Length > MaxTitulo)
                return Json(new { ok = false, mensaje = "El título no puede superar " + MaxTitulo + " caracteres." });
            if (descripcion.Length > MaxDescripcion)
                return Json(new { ok = false, mensaje = "La descripción no puede superar " + MaxDescripcion + " caracteres." });

            var tareas = ObtenerTareas();
            var nueva = new Tarea
            {
                Id = tareas.Count == 0 ? 1 : tareas.Max(t => t.Id) + 1,
                Titulo = titulo,
                Descripcion = descripcion,
                Completada = false
            };
            tareas.Add(nueva);

            return Json(new { ok = true, tarea = Proyectar(nueva) });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult MarcarCompletada(int id, bool completada)
        {
            var tarea = ObtenerTareas().FirstOrDefault(t => t.Id == id);
            if (tarea == null)
                return Json(new { ok = false, mensaje = "La tarea no existe (puede que la sesión haya expirado)." });

            tarea.Completada = completada;
            return Json(new { ok = true, tarea = Proyectar(tarea) });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Eliminar(int id)
        {
            var tareas = ObtenerTareas();
            var tarea = tareas.FirstOrDefault(t => t.Id == id);
            if (tarea == null)
                return Json(new { ok = false, mensaje = "La tarea no existe (puede que la sesión haya expirado)." });

            tareas.Remove(tarea);
            return Json(new { ok = true, id = id });
        }

        private List<Tarea> ObtenerTareas()
        {
            var tareas = Session[ClaveSession] as List<Tarea>;
            if (tareas == null)
            {
                tareas = new List<Tarea>();
                Session[ClaveSession] = tareas;
            }
            return tareas;
        }

        private static object Proyectar(Tarea t)
        {
            return new { id = t.Id, titulo = t.Titulo, descripcion = t.Descripcion, completada = t.Completada };
        }
    }
}
