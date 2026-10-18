using System;

namespace _03101_Tarea2.Models
{
    /// <summary>
    /// Representa una tarea de la lista de pendientes.
    /// [Serializable] permite guardarla en Session aunque cambie el modo
    /// de almacenamiento (StateServer / SQL Server), no solo InProc.
    /// </summary>
    [Serializable]
    public class Tarea
    {
        public int Id { get; set; }
        public string Titulo { get; set; }
        public string Descripcion { get; set; }
        public bool Completada { get; set; }
    }
}
