using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using _03101_Tarea2.Models;

namespace _03101_Tarea2.Controllers
{
    /// <summary>
    /// Endpoints AJAX (JSON) de la lista de tareas.
    /// El estado se guarda en Session, es decir, en el servidor:
    /// el navegador solo conserva la cookie con el identificador de sesión.
    /// </summary>
    public class TareasController : Controller
    {
        private const string ClaveSession = "Tareas";
        private const int MaxTitulo = 100;
        private const int MaxDescripcion = 500;

        // GET /Tareas/Listar
        [HttpGet]
        public ActionResult Listar()
        {
            var tareas = ObtenerTareas().Select(t => Proyectar(t)).ToList();
            return Json(new { ok = true, tareas = tareas }, JsonRequestBehavior.AllowGet);
        }

        // POST /Tareas/Crear
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

        // Obtiene la lista guardada en Session (la crea si es la primera vez).
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

        // Objeto que se envía al navegador (nombres en minúscula para JavaScript).
        private static object Proyectar(Tarea t)
        {
            return new { id = t.Id, titulo = t.Titulo, descripcion = t.Descripcion, completada = t.Completada };
        }
    }
}
